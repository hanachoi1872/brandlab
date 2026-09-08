import * as z from "zod";
import type { ZodType } from "zod";
import { BODY_FONTS, DISPLAY_FONTS, LOGO_FONTS } from "@/lib/fonts";
import { sanitizeSchema, type Part } from "@/lib/gemini";
import {
  DESIGN_SYSTEM,
  POSITIONING_SYSTEM,
  buildDesignPrompt,
  buildPositioningPrompt,
  type DesignInput,
  type ProductInput,
} from "@/lib/prompts";
import { BrandKitSchema } from "@/lib/schema/brand";
import { PositioningSchema } from "@/lib/schema/positioning";

export type JobName = "position" | "design";

/** 스트리밍 중 partial JSON에서 최상위 키를 보고 사람이 읽을 단계 이름을 뽑는다. */
export type StageMap = { key: string; label: string }[];

export type Job = {
  system: string;
  input: Part[];
  /** 결과 검증용 (관대하게 받는다) */
  schema: ZodType<unknown>;
  /** Gemini에 보낼 출력 스키마 (여기서는 enum을 강제한다) */
  jsonSchema: Record<string, unknown>;
  stages: StageMap;
  maxTokens: number;
};

const POSITION_STAGES: StageMap = [
  { key: "snapshot", label: "제품 해석" },
  { key: "audience", label: "타겟 세그먼트 도출" },
  { key: "map", label: "포지셔닝 맵 작성" },
  { key: "positioning", label: "포지셔닝 문장 정리" },
  { key: "differentiators", label: "차별점 검증" },
  { key: "messaging", label: "메시지 하우스 구성" },
  { key: "brand", label: "브랜드 톤 설정" },
  { key: "taglines", label: "태그라인 작성" },
  { key: "channels", label: "채널 전략" },
  { key: "risks", label: "리스크 점검" },
  { key: "quickWins", label: "실행 항목 정리" },
  { key: "designBrief", label: "디자인 브리프 작성" },
];

const DESIGN_STAGES: StageMap = [
  { key: "dna", label: "레퍼런스 해부" },
  { key: "palette", label: "컬러 팔레트 구성" },
  { key: "typography", label: "서체 조합 결정" },
  { key: "logo", label: "워드마크 설계" },
  { key: "artDirection", label: "아트 디렉션 정리" },
  { key: "copy", label: "시안 카피 작성" },
  { key: "usage", label: "적용 가이드 작성" },
];

export const EMPTY_PRODUCT: ProductInput = {
  name: "",
  category: "",
  description: "",
  price: "",
  features: "",
  audienceGuess: "",
  competitors: "",
  strengths: "",
  channels: "",
  market: "대한민국",
  extra: "",
};

export const EMPTY_DESIGN: DesignInput = {
  brandName: "",
  category: "",
  productNote: "",
  moodNote: "",
  positioningContext: "",
};

/**
 * 스키마에는 관대한 z.string()으로 두되, Gemini에 보내는 JSON Schema에는 enum을 넣는다.
 *
 * 이렇게 나눈 이유: Gemini는 enum을 실제로 강제해주므로 첫 시도에 맞을 확률이 높아지고,
 * 그럼에도 어긋난 값이 오면 검증에서 결과 전체를 버리는 대신 화면에서 보정할 수 있다.
 */
const ENUM_HINTS: Record<string, Record<string, readonly string[]>> = {
  design: {
    "typography.logoFont": LOGO_FONTS,
    "typography.displayFont": DISPLAY_FONTS,
    "typography.bodyFont": BODY_FONTS,
    "typography.logoCase": ["uppercase", "lowercase", "none"],
    "typography.logoTracking": ["-0.04em", "-0.02em", "0em", "0.04em", "0.1em", "0.2em", "0.34em"],
    "typography.displayWeight": ["300", "400", "500", "600", "700", "800", "900"],
    "typography.displayTracking": ["-0.05em", "-0.03em", "-0.015em", "0em", "0.02em", "0.06em"],
    "logo.lockup": ["stacked", "horizontal", "boxed", "underlined", "circle"],
  },
  position: {
    "audience[].priority": ["1순위", "2순위", "3순위"],
    "differentiators[].defensibility": ["높음", "중간", "낮음"],
    "channels[].priority": ["높음", "중간", "낮음"],
  },
};

