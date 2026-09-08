// 목업에 실제로 로드되는 Google Fonts만 화이트리스트로 관리한다.
// 모델은 이 목록 밖의 폰트를 고를 수 없으므로(z.enum), 렌더링이 항상 성공한다.

/** 워드마크용 — 브랜드명은 영문인 경우가 많아 라틴 서체도 허용한다. */
export const LOGO_FONTS = [
  "Playfair Display", "Cormorant Garamond", "DM Serif Display", "Bodoni Moda",
  "Italiana", "Cinzel", "Marcellus", "Prata", "Tenor Sans", "Instrument Serif",
  "EB Garamond", "Fraunces", "Libre Baskerville", "Lora",
  "Syne", "Space Grotesk", "Bebas Neue", "Anton", "Archivo Black", "Oswald",
  "Outfit", "Manrope", "Inter", "DM Sans", "Josefin Sans", "Jost", "Sora",
  "Montserrat", "Poppins", "Unbounded", "Abril Fatface", "Righteous",
  "Noto Sans KR", "Noto Serif KR", "Nanum Myeongjo", "Gowun Batang",
  "Black Han Sans", "Do Hyeon", "Jua", "Song Myung", "Hahmlet", "Gugi", "Stylish",
] as const;

/** 헤드라인용 — 한글 카피가 들어가므로 한글을 지원하는 서체만. */
export const DISPLAY_FONTS = [
  "Noto Sans KR", "Noto Serif KR", "Nanum Myeongjo", "Nanum Gothic",
  "Gowun Batang", "Gowun Dodum", "IBM Plex Sans KR", "Song Myung", "Hahmlet",
  "Black Han Sans", "Do Hyeon", "Jua", "Gugi", "Stylish", "Sunflower",
  "Nanum Pen Script", "Gaegu", "Kirang Haerang", "Gamja Flower", "Yeon Sung",
] as const;

/** 본문용 — 한글 지원 + 작은 크기에서 읽히는 것만. */
export const BODY_FONTS = [
  "Noto Sans KR", "Noto Serif KR", "Nanum Gothic", "Nanum Myeongjo",
  "Gowun Dodum", "Gowun Batang", "IBM Plex Sans KR", "Sunflower", "Song Myung",
  "Hahmlet",
] as const;

const SERIF = new Set([
  "Playfair Display", "Cormorant Garamond", "DM Serif Display", "Bodoni Moda",
  "Italiana", "Cinzel", "Marcellus", "Prata", "Tenor Sans", "Instrument Serif",
  "EB Garamond", "Fraunces", "Libre Baskerville", "Lora", "Abril Fatface",
  "Noto Serif KR", "Nanum Myeongjo", "Gowun Batang", "Song Myung", "Hahmlet",
]);

/** CSS font-family 값으로. 웹폰트가 늦게 뜨거나 실패해도 읽히도록 폴백을 붙인다. */
export function fontStack(family: string): string {
  const fallback = SERIF.has(family)
    ? `"Noto Serif KR", "Apple SD Gothic Neo", Georgia, serif`
    : `"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif`;
  return `"${family}", ${fallback}`;
}

/** 실제로 쓰는 폰트만 골라 하나의 Google Fonts URL로 만든다. */
export function googleFontsHref(families: string[]): string {
  const unique = [...new Set(families.filter(Boolean))];
  if (unique.length === 0) return "";
  const params = unique
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@300;400;500;600;700;800;900`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

/** 가변 굵기를 지원하지 않는 서체는 weight 지정이 무의미하다 — 400으로 고정. */
export const SINGLE_WEIGHT_FONTS = new Set([
  "Black Han Sans", "Do Hyeon", "Jua", "Gugi", "Stylish", "Italiana", "Bebas Neue",
  "Anton", "Archivo Black", "Abril Fatface", "Righteous", "Tenor Sans", "Marcellus",
  "Nanum Pen Script", "Gaegu", "Kirang Haerang", "Gamja Flower", "Yeon Sung",
  "Instrument Serif", "Prata",
]);

export function safeWeight(family: string, weight: string): string {
  return SINGLE_WEIGHT_FONTS.has(family) ? "400" : weight;
}

/**
 * 모델이 준 서체 이름을 화이트리스트에 맞춘다.
 * 목록 밖의 이름이면 폴백 — 없는 폰트를 요청하면 목업이 시스템 서체로 렌더링되기 때문.
 */
export function resolveFont(value: string, allowed: readonly string[], fallback: string): string {
  const v = (value ?? "").trim();
  if (allowed.includes(v)) return v;
  // 대소문자나 공백만 다른 경우는 살려준다.
  const norm = v.toLowerCase().replace(/\s+/g, "");
  const hit = allowed.find((f) => f.toLowerCase().replace(/\s+/g, "") === norm);
  return hit ?? fallback;
}

const CASES = ["uppercase", "lowercase", "none"] as const;
export type LogoCase = (typeof CASES)[number];

export function resolveCase(value: string): LogoCase {
  return (CASES as readonly string[]).includes(value) ? (value as LogoCase) : "none";
}

/** '0.2em' 같은 자간 값만 통과시킨다. */
export function resolveTracking(value: string, fallback: string): string {
  const v = (value ?? "").trim();
  return /^-?\d*\.?\d+(em|px|rem)$/.test(v) ? v : fallback;
}

/** 100 단위 굵기만 통과시킨다. */
export function resolveWeight(value: string, fallback = "700"): string {
  const v = (value ?? "").trim();
  return /^[1-9]00$/.test(v) ? v : fallback;
}
