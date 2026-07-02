import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { clientIp, createRateLimiter, crossOriginResponse, isSameOrigin } from "@/lib/api/guard";
import { CHAT_EFFORT, CHAT_MODEL, CHAT_SUPPORTS_ADAPTIVE } from "@/lib/chat/config";
import { resolveId } from "@/lib/chat/tools";
import { getPokedex } from "@/lib/pokedex";
import { prettifyName } from "@/lib/utils";

export const runtime = "nodejs";

/**
 * AI team builder: the user describes the team they want in plain Spanish
 * ("el mejor equipo equilibrado", "un equipo con Charizard"…) and Claude
 * proposes up to 6 Pokémon with reasons. The proposal is validated against the
 * local index (names → real dex ids), so nothing invented ever reaches the UI.
 */

const bodySchema = z.object({
  prompt: z.string().min(4).max(500),
  /** Current team member names, for "mejora/completa mi equipo" requests. */
  team: z.array(z.string().max(40)).max(6).optional(),
});

/** Structured-output schema the model must follow (validated again with zod). */
const PROPOSAL_JSON_SCHEMA = {
  type: "object" as const,
  properties: {
    name: { type: "string", description: "Nombre corto y con gancho para el equipo, en español." },
    explanation: {
      type: "string",
      description: "2-3 frases en español explicando la estrategia del equipo, en tono Profesor Oak.",
    },
    members: {
      type: "array",
      description: "Los Pokémon propuestos, hasta 6.",
      items: {
        type: "object",
        properties: {
          pokemon: {
            type: "string",
            description: "Nombre INGLÉS oficial del Pokémon (p. ej. 'Charizard', 'Garchomp').",
          },
          reason: { type: "string", description: "Por qué está en el equipo, 1 frase en español." },
        },
        required: ["pokemon", "reason"],
        additionalProperties: false,
      },
    },
  },
  required: ["name", "explanation", "members"],
  additionalProperties: false,
};

const proposalSchema = z.object({
  name: z.string().min(1).max(60),
  explanation: z.string().min(1).max(1000),
  members: z
    .array(z.object({ pokemon: z.string().min(1).max(40), reason: z.string().min(1).max(300) }))
    .min(1)
    .max(12),
});

const SYSTEM_PROMPT = `Eres el Profesor Oak armando equipos Pokémon competitivos para un entrenador. Propones equipos SOLO con Pokémon reales de las generaciones I–IX (Pokédex nacional 1–1025), usando su nombre INGLÉS oficial.

Reglas:
- Propón exactamente 6 Pokémon salvo que el entrenador pida otra cantidad.
- Si el entrenador pide Pokémon concretos, inclúyelos sí o sí y completa el resto alrededor de ellos.
- Si te pasan su equipo actual y pide mejorarlo o completarlo, conserva lo que encaje y explica los cambios.
- Busca equilibrio: cobertura de tipos ofensiva, pocas debilidades compartidas y roles variados (tanque, ataque físico/especial, velocidad, apoyo).
- Prefiere formas finales de evolución salvo petición contraria. Nada de megas/gigamax/formas regionales: solo la forma base de la Pokédex nacional.
- Las razones y la explicación van en español, breves y con tu tono cercano de investigador.`;

const isRateLimited = createRateLimiter(10, 5 * 60 * 1000);

/** Capability probe used by the client to decide whether to show the panel. */
export function GET() {
  return Response.json({ enabled: Boolean(process.env.ANTHROPIC_API_KEY) });
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "El asistente no está configurado (falta ANTHROPIC_API_KEY)." },
      { status: 503 },
    );
  }

  // Cross-site browsers can't burn our tokens through a visitor.
  if (!isSameOrigin(req)) return crossOriginResponse();

  if (isRateLimited(clientIp(req))) {
    return Response.json(
      { error: "Demasiadas propuestas seguidas. Espera un momento." },
      { status: 429 },
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return Response.json({ error: "Petición inválida." }, { status: 400 });
  }

  const client = new Anthropic();
  const teamContext =
    body.team && body.team.length > 0
      ? `\n\nEquipo actual del entrenador: ${body.team.join(", ")}.`
      : "";

  try {
    const format = { type: "json_schema" as const, schema: PROPOSAL_JSON_SCHEMA };
    const response = await client.messages.create({
      model: CHAT_MODEL,
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `${body.prompt}${teamContext}` }],
      // `output_config` carries both the JSON schema and (when the model
      // supports adaptive thinking) the effort hint.
      ...(CHAT_SUPPORTS_ADAPTIVE
        ? {
            thinking: { type: "adaptive" as const },
            output_config: { effort: CHAT_EFFORT, format },
          }
        : { output_config: { format } }),
    });

    // A refusal or a token cap leaves no valid JSON — answer with something
    // useful instead of letting JSON.parse("") fall into the generic 500.
    if (response.stop_reason === "refusal") {
      return Response.json(
        { error: "El Profesor prefiere no responder a eso. Pídeme un equipo Pokémon. 😉" },
        { status: 422 },
      );
    }
    if (response.stop_reason === "max_tokens") {
      return Response.json(
        { error: "La propuesta salió demasiado larga. Prueba con una petición más concreta." },
        { status: 422 },
      );
    }

    const text = response.content.find((b) => b.type === "text")?.text ?? "";
    const proposal = proposalSchema.parse(JSON.parse(text));

    // Ground every suggestion against the real index; drop what doesn't resolve.
    const pokedex = await getPokedex();
    const byId = new Map(pokedex.entries.map((e) => [e.id, e]));
    const seen = new Set<number>();
    const members: { id: number; name: string; reason: string }[] = [];
    const unresolved: string[] = [];

    for (const member of proposal.members) {
      const id = await resolveId(member.pokemon);
      const entry = id !== null ? byId.get(id) : undefined;
      if (!entry || seen.has(entry.id)) {
        if (!entry) unresolved.push(member.pokemon);
        continue;
      }
      seen.add(entry.id);
      members.push({ id: entry.id, name: prettifyName(entry.name), reason: member.reason });
      if (members.length >= 6) break;
    }

    if (members.length === 0) {
      return Response.json(
        { error: "No he podido montar un equipo con eso. ¿Puedes reformularlo?" },
        { status: 422 },
      );
    }

    return Response.json({
      name: proposal.name,
      explanation: proposal.explanation,
      members,
      unresolved,
    });
  } catch (error) {
    console.error("[team] error:", error);
    return Response.json(
      { error: "El Profesor no ha podido preparar el equipo. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}
