/**
 * Gemini Interactions API 클라이언트.
 *
 * SDK를 쓰지 않고 fetch만 쓴다 — 브라우저와 서버에서 코드가 같아지고,
 * 정적 배포 번들도 가벼워진다.
 *
 * 확인된 사양 (2026-09, ai.google.dev):
 *   POST /v1beta/interactions?alt=sse
 *   헤더  x-goog-api-key
 *   본문  { model, system_instruction, input[], response_format, generation_config, stream }
 *   입력  [{type:"text",text}, {type:"image",data,mime_type}]
 *   스트림 event: step.delta → data: {delta:{type:"text",text}}  …  event: done / data: [DONE]
 *   비스트림 응답 steps[].content[].text
 */

export const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

/** 기본값. Settings에서 사용자가 자기 키로 실제 목록을 불러와 바꿀 수 있다. */
export const DEFAULT_MODEL = "gemini-2.5-flash";

/** 목록을 못 불러왔을 때 보여줄 후보. 무료 한도는 계정마다 다르므로 확정하지 않는다. */
export const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-2.5-pro",
];

export type Part =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mime_type: string };

export class GeminiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
  }
}

async function readError(res: Response): Promise<never> {
  let message = `요청이 실패했습니다 (HTTP ${res.status})`;
  try {
    const body = await res.json();
    if (body?.error?.message) message = body.error.message;
  } catch {
    /* 본문이 JSON이 아니면 기본 메시지를 쓴다 */
  }
  throw new GeminiError(message, res.status);
}

/** 이 키로 쓸 수 있는 모델 목록. 실패하면 빈 배열 — 호출부가 폴백을 쓴다. */
export async function listModels(apiKey: string): Promise<string[]> {
  try {
    const res = await fetch(`${GEMINI_BASE}/models?pageSize=200`, {
      headers: { "x-goog-api-key": apiKey },
    });
    if (!res.ok) return [];
    const body = await res.json();
    const names: string[] = (body?.models ?? [])
      .map((m: { name?: string }) => (m.name ?? "").replace(/^models\//, ""))
      .filter(Boolean);
    // 텍스트 생성용 gemini 모델만 남긴다. 임베딩·이미지·음성 전용은 제외.
    return names
      .filter((n) => n.startsWith("gemini-"))
      .filter((n) => !/embedding|imagen|veo|tts|native-audio|live/.test(n))
      .sort();
  } catch {
    return [];
  }
}

type RunArgs = {
  apiKey: string;
  model: string;
  system: string;
  input: Part[];
  /** Gemini용으로 정제된 JSON Schema. 있으면 JSON 출력이 강제된다. */
  jsonSchema?: Record<string, unknown>;
  maxOutputTokens?: number;
  thinkingLevel?: "minimal" | "low" | "medium" | "high";
  onDelta?: (delta: string, total: string) => void;
  signal?: AbortSignal;
};

/**
 * 스트리밍으로 호출하고 전체 텍스트를 돌려준다.
 * 스트리밍을 쓰는 이유는 긴 응답에서 연결이 끊기지 않고,
 * 진행 상황을 사용자에게 보여줄 수 있기 때문.
 */
export async function runGemini({
  apiKey,
  model,
  system,
  input,
  jsonSchema,
  maxOutputTokens = 32768,
  thinkingLevel = "medium",
  onDelta,
  signal,
}: RunArgs): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    system_instruction: system,
    input,
    stream: true,
    generation_config: {
      max_output_tokens: maxOutputTokens,
      thinking_level: thinkingLevel,
    },
  };

  if (jsonSchema) {
    body.response_format = {
      type: "text",
      mime_type: "application/json",
      schema: jsonSchema,
    };
  }

  const res = await fetch(`${GEMINI_BASE}/interactions?alt=sse`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) await readError(res);
  if (!res.body) throw new GeminiError("응답 본문이 비어 있습니다.", 500);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);

      for (const line of frame.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;

        let event: unknown;
        try {
          event = JSON.parse(payload);
        } catch {
          continue; // 깨진 프레임은 버린다
        }

        const chunk = deltaText(event);
        if (chunk) {
          text += chunk;
          onDelta?.(chunk, text);
        }

        // 스트림이 아니라 완성된 interaction이 통째로 온 경우도 받아준다.
        const whole = interactionText(event);
        if (whole && !text) {
          text = whole;
          onDelta?.(whole, text);
        }
      }

      boundary = buffer.indexOf("\n\n");
    }
  }

  if (!text.trim()) {
    throw new GeminiError(
      "모델이 빈 응답을 돌려줬습니다. 다시 시도하거나 다른 모델을 선택해보세요.",
      502,
    );
  }
  return text;
}

/** step.delta 이벤트에서 텍스트 조각을 꺼낸다. */
function deltaText(event: unknown): string {
  const e = event as { delta?: { type?: string; text?: string } };
  if (e?.delta?.type === "text" && typeof e.delta.text === "string") return e.delta.text;
  return "";
}

/** 완성된 interaction 객체에서 텍스트를 모은다 (steps[].content[].text). */
function interactionText(event: unknown): string {
  const e = event as {
    interaction?: { steps?: unknown[] };
    steps?: unknown[];
  };
  const steps = e?.interaction?.steps ?? e?.steps;
  if (!Array.isArray(steps)) return "";

  let out = "";
  for (const step of steps) {
    const content = (step as { content?: unknown[] })?.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      const b = block as { type?: string; text?: string };
      if (b?.type === "text" && typeof b.text === "string") out += b.text;
    }
  }
  return out;
}

/** Gemini의 스키마가 받는 키워드만 남긴다. zod가 뱉는 $schema 등은 거부당한다. */
const ALLOWED_KEYS = new Set([
  "type",
  "properties",
  "required",
  "items",
  "enum",
  "description",
  "format",
  "nullable",
  "anyOf",
  "minItems",
  "maxItems",
]);

export function sanitizeSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(sanitizeSchema);
  if (!node || typeof node !== "object") return node;

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    if (key === "properties" && value && typeof value === "object") {
      const props: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        props[k] = sanitizeSchema(v);
      }
      out[key] = props;
    } else if (key === "items" || key === "anyOf") {
      out[key] = sanitizeSchema(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}
