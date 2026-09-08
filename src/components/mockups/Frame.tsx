"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

// 측정은 페인트 전에 끝나야 크기 점프가 안 보인다. SSR에서는 useEffect로 물러난다.
const useMeasureEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * 목업은 고정 픽셀 크기로 그린 뒤 화면에서만 축소해 보여준다.
 * 이렇게 해야 레이아웃이 화면 폭에 따라 깨지지 않고,
 * PNG로 내보낼 때 항상 같은 해상도가 나온다.
 */
export function Frame({
  w,
  h,
  label,
  filename,
  children,
}: {
  w: number;
  h: number;
  label: string;
  filename: string;
  children: React.ReactNode;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const [measured, setMeasured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useMeasureEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      if (width > 0) {
        setScale(width / w);
        setMeasured(true);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [w]);

  const save = useCallback(async () => {
    const node = targetRef.current;
    if (!node) return;
    setSaving(true);
    setError("");
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(node, {
        width: w,
        height: h,
        pixelRatio: 2,
        cacheBust: true,
        // 화면용 축소 변환을 걷어내고 원래 크기로 캡처한다.
        style: { transform: "none", transformOrigin: "top left" },
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      setError("이미지 저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  }, [w, h, filename]);

  return (
    <figure className="min-w-0">
      <figcaption className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
          {label}
        </span>
        <span className="flex items-center gap-2">
          {error && <span className="text-[11px] text-brand-accent">{error}</span>}
          <button
            onClick={save}
            disabled={saving}
            className="no-print rounded-md px-2 py-1 text-[12px] font-medium text-ink-2 transition hover:bg-surface-2 hover:text-ink disabled:opacity-40"
          >
            {saving ? "저장 중…" : "PNG 저장"}
          </button>
        </span>
      </figcaption>

      <div
        ref={outerRef}
        className="overflow-hidden rounded-lg border border-line"
        style={{
          height: h * scale,
          visibility: measured ? "visible" : "hidden",
        }}
      >
        <div
          ref={targetRef}
          className="mockup"
          style={{
            width: w,
            height: h,
            transform: "scale(" + scale + ")",
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
    </figure>
  );
}
