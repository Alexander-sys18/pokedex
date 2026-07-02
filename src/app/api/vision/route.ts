import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { clientIp, createRateLimiter, crossOriginResponse, isSameOrigin } from "@/lib/api/guard";
import { CHAT_MODEL } from "@/lib/chat/config";
import { getPokedex } from "@/lib/pokedex";
import { normalizeSearch, prettifyName } from "@/lib/utils";

export const runtime = "nodejs";

const bodySchema = z.object({
  // A data URL: data:image/jpeg;base64,....
  image: z.string().max(6_000_000),
});

const DATA_URL_RE = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/;

const isRateLimited = createRateLimiter(20, 5 * 60 * 1000);

/** Resolve a PokéAPI-style name to an index entry. */
async function resolveByName(name: string): Promise<{ id: number; name: string } | null> {
  const query = normalizeSearch(name);
  if (!query) return null;
  const pokedex = await getPokedex();
  const entry =
    pokedex.entries.find((e) => normalizeSearch(e.name) === query) ??
    pokedex.entries.find((e) => normalizeSearch(e.name).includes(query));
  return entry ? { id: entry.id, name: prettifyName(entry.name) } : null;
}

const SYSTEM =
  "Eres un identificador experto de Pokémon. Recibes una imagen (arte oficial, dibujo, " +
  "peluche, carta, captura de pantalla…) y debes identificar qué Pokémon aparece.";

const PROMPT =
  "Responde ÚNICAMENTE con el nombre del Pokémon en inglés, en minúsculas y con el formato " +
  "de la PokéAPI (por ejemplo: pikachu, charizard, mr-mime). Si en la imagen no hay ningún " +
  "Pokémon reconocible, responde exactamente: NONE. No añadas ninguna explicación.";

/** Capability probe so the client can hide the camera button when AI is off. */
export function GET() {
  return Response.json(
    { enabled: Boolean(process.env.ANTHROPIC_API_KEY) },
    // The answer only changes on redeploy — spare a request per page load.
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "La búsqueda por foto no está configurada." }, { status: 503 });
  }
  // Cross-site browsers can't burn our tokens through a visitor.
  if (!isSameOrigin(req)) return crossOriginResponse();

  if (isRateLimited(clientIp(req))) {
    return Response.json(
      { error: "Demasiadas fotos seguidas. Espera un momento." },
      { status: 429 },
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return Response.json({ error: "Petición inválida." }, { status: 400 });
  }

  const match = DATA_URL_RE.exec(body.image);
  if (!match) {
    return Response.json({ error: "Imagen no válida." }, { status: 400 });
  }
  const mediaType = match[1] as "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  const data = match[2]!;

  try {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: CHAT_MODEL,
      max_tokens: 24,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data } },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    const raw =
      message.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text ?? "";
    const guess = raw.trim().split(/\s+/)[0]?.toLowerCase() ?? "";

    if (!guess || guess === "none") {
      return Response.json({ match: null });
    }

    const resolved = await resolveByName(raw.trim());
    return Response.json({ match: resolved });
  } catch (error) {
    console.error("[vision] error:", error);
    return Response.json({ error: "No se pudo analizar la imagen." }, { status: 500 });
  }
}
