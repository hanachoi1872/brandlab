"use client";

import { useEffect, useMemo, useState } from "react";
import { safeHex } from "@/lib/client";
import { checkContrast } from "@/lib/contrast";
import {
  BODY_FONTS,
  DISPLAY_FONTS,
  LOGO_FONTS,
  fontStack,
  googleFontsHref,
  resolveCase,
  resolveFont,
  resolveTracking,
  resolveWeight,
  safeWeight,
} from "@/lib/fonts";
import type { BrandKit } from "@/lib/schema/brand";
import { MockupGrid, type Tokens } from "@/components/mockups";
import { Card, Label, Pill } from "@/components/ui";

/** 고른 서체를 실제로 페이지에 로드한다. 안 하면 목업이 폴백 서체로 나온다. */
function useGoogleFonts(families: string[]) {
  const href = useMemo(() => googleFontsHref(families), [families]);

  useEffect(() => {
    if (!href) return;
    const id = "brandlab-fonts";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = href;
  }, [href]);
}

const FALLBACK = {
  surface: "#faf8f5",
  surfaceAlt: "#f0ece5",
  ink: "#1a1a18",
  inkSoft: "#5c5a55",
  brand: "#2a78d6",
  brandDeep: "#1c5296",
  accent: "#eb6834",
  onBrand: "#ffffff",
  line: "#ddd8cf",
};

