/** WCAG 상대 휘도 대비. 모델이 고른 색이 실제로 읽히는지 화면에서 검증하려고 쓴다. */

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(fg: string, bg: string): number {
  const a = luminance(fg);
  const b = luminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

export type ContrastCheck = {
  label: string;
  ratio: number;
  min: number;
  pass: boolean;
};

export function checkContrast(fg: string, bg: string, label: string, min: number): ContrastCheck {
  const ratio = contrastRatio(fg, bg);
  return { label, ratio, min, pass: ratio >= min };
}