/** "typography.logoFont" / "audience[].priority" 같은 경로를 따라가 enum을 심는다. */
function applyEnumHints(schema: Record<string, unknown>, hints: Record<string, readonly string[]>) {
  for (const [path, values] of Object.entries(hints)) {
    let node: Record<string, unknown> | undefined = schema;
    for (const rawSegment of path.split(".")) {
      if (!node) break;
      const isArray = rawSegment.endsWith("[]");
      const key = isArray ? rawSegment.slice(0, -2) : rawSegment;
      const props = node.properties as Record<string, unknown> | undefined;
      let next = props?.[key] as Record<string, unknown> | undefined;
      if (next && isArray) next = next.items as Record<string, unknown> | undefined;
      node = next;
    }
    if (node && node.type === "string") node.enum = [...values];
  }
}

function buildJsonSchema(schema: ZodType<unknown>, job: JobName): Record<string, unknown> {
  const raw = z.toJSONSchema(schema, { io: "output" }) as Record<string, unknown>;
  const clean = sanitizeSchema(raw) as Record<string, unknown>;
  applyEnumHints(clean, ENUM_HINTS[job] ?? {});
  return clean;
}

/** 클라이언트가 보낸 data URL을 Gemini 이미지 파트로. */
export function toImageParts(dataUrls: string[]): Part[] {
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const parts: Part[] = [];
  for (const url of dataUrls.slice(0, 8)) {
    const match = /^data:([^;]+);base64,(.+)$/.exec(url);
    if (!match) continue;
    const [, mimeType, data] = match;
    if (!allowed.includes(mimeType)) continue;
    parts.push({ type: "image", data, mime_type: mimeType });
  }
  return parts;
}

export class InputError extends Error {}

/**
 * 요청 하나를 조립한다.
 * 서버 라우트와 브라우저 직접 호출이 똑같이 이 함수를 쓰므로,
 * 어느 쪽으로 배포하든 프롬프트와 스키마가 갈라지지 않는다.
 */
export function buildJob(
  job: JobName,
  payload: { product?: Partial<ProductInput>; design?: Partial<DesignInput>; images?: string[] },
): Job {
  const images = toImageParts(payload.images ?? []);

  if (job === "position") {
    const product: ProductInput = { ...EMPTY_PRODUCT, ...payload.product };
    if (!product.name.trim() && !product.description.trim()) {
      throw new InputError("제품명이나 제품 설명 중 하나는 입력해주세요.");
    }
    return {
      system: POSITIONING_SYSTEM,
      input: [
        ...images,
        { type: "text", text: buildPositioningPrompt(product, images.length > 0) },
      ],
      schema: PositioningSchema,
      jsonSchema: buildJsonSchema(PositioningSchema, "position"),
      stages: POSITION_STAGES,
      maxTokens: 32768,
    };
  }

  const design: DesignInput = { ...EMPTY_DESIGN, ...payload.design };
  if (images.length === 0 && !design.moodNote.trim()) {
    throw new InputError("레퍼런스 이미지를 올리거나, 원하는 무드를 글로 설명해주세요.");
  }
  return {
    system: DESIGN_SYSTEM,
    input: [...images, { type: "text", text: buildDesignPrompt(design, images.length) }],
    schema: BrandKitSchema,
    jsonSchema: buildJsonSchema(BrandKitSchema, "design"),
    stages: DESIGN_STAGES,
    maxTokens: 32768,
  };
}

export function detectStage(buffer: string, stages: StageMap): string | null {
  let found: string | null = null;
  for (const s of stages) {
    if (buffer.includes('"' + s.key + '"')) found = s.label;
  }
  return found;
}

/** 응답 텍스트를 스키마로 검증한다. 실패 이유를 한국어로 돌려준다. */
export function parseResult(
  text: string,
  schema: ZodType<unknown>,
): { ok: true; data: unknown } | { ok: false; message: string } {
  let json: unknown;
  try {
    json = JSON.parse(stripFence(text));
  } catch {
    return { ok: false, message: "결과를 해석하지 못했습니다. 다시 시도해주세요." };
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue?.path?.length ? ` (${issue.path.join(".")})` : "";
    return {
      ok: false,
      message: `결과 형식이 올바르지 않습니다${where}: ${issue?.message ?? "알 수 없음"}`,
    };
  }
  return { ok: true, data: result.data };
}

/** 모델이 ```json 펜스를 붙여 보내는 경우가 있어 벗겨낸다. */
function stripFence(text: string): string {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*\n([\s\S]*?)\n?```$/.exec(trimmed);
  return fence ? fence[1] : trimmed;
}
