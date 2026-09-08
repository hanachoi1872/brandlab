"use client";

import { detectStage, parseResult, type Job } from "@/lib/engine";
import { runGemini } from "@/lib/gemini";
import { toUserMessage } from "@/lib/errors";

/**
 * 서버 없이 브라우저에서 Gemini API를 직접 호출한다.
 * GitHub Pages처럼 정적 호스팅에 올렸을 때 쓰는 경로다.
 *
 * 키는 이 브라우저의 localStorage에만 있고 Google 외에는 어디로도 가지 않는다.
 * (generativelanguage.googleapis.com 이 CORS로 브라우저 호출을 허용한다.)
 */
export async function runInBrowser(
  job: Job,
  apiKey: string,
  model: string,
  onProgress: (stage: string, chars: number) => void,
  signal?: AbortSignal,
): Promise<{ ok: true; data: unknown } | { ok: false; message: string }> {
  if (!apiKey.trim()) {
    return {
      ok: false,
      message: "API 키가 없습니다. 오른쪽 위 '설정'에서 Gemini API 키를 입력해주세요.",
    };
  }

  try {
    onProgress("요청 전송", 0);

    let lastStage = "";
    let lastPing = Date.now();

    const text = await runGemini({
      apiKey: apiKey.trim(),
      model,
      system: job.system,
      input: job.input,
      jsonSchema: job.jsonSchema,
      maxOutputTokens: job.maxTokens,
      signal,
      onDelta: (_chunk, total) => {
        const stage = detectStage(total, job.stages) ?? "분석 중";
        if (stage !== lastStage || Date.now() - lastPing > 700) {
          lastStage = stage;
          lastPing = Date.now();
          onProgress(stage, total.length);
        }
      },
    });

    return parseResult(text, job.schema);
  } catch (err) {
    const message = toUserMessage(err);
    return { ok: false, message };
  }
}
