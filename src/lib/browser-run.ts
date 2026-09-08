"use client";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { MODEL, detectStage, parseResult, stopReasonMessage, type Job } from "@/lib/engine";
import { MissingKeyError, toUserMessage } from "@/lib/errors";

/**
 * 서버 없이 브라우저에서 Anthropic API를 직접 호출한다.
 * GitHub Pages처럼 정적 호스팅에 올렸을 때 쓰는 경로다.
 *
 * 키는 이 브라우저의 localStorage에만 있고 Anthropic 외에는 어디로도 가지 않는다.
 * 대신 이 페이지를 여는 사람은 각자 자기 키를 넣어야 한다 — 서버가 없으니 숨길 데가 없다.
 */
export async function runInBrowser(
  job: Job,
  apiKey: string,
  onProgress: (stage: string, chars: number) => void,
  signal?: AbortSignal,
): Promise<{ ok: true; data: unknown } | { ok: false; message: string }> {
  if (!apiKey.trim()) {
    return {
      ok: false,
      message: "API 키가 없습니다. 오른쪽 위 '설정'에서 Anthropic API 키를 입력해주세요.",
    };
  }

  try {
    const client = new Anthropic({
      apiKey: apiKey.trim(),
      maxRetries: 2,
      // 정적 호스팅에서는 이 경로 말고 방법이 없다. 키는 사용자 본인 것이다.
      dangerouslyAllowBrowser: true,
    });

    onProgress("요청 전송", 0);

    const messageStream = client.messages.stream(
      {
        model: MODEL,
        max_tokens: job.maxTokens,
        system: [{ type: "text", text: job.system, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: job.content }],
        output_config: { format: zodOutputFormat(job.schema) },
      },
      { signal },
    );

    let buffer = "";
    let lastStage = "";
    let lastPing = Date.now();

    messageStream.on("text", (delta) => {
      buffer += delta;
      const stage = detectStage(buffer, job.stages) ?? "분석 중";
      if (stage !== lastStage || Date.now() - lastPing > 700) {
        lastStage = stage;
        lastPing = Date.now();
        onProgress(stage, buffer.length);
      }
    });

    const final = await messageStream.finalMessage();

    const stopMessage = stopReasonMessage(final.stop_reason);
    if (stopMessage) return { ok: false, message: stopMessage };

    const text = final.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    return parseResult(text, job.schema);
  } catch (err) {
    if ((err as Error)?.name === "AbortError") {
      return { ok: false, message: "" };
    }
    if (err instanceof MissingKeyError) {
      return { ok: false, message: err.message };
    }
    return { ok: false, message: toUserMessage(err) };
  }
}
