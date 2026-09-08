"use client";

import type { CSSProperties } from "react";
import type { BrandKit } from "@/lib/schema/brand";
import { Frame } from "@/components/mockups/Frame";

export type Tokens = {
  surface: string;
  surfaceAlt: string;
  ink: string;
  inkSoft: string;
  brand: string;
  brandDeep: string;
  accent: string;
  onBrand: string;
  line: string;
  logoFamily: string;
  displayFamily: string;
  bodyFamily: string;
  logoCase: "uppercase" | "lowercase" | "none";
  logoTracking: string;
  displayWeight: string;
  displayTracking: string;
};

type Props = { t: Tokens; kit: BrandKit };

/** 워드마크 — 여러 목업에서 재사용한다. */
function Wordmark({
  t,
  kit,
  size,
  color,
  subColor,
  align = "center",
  showSub = true,
}: Props & {
  size: number;
  color: string;
  subColor: string;
  align?: "center" | "left";
  showSub?: boolean;
}) {
  return (
    <div style={{ textAlign: align === "center" ? "center" : "left" }}>
      <div
        style={{
          fontFamily: t.logoFamily,
          fontSize: size,
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: t.logoTracking,
          textTransform: t.logoCase === "none" ? undefined : t.logoCase,
          color,
        }}
      >
        {kit.logo.wordmark}
      </div>
      {showSub && kit.logo.sub && (
        <div
          style={{
            marginTop: size * 0.34,
            fontFamily: t.bodyFamily,
            fontSize: Math.max(10, size * 0.15),
            fontWeight: 500,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: subColor,
            marginRight: align === "center" ? "-0.3em" : 0,
          }}
        >
          {kit.logo.sub}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────  로고 락업  ───────────────────────── */

export function LogoLockup({ t, kit }: Props) {
  const { lockup } = kit.logo;

  const shell: CSSProperties = {
    width: "100%",
    height: "100%",
    background: t.surface,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  let inner: React.ReactNode;

  if (lockup === "horizontal") {
    inner = (
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <Wordmark t={t} kit={kit} size={68} color={t.ink} subColor={t.inkSoft} showSub={false} />
        <div style={{ width: 1, height: 54, background: t.line }} />
        <div
          style={{
            fontFamily: t.bodyFamily,
            fontSize: 13,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: t.inkSoft,
            maxWidth: 190,
            lineHeight: 1.7,
          }}
        >
          {kit.logo.sub}
        </div>
      </div>
    );
  } else if (lockup === "boxed") {
    inner = (
      <div style={{ background: t.brand, padding: "44px 64px", borderRadius: 2 }}>
        <Wordmark t={t} kit={kit} size={64} color={t.onBrand} subColor={t.onBrand} />
      </div>
    );
  } else if (lockup === "underlined") {
    inner = (
      <div style={{ textAlign: "center" }}>
        <Wordmark t={t} kit={kit} size={72} color={t.ink} subColor={t.inkSoft} showSub={false} />
        <div style={{ height: 5, background: t.brand, marginTop: 20 }} />
        <div
          style={{
            marginTop: 16,
            fontFamily: t.bodyFamily,
            fontSize: 13,
            letterSpacing: "0.34em",
            textTransform: "uppercase",
            color: t.inkSoft,
            marginRight: "-0.34em",
          }}
        >
          {kit.logo.sub}
        </div>
      </div>
    );
  } else if (lockup === "circle") {
    inner = (
      <div
        style={{
          width: 320,
          height: 320,
          borderRadius: "50%",
          border: "2px solid " + t.brand,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Wordmark t={t} kit={kit} size={48} color={t.ink} subColor={t.inkSoft} />
      </div>
    );
  } else {
    inner = <Wordmark t={t} kit={kit} size={78} color={t.ink} subColor={t.inkSoft} />;
  }

  return <div style={shell}>{inner}</div>;
}

/* ─────────────────────────  SNS 카드 1:1  ───────────────────────── */

export function SocialCard({ t, kit }: Props) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: t.surface,
        padding: 88,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 그래픽 장치 — 화면 밖으로 걸치는 큰 원 */}
      <div
        style={{
          position: "absolute",
          right: -220,
          top: -180,
          width: 620,
          height: 620,
          borderRadius: "50%",
          background: t.brand,
          opacity: 0.1,
        }}
      />

      <div style={{ position: "relative" }}>
        <Wordmark
          t={t}
          kit={kit}
          size={30}
          color={t.ink}
          subColor={t.inkSoft}
          align="left"
          showSub={false}
        />
      </div>

      <div style={{ position: "relative" }}>
        <div style={{ width: 68, height: 4, background: t.accent, marginBottom: 34 }} />
        <h2
          style={{
            fontFamily: t.displayFamily,
            fontWeight: Number(t.displayWeight),
            fontSize: 96,
            lineHeight: 1.16,
            letterSpacing: t.displayTracking,
            color: t.ink,
            margin: 0,
            wordBreak: "keep-all",
          }}
        >
          {kit.copy.socialHeadline}
        </h2>
        <p
          style={{
            fontFamily: t.bodyFamily,
            fontSize: 27,
            lineHeight: 1.7,
            color: t.inkSoft,
            marginTop: 30,
            marginBottom: 0,
            maxWidth: "82%",
            wordBreak: "keep-all",
          }}
        >
          {kit.copy.socialBody}
        </p>
      </div>

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid " + t.line,
          paddingTop: 26,
          fontFamily: t.bodyFamily,
          fontSize: 19,
          color: t.inkSoft,
        }}
      >
        <span>{kit.copy.descriptor}</span>
        <span style={{ letterSpacing: "0.2em", textTransform: "uppercase", color: t.brandDeep }}>
          {kit.copy.ctaLabel}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────  포스터 (A 비율)  ───────────────────────── */

export function Poster({ t, kit }: Props) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: t.surfaceAlt,
        padding: 76,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 300,
          height: 470,
          background: t.brand,
          opacity: 0.14,
        }}
      />

      <header
        style={{
          position: "relative",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <Wordmark
          t={t}
          kit={kit}
          size={26}
          color={t.ink}
          subColor={t.inkSoft}
          align="left"
          showSub={false}
        />
        <span
          style={{
            fontFamily: t.bodyFamily,
            fontSize: 12,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: t.inkSoft,
            textAlign: "right",
            maxWidth: 200,
            lineHeight: 1.8,
          }}
        >
          {kit.logo.sub}
        </span>
      </header>

      <div style={{ flex: 1 }} />

      <div style={{ position: "relative" }}>
        <h1
          style={{
            fontFamily: t.displayFamily,
            fontWeight: Number(t.displayWeight),
            fontSize: 92,
            lineHeight: 1.14,
            letterSpacing: t.displayTracking,
            color: t.ink,
            margin: 0,
            wordBreak: "keep-all",
          }}
        >
          {kit.copy.posterHeadline}
        </h1>
        <div style={{ width: 96, height: 3, background: t.accent, margin: "38px 0" }} />
        <p
          style={{
            fontFamily: t.bodyFamily,
            fontSize: 24,
            lineHeight: 1.75,
            color: t.inkSoft,
            margin: 0,
            maxWidth: "78%",
            wordBreak: "keep-all",
          }}
        >
          {kit.copy.posterSub}
        </p>
      </div>

      <footer
        style={{
          position: "relative",
          marginTop: 64,
          paddingTop: 24,
          borderTop: "1px solid " + t.line,
          display: "flex",
          justifyContent: "space-between",
          fontFamily: t.bodyFamily,
          fontSize: 16,
          color: t.inkSoft,
        }}
      >
        <span>{kit.copy.tagline}</span>
        <span>{kit.copy.descriptor}</span>
      </footer>
    </div>
  );
}

/* ─────────────────────────  패키지 라벨  ───────────────────────── */

export function PackageLabel({ t, kit }: Props) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: t.surfaceAlt,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 54,
      }}
    >
      {/* 병/박스에 붙는 라벨 한 장 */}
      <div
        style={{
          width: "100%",
          height: "100%",
          background: t.surface,
          border: "1px solid " + t.line,
          borderRadius: 3,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 18px 44px rgba(0,0,0,0.10)",
        }}
      >
        <div style={{ height: 14, background: t.brand }} />

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 38px",
            textAlign: "center",
          }}
        >
          <Wordmark t={t} kit={kit} size={38} color={t.ink} subColor={t.inkSoft} showSub={false} />

          <div style={{ width: 34, height: 1, background: t.line, margin: "30px 0" }} />

          <h2
            style={{
              fontFamily: t.displayFamily,
              fontWeight: Number(t.displayWeight),
              fontSize: 34,
              lineHeight: 1.35,
              letterSpacing: t.displayTracking,
              color: t.brandDeep,
              margin: 0,
              wordBreak: "keep-all",
            }}
          >
            {kit.copy.packageName}
          </h2>

          <p
            style={{
              fontFamily: t.bodyFamily,
              fontSize: 15,
              lineHeight: 1.8,
              color: t.inkSoft,
              marginTop: 16,
              marginBottom: 0,
              wordBreak: "keep-all",
            }}
          >
            {kit.copy.packageDescriptor}
          </p>
        </div>

        <div
          style={{
            borderTop: "1px solid " + t.line,
            padding: "18px 30px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: t.bodyFamily,
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: t.inkSoft,
          }}
        >
          <span>{kit.logo.sub}</span>
          <span style={{ color: t.ink, fontWeight: 600 }}>{kit.copy.packageVolume}</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────  웹 히어로  ───────────────────────── */