export function BrandKitView({ kit }: { kit: BrandKit }) {
  // 모델이 준 값을 화이트리스트에 맞춰 보정한 뒤에 쓴다.
  const fonts = useMemo(
    () => ({
      logo: resolveFont(kit.typography.logoFont, LOGO_FONTS, "Noto Sans KR"),
      display: resolveFont(kit.typography.displayFont, DISPLAY_FONTS, "Noto Sans KR"),
      body: resolveFont(kit.typography.bodyFont, BODY_FONTS, "Noto Sans KR"),
    }),
    [kit.typography.logoFont, kit.typography.displayFont, kit.typography.bodyFont],
  );

  const t: Tokens = useMemo(() => {
    const p = kit.palette;
    return {
      surface: safeHex(p.surface, FALLBACK.surface),
      surfaceAlt: safeHex(p.surfaceAlt, FALLBACK.surfaceAlt),
      ink: safeHex(p.ink, FALLBACK.ink),
      inkSoft: safeHex(p.inkSoft, FALLBACK.inkSoft),
      brand: safeHex(p.brand, FALLBACK.brand),
      brandDeep: safeHex(p.brandDeep, FALLBACK.brandDeep),
      accent: safeHex(p.accent, FALLBACK.accent),
      onBrand: safeHex(p.onBrand, FALLBACK.onBrand),
      line: safeHex(p.line, FALLBACK.line),
      logoFamily: fontStack(fonts.logo),
      displayFamily: fontStack(fonts.display),
      bodyFamily: fontStack(fonts.body),
      logoCase: resolveCase(kit.typography.logoCase),
      logoTracking: resolveTracking(kit.typography.logoTracking, "0em"),
      displayWeight: safeWeight(fonts.display, resolveWeight(kit.typography.displayWeight)),
      displayTracking: resolveTracking(kit.typography.displayTracking, "-0.015em"),
    };
  }, [kit, fonts]);

  useGoogleFonts([fonts.logo, fonts.display, fonts.body]);

  const checks = [
    checkContrast(t.ink, t.surface, "본문 텍스트 / 배경", 7),
    checkContrast(t.inkSoft, t.surface, "보조 텍스트 / 배경", 4.5),
    checkContrast(t.onBrand, t.brand, "브랜드 위 텍스트", 4.5),
  ];

  const swatches = [
    { key: "surface", hex: t.surface, name: "배경", note: "가장 넓게 깔리는 면" },
    { key: "surfaceAlt", hex: t.surfaceAlt, name: "보조 배경", note: "카드·섹션 구분" },
    { key: "brand", hex: t.brand, name: kit.palette.brandName, note: "메인 브랜드 컬러" },
    { key: "brandDeep", hex: t.brandDeep, name: "브랜드 딥", note: "텍스트·강조" },
    { key: "accent", hex: t.accent, name: kit.palette.accentName, note: "좁은 면적 포인트" },
    { key: "ink", hex: t.ink, name: "잉크", note: "본문 텍스트" },
    { key: "inkSoft", hex: t.inkSoft, name: "잉크 소프트", note: "보조 텍스트" },
    { key: "line", hex: t.line, name: "라인", note: "구분선" },
  ];

  return (
    <div className="space-y-4">
      <Card title="레퍼런스 해부" hint={kit.dna.readsAs}>
        <div className="flex flex-wrap gap-1.5">
          <Pill tone="strong">{kit.dna.era}</Pill>
        </div>

        <div className="mt-4">
          <Label>그렇게 읽히는 이유</Label>
          <ul className="space-y-1.5 text-[13px] leading-relaxed text-ink-2">
            {kit.dna.signals.map((s) => (
              <li key={s} className="flex gap-2">
                <span className="shrink-0 text-ink-3">·</span>
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
          <div>
            <Label>가져올 것</Label>
            <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-ink-2">
              {kit.dna.borrow.map((b) => (
                <li key={b} className="flex gap-1.5">
                  <span className="text-good">＋</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Label>가져오면 안 되는 것</Label>
            <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-ink-2">
              {kit.dna.avoid.map((a) => (
                <li key={a} className="flex gap-1.5">
                  <span className="text-ink-3">－</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 rounded-lg border-l-2 border-brand-accent bg-surface-0 py-2 pl-3.5 pr-3">
          <Label>포지셔닝과의 정합성</Label>
          <p className="text-[13px] leading-relaxed">{kit.dna.positioningFit}</p>
        </div>
      </Card>

      <Card title="컬러 팔레트" hint={kit.palette.rationale}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {swatches.map((s) => (
            <button
              key={s.key}
              onClick={() => navigator.clipboard?.writeText(s.hex).catch(() => {})}
              className="group text-left"
              title="클릭하면 hex 복사"
            >
              <div
                className="h-20 w-full rounded-lg border border-line transition group-hover:scale-[1.02]"
                style={{ background: s.hex }}
              />
              <div className="mt-2">
                <div className="truncate text-[12.5px] font-semibold">{s.name}</div>
                <div className="font-mono text-[11.5px] uppercase text-ink-3">{s.hex}</div>
                <div className="mt-0.5 truncate text-[11px] text-ink-3">{s.note}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-5 border-t border-line pt-4">
          <Label>대비 검사</Label>
          <ul className="space-y-1.5">
            {checks.map((c) => (
              <li key={c.label} className="flex items-center justify-between gap-3 text-[12.5px]">
                <span className="text-ink-2">{c.label}</span>
                <span className="flex items-center gap-2">
                  <span className="tabular-nums text-ink-3">
                    {c.ratio.toFixed(1)}:1 <span className="text-ink-3">(기준 {c.min}:1)</span>
                  </span>
                  <Pill tone={c.pass ? "good" : "accent"}>{c.pass ? "통과" : "미달"}</Pill>
                </span>
              </li>
            ))}
          </ul>
          {checks.some((c) => !c.pass) && (
            <p className="mt-2.5 text-[12px] leading-relaxed text-brand-accent">
              미달 항목이 있습니다. 실제 적용 전에 해당 색을 더 어둡게(또는 밝게) 조정하세요.
              다시 생성하면 다른 조합이 나옵니다.
            </p>
          )}
        </div>
      </Card>

      <Card title="타이포그래피" hint={kit.typography.rationale}>
        <div className="space-y-5">
          <Specimen
            role="워드마크"
            font={fonts.logo}
            style={{
              fontFamily: t.logoFamily,
              fontSize: 40,
              letterSpacing: t.logoTracking,
              textTransform: t.logoCase === "none" ? undefined : t.logoCase,
              fontWeight: 600,
            }}
            sample={kit.logo.wordmark}
          />
          <Specimen
            role="헤드라인"
            font={fonts.display}
            style={{
              fontFamily: t.displayFamily,
              fontSize: 34,
              fontWeight: Number(t.displayWeight),
              letterSpacing: t.displayTracking,
              lineHeight: 1.3,
            }}
            sample={kit.copy.posterHeadline}
          />
          <Specimen
            role="본문"
            font={fonts.body}
            style={{ fontFamily: t.bodyFamily, fontSize: 15, lineHeight: 1.8 }}
            sample={kit.copy.heroSub}
          />
        </div>
      </Card>

      <Card title="시안" hint="각 시안은 PNG로 저장할 수 있습니다">
        <MockupGrid t={t} kit={kit} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="아트 디렉션">
          <dl className="space-y-3 text-[13px]">
            <Row term="사진" desc={kit.artDirection.photography} />
            <Row term="그래픽 장치" desc={kit.artDirection.graphicDevice} />
            <Row term="레이아웃" desc={kit.artDirection.layout} />
            <Row term="질감" desc={kit.artDirection.texture} />
            <Row term="심볼 아이디어" desc={kit.logo.symbolIdea} />
          </dl>
        </Card>

        <Card title="지킬 것 / 하지 말 것">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>지킬 것</Label>
              <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-ink-2">
                {kit.artDirection.dos.map((d) => (
                  <li key={d} className="flex gap-1.5">
                    <span className="text-good">＋</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Label>하지 말 것</Label>
              <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-ink-2">
                {kit.artDirection.donts.map((d) => (
                  <li key={d} className="flex gap-1.5">
                    <span className="text-ink-3">－</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4 border-t border-line pt-3.5">
            <Label>적용 시 주의</Label>
            <p className="text-[12.5px] leading-relaxed text-ink-2">{kit.usage}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Specimen({
  role,
  font,
  style,
  sample,
}: {
  role: string;
  font: string;
  style: React.CSSProperties;
  sample: string;
}) {
  return (
    <div className="border-b border-line pb-5 last:border-0 last:pb-0">
      <div className="mb-2 flex items-baseline gap-2">
        <Label>{role}</Label>
        <span className="mb-2.5 text-[11px] text-ink-3">{font}</span>
      </div>
      <p style={{ ...style, margin: 0, wordBreak: "keep-all" }}>{sample}</p>
    </div>
  );
}

function Row({ term, desc }: { term: string; desc: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">{term}</dt>
      <dd className="mt-0.5 leading-relaxed text-ink-2">{desc}</dd>
    </div>
  );
}
