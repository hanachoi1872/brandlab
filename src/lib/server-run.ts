import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { MODEL, detectStage, parseResult, stopReasonMessage, type Job } from "@/lib/engine";
import { MissingKeyError, toUserMessage } from "@/lib/errors";

let cached: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new MissingKeyError(
      "서버에 ANTHROPIC_API_KEY가 설정되지 않았습니다. Vercel 환경변수를 확인하거나, 설정에서 '내 API 키로 직접 호출'을 켜주세요.",
    );
  }
  if (!cached) cached = new Anthropic({ maxRetries: 2 });
  return cached;
}

/** 요청 헤더의 비밀번호를 검사한다. APP_PASSWORD가 비어 있으면 누구나 통과. */
export function checkPassword(req: Request): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return true;
  return req.headers.get("x-app-password") === expected;
}

/**
 * 구조화 출력을 스트리밍으로 받아 SSE로 중계한다.
 * 스트리밍을 쓰는 이유는 두 가지 — 긴 분석에도 HTTP 연결이 끊기지 않고,
 * 진행 상황을 사용자에게 실제로 보여줄 수 있기 때문.
 */
export function runToSSE(job: Job): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: Record<string, unknown>) => {
        if (closed) return;
        controller.enqueue(encoder.encode("data: " + JSON.stringify(event) + "\n\n"));
      };

      try {
        const client = getClient();
        send({ type: "progress", stage: "요청 전송", chars: 0 });

        const messageStream = client.messages.stream({
          model: MODEL,
          max_tokens: job.maxTokens,
          system: [{ type: "text", text: job.system, cache_control: { type: "ephemeral" } }],
          messages: [{ role: "user", content: job.content }],
          output_config: { format: zodOutputFormat(job.schema) },
        });

        let buffer = "";
        let lastStage = "";
        let lastPing = Date.now();

        messageStream.on("text", (delta) => {
          buffer += delta;
          const stage = detectStage(buffer, job.stages) ?? "분석 중";
          // 단계가 바뀌었거나 1초가 지났을 때만 보낸다 — 델타마다 보내면 낭비다.
          if (stage !== lastStage || Date.now() - lastPing > 1000) {
            lastStage = stage;
            lastPing = Date.now();
            send({ type: "progress", stage, chars: buffer.length });
          }
        });

        const final = await messageStream.finalMessage();

        const stopMessage = stopReasonMessage(final.stop_reason);
        if (stopMessage) {
          send({ type: "error", message: stopMessage });
          return;
        }

        const text = final.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("");

        const parsed = parseResult(text, job.schema);
        if (!parsed.ok) {
          send({ type: "error", message: parsed.message });
          return;
        }

        send({
          type: "done",
          data: parsed.data,
          usage: {
            input: final.usage.input_tokens,
            output: final.usage.output_tokens,
            cacheRead: final.usage.cache_read_input_tokens ?? 0,
          },
        });
      } catch (err) {
        send({ type: "error", message: toUserMessage(err) });
      } finally {
        closed = true;
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
