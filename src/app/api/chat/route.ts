import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { CHAT_MAX_STEPS, CHAT_MAX_TOKENS, CHAT_MODEL, CHAT_SYSTEM_PROMPT } from "@/lib/chat/config";
import { CHAT_TOOLS, runTool } from "@/lib/chat/tools";

export const runtime = "nodejs";

type ChatEvent =
  | { type: "text"; text: string }
  | { type: "pokemon"; items: { id: number; name: string }[] }
  | { type: "done" }
  | { type: "error"; message: string };

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(24),
});

// Best-effort in-memory rate limit (per instance; resets on restart).
const RATE_WINDOW_MS = 5 * 60 * 1000;
const RATE_MAX = 30;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

/** Capability probe used by the client to decide whether to show the widget. */
export function GET() {
  return Response.json({ enabled: Boolean(process.env.ANTHROPIC_API_KEY) });
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      {
        error: "El asistente no está configurado (falta ANTHROPIC_API_KEY).",
        code: "not_configured",
      },
      { status: 503 },
    );
  }

  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0]!.trim();
  if (isRateLimited(ip)) {
    return Response.json(
      { error: "Demasiadas preguntas seguidas. Espera un momento.", code: "rate_limited" },
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
  const encoder = new TextEncoder();
  const messages: Anthropic.MessageParam[] = body.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatEvent) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      const pokemon = new Map<number, string>();
      let producedText = false;

      try {
        for (let step = 0; step < CHAT_MAX_STEPS; step++) {
          const turn = client.messages.stream({
            model: CHAT_MODEL,
            max_tokens: CHAT_MAX_TOKENS,
            system: CHAT_SYSTEM_PROMPT,
            messages,
            tools: CHAT_TOOLS as unknown as Anthropic.Tool[],
          });

          for await (const event of turn) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              producedText = true;
              send({ type: "text", text: event.delta.text });
            }
          }

          const message = await turn.finalMessage();
          messages.push({ role: "assistant", content: message.content });

          if (message.stop_reason !== "tool_use") break;

          const toolUses = message.content.filter(
            (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
          );
          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const use of toolUses) {
            const result = await runTool(use.name, use.input);
            result.pokemon.forEach((p) => pokemon.set(p.id, p.name));
            toolResults.push({ type: "tool_result", tool_use_id: use.id, content: result.content });
          }
          messages.push({ role: "user", content: toolResults });
        }

        if (!producedText) {
          send({
            type: "text",
            text: "No he podido completar la respuesta. ¿Puedes reformularla?",
          });
        }
        if (pokemon.size > 0) {
          send({ type: "pokemon", items: [...pokemon].map(([id, name]) => ({ id, name })) });
        }
        send({ type: "done" });
      } catch (error) {
        console.error("[chat] error:", error);
        send({
          type: "error",
          message: "Ha ocurrido un error con el asistente. Inténtalo de nuevo.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
