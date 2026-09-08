import type Anthropic from "@anthropic-ai/sdk";
import type { ZodType } from "zod";
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

/** Opus 5는 thinking을 생략하면 adaptive thinking이 기본으로 켜진다. */
export const MODEL = "claude-opus-5";

export type JobName = "position" | "design";

/** 스트리밍 중 partial JSON에서 최상위 키를 보고 사람이 읽을 단계 이름을 뽑는다. */
export type StageMap = { key: string; label: string }[];

export type Job = {
  system: string;
  content: Anthropic.ContentBlockParam[];
  schema: ZodType<unknown>;
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

/** 클라이언트가 보낸 data URL을 Anthropic 이미지 블록으로. */
export function toImageBlocks(dataUrls: string[]): Anthropic.ContentBlockParam[] {
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const blocks: Anthropic.ContentBlockParam[] = [];
  for (const url of dataUrls.slice(0, 8)) {
    const match = /^data:([^;]+);base64,(.+)$/.exec(url);
    if (!match) continue;
    const [, mediaType, data] = match;
    if (!allowed.includes(mediaType)) continue;
    blocks.push({
      type: "image",
      source: { type: "base64", media_type: mediaType as "image/jpeg", data },
    });
  }
  return blocks;
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
  const images = toImageBlocks(payload.images ?? []);

  if (job === "position") {
    const product: ProductInput = { ...EMPTY_PRODUCT, ...payload.product };
    if (!product.name.trim() && !product.description.trim()) {
      throw new InputError("제품명이나 제품 설명 중 하나는 입력해주세요.");
    }
    return {
      system: POSITIONING_SYSTEM,
      content: [
        ...images,
        { type: "text", text: buildPositioningPrompt(product, images.length > 0) },
      ],
      schema: PositioningSchema,
      stages: POSITION_STAGES,
      maxTokens: 32000,
    };
  }

  const design: DesignInput = { ...EMPTY_DESIGN, ...payload.design };
  if (images.length === 0 && !design.moodNote.trim()) {
    throw new InputError("레퍼런스 이미지를 올리거나, 원하는 무드를 글로 설명해주세요.");
  }
  return {
    system: DESIGN_SYSTEM,
    content: [...images, { type: "text", text: buildDesignPrompt(design, images.length) }],
    schema: BrandKitSchema,
    stages: DESIGN_STAGES,
    maxTokens: 32000,
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
    json = JSON.parse(text);
  } catch {
    return { ok: false, message: "결과를 해석하지 못했습니다. 다시 시도해주세요." };
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    return {
      ok: false,
      message: "결과 형식이 올바르지 않습니다: " + (result.error.issues[0]?.message ?? "알 수 없음"),
    };
  }
  return { ok: true, data: result.data };
}

/** stop_reason이 정상이 아닐 때의 안내 문구. null이면 정상. */
export function stopReasonMessage(stopReason: string | null): string | null {
  if (stopReason === "refusal") {
    return "모델이 이 요청에 대한 응답을 거절했습니다. 입력 내용을 조정해서 다시 시도해주세요.";
  }
  if (stopReason === "max_tokens") {
    return "결과가 너무 길어 잘렸습니다. 입력을 줄이고 다시 시도해주세요.";
  }
  return null;
}