export function WebHero({ t, kit }: Props) {
  return (
    <div style={{ width: "100%", height: "100%", background: t.surface, display: "flex", flexDirection: "column" }}>
      {/* 브라우저 크롬 */}
      <div
        style={{
          height: 38,
          background: t.surfaceAlt,
          borderBottom: "1px solid " + t.line,
          display: "flex",
          alignItems: "center",
          paddingLeft: 18,
          gap: 8,
          flexShrink: 0,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: t.line }} />
        ))}
      </div>

      {/* 네비 */}
      <div
        style={{
          height: 74,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 60px",
          borderBottom: "1px solid " + t.line,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: t.logoFamily,
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: t.logoTracking,
            textTransform: t.logoCase === "none" ? undefined : t.logoCase,
            color: t.ink,
          }}
        >
          {kit.logo.wordmark}
        </div>
        <div style={{ display: "flex", gap: 34, fontFamily: t.bodyFamily, fontSize: 14, color: t.inkSoft }}>
          <span>브랜드</span>
          <span>제품</span>
          <span>저널</span>
          <span>스토어</span>
        </div>
      </div>

      {/* 히어로 */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <div
          style={{
            flex: "0 0 56%",
            padding: "62px 60px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: t.bodyFamily,
              fontSize: 12,
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: t.brandDeep,
              marginBottom: 22,
            }}
          >
            {kit.copy.descriptor}
          </span>
          <h1
            style={{
              fontFamily: t.displayFamily,
              fontWeight: Number(t.displayWeight),
              fontSize: 56,
              lineHeight: 1.2,
              letterSpacing: t.displayTracking,
              color: t.ink,
              margin: 0,
              wordBreak: "keep-all",
            }}
          >
            {kit.copy.heroHeadline}
          </h1>
          <p
            style={{
              fontFamily: t.bodyFamily,
              fontSize: 17,
              lineHeight: 1.8,
              color: t.inkSoft,
              margin: "24px 0 0",
              maxWidth: 460,
              wordBreak: "keep-all",
            }}
          >
            {kit.copy.heroSub}
          </p>
          <div style={{ marginTop: 38, display: "flex", alignItems: "center", gap: 20 }}>
            <span
              style={{
                background: t.brand,
                color: t.onBrand,
                fontFamily: t.bodyFamily,
                fontSize: 15,
                fontWeight: 600,
                padding: "15px 34px",
                borderRadius: 2,
              }}
            >
              {kit.copy.ctaLabel}
            </span>
            <span style={{ fontFamily: t.bodyFamily, fontSize: 14, color: t.inkSoft }}>
              {kit.copy.tagline}
            </span>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            background: t.brand,
            opacity: 0.92,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 40,
          }}
        >
          <div
            style={{
              fontFamily: t.displayFamily,
              fontSize: 22,
              lineHeight: 1.7,
              color: t.onBrand,
              textAlign: "center",
              letterSpacing: t.displayTracking,
              wordBreak: "keep-all",
            }}
          >
            {kit.copy.tagline}
          </div>
        </div>
      </div>

      {/* 셀링포인트 */}
      <div
        style={{
          display: "flex",
          borderTop: "1px solid " + t.line,
          flexShrink: 0,
        }}
      >
        {kit.copy.features.slice(0, 3).map((f, i) => (
          <div
            key={f.title}
            style={{
              flex: 1,
              padding: "26px 34px",
              borderLeft: i === 0 ? "none" : "1px solid " + t.line,
            }}
          >
            <div
              style={{
                fontFamily: t.bodyFamily,
                fontSize: 14,
                fontWeight: 700,
                color: t.ink,
                marginBottom: 7,
              }}
            >
              {f.title}
            </div>
            <div
              style={{
                fontFamily: t.bodyFamily,
                fontSize: 13,
                lineHeight: 1.65,
                color: t.inkSoft,
                wordBreak: "keep-all",
              }}
            >
              {f.body}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────  전체 묶음  ───────────────────────── */

export function MockupGrid({ t, kit }: Props) {
  const slug = (kit.logo.wordmark || "brand").replace(/[^\w가-힣-]+/g, "-").toLowerCase();

  return (
    <div className="space-y-8">
      <Frame w={900} h={500} label="로고 락업" filename={slug + "-logo.png"}>
        <LogoLockup t={t} kit={kit} />
      </Frame>

      <div className="grid gap-8 xl:grid-cols-2">
        <Frame w={1080} h={1080} label="SNS 카드 1:1" filename={slug + "-social.png"}>
          <SocialCard t={t} kit={kit} />
        </Frame>
        <Frame w={840} h={1188} label="포스터 A 비율" filename={slug + "-poster.png"}>
          <Poster t={t} kit={kit} />
        </Frame>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_1.6fr]">
        <Frame w={620} h={860} label="패키지 라벨" filename={slug + "-package.png"}>
          <PackageLabel t={t} kit={kit} />
        </Frame>
        <Frame w={1280} h={800} label="웹사이트 히어로" filename={slug + "-web.png"}>
          <WebHero t={t} kit={kit} />
        </Frame>
      </div>
    </div>
  );
}
