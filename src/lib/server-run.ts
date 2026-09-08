import { detectStage, parseResult, type Job } from "@/lib/engine";
import { DEFAULT_MODEL, runGemini } from "@/lib/gemini";
import { MissingKeyError, toUserMessage } from "@/lib/errors";

function getKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new MissingKeyError(
      "서버에 GEMINI_API_KEY가 설정되지 않았습니다. 환경변수를 확인하거나, 설정에서 '내 API 키로 직접 호출'을 켜주세요.",
    );
  }
  return key;
}

/** 요청 헤더의 비밀번호를 검사한다. APP_PASSWORD가 비어 있으면 누구나 통과. */
export function checkPassword(req: Request): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return true;
  return req.headers.get("x-app-password") === expected;
}

/**
 * Gemini 응답을 SSE로 중계한다.
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
        const apiKey = getKey();
        const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
        send({ type: "progress", stage: "요청 전송", chars: 0 });

        let lastStage = "";
        let lastPing = Date.now();

        const text = await runGemini({
          apiKey,
          model,
          system: job.system,
          input: job.input,
          jsonSchema: job.jsonSchema,
          maxOutputTokens: job.maxTokens,
          onDelta: (_chunk, total) => {
            const stage = detectStage(total, job.stages) ?? "분석 중";
            // 단계가 바뀌었거나 1초가 지났을 때만 보낸다 — 델타마다 보내면 낭비다.
            if (stage !== lastStage || Date.now() - lastPing > 1000) {
              lastStage = stage;
              lastPing = Date.now();
              send({ type: "progress", stage, chars: total.length });
            }
          },
        });

        const parsed = parseResult(text, job.schema);
        if (!parsed.ok) {
          send({ type: "error", message: parsed.message });
          return;
        }
        send({ type: "done", data: parsed.data });
      } catch (err) {
        const message = toUserMessage(err);
        if (message) send({ type: "error", message });
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
