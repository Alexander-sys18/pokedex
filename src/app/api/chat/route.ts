import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { clientIp, createRateLimiter, crossOriginResponse, isSameOrigin } from "@/lib/api/guard";
import {
  CHAT_EFFORT,
  CHAT_MAX_STEPS,
  CHAT_MAX_TOKENS,
  CHAT_MODEL,
  CHAT_SUPPORTS_ADAPTIVE,
  CHAT_SYSTEM_PROMPT,
} from "@/lib/chat/config";
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

const isRateLimited = createRateLimiter(30, 5 * 60 * 1000);

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
  // Cross-site browsers can't burn our tokens through a visitor.
  if (!isSameOrigin(req)) return crossOriginResponse();

  if (isRateLimited(clientIp(req))) {
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
      let lastSentChar = "";

      try {
        for (let step = 0; step < CHAT_MAX_STEPS; step++) {
          // Text from separate loop steps (before/after a tool call) must not
          // glue together mid-word on the client — force a paragraph break
          // between the text of one step and the next (it becomes part of the
          // message, which is accurate: the model produced the chunks apart).
          let stepProducedText = false;
          const turn = client.messages.stream({
            model: CHAT_MODEL,
            max_tokens: CHAT_MAX_TOKENS,
            system: CHAT_SYSTEM_PROMPT,
            messages,
            tools: [...CHAT_TOOLS],
            // Adaptive thinking noticeably improves tool choice and comparisons;
            // effort keeps the latency of a chat in check. Only sent to models
            // that accept it (older tiers would reject the params with a 400).
            ...(CHAT_SUPPORTS_ADAPTIVE
              ? { thinking: { type: "adaptive" as const }, output_config: { effort: CHAT_EFFORT } }
              : {}),
          });

          for await (const event of turn) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              if (!stepProducedText && producedText && !lastSentChar.includes("\n")) {
                send({ type: "text", text: "\n\n" });
              }
              stepProducedText = true;
              producedText = true;
              if (event.delta.text.length > 0) lastSentChar = event.delta.text.slice(-1);
              send({ type: "text", text: event.delta.text });
            }
          }

          const message = await turn.finalMessage();
          messages.push({ role: "assistant", content: message.content });

          // Streamed text can't be un-sent — if the cap cut the reply short,
          // tell the user instead of ending mid-sentence silently.
          if (message.stop_reason === "max_tokens") {
            send({
              type: "text",
              text: "\n\n_(Me he quedado sin espacio, joven entrenador — pídeme que continúe.)_",
            });
            break;
          }
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
