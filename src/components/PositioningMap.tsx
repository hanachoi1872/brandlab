"use client";

import { useMemo, useState } from "react";
import { clamp } from "@/lib/client";
import type { Positioning } from "@/lib/schema/positioning";
import { Button, Label } from "@/components/ui";

const W = 760;
const H = 560;
const PAD = { l: 104, r: 40, t: 52, b: 88 };
const X0 = PAD.l;
const X1 = W - PAD.r;
const Y0 = PAD.t;
const Y1 = H - PAD.b;

type Point = {
  name: string;
  note: string;
  x: number;
  y: number;
  px: number;
  py: number;
  labelY: number;
  isYou: boolean;
};

/**
 * 포지셔닝 맵.
 * 데이터 계열은 '우리 제품' 하나뿐이고 경쟁사는 이름표가 붙은 참조 마크다 —
 * 그래서 색이 아니라 이름으로 구별된다(색만으로 식별하지 않음).
 */
export function PositioningMap({ map }: { map: Positioning["map"] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);

  const points = useMemo<Point[]>(() => {
    const toPx = (x: number, y: number) => ({
      px: X0 + (clamp(x) / 100) * (X1 - X0),
      py: Y1 - (clamp(y) / 100) * (Y1 - Y0),
    });

    const raw: Point[] = [];

    for (const c of (map.competitors ?? []).slice(0, 8)) {
      const { px, py } = toPx(c.x, c.y);
      raw.push({
        name: c.name,
        note: c.note,
        x: clamp(c.x),
        y: clamp(c.y),
        px,
        py,
        labelY: py + 24,
        isYou: false,
      });
    }

    const you = toPx(map.you.x, map.you.y);
    raw.push({
      name: map.you.label || "우리 제품",
      note: map.you.note,
      x: clamp(map.you.x),
      y: clamp(map.you.y),
      px: you.px,
      py: you.py,
      labelY: you.py + 30,
      isYou: true,
    });

    // 이름표가 겹치지 않게 위에서부터 훑으며 아래로 밀어낸다.
    const sorted = [...raw].sort((a, b) => a.labelY - b.labelY);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const cur = sorted[i];
      if (cur.labelY - prev.labelY < 17 && Math.abs(cur.px - prev.px) < 130) {
        cur.labelY = prev.labelY + 17;
      }
    }
    return raw;
  }, [map]);

  const ws = useMemo(() => {
    const x = clamp(map.whitespace.x);
    const y = clamp(map.whitespace.y);
    const w = clamp(map.whitespace.w, 0, 100 - x);
    const h = clamp(map.whitespace.h, 0, 100 - y);
    return {
      x: X0 + (x / 100) * (X1 - X0),
      y: Y1 - ((y + h) / 100) * (Y1 - Y0),
      w: (w / 100) * (X1 - X0),
      h: (h / 100) * (Y1 - Y0),
    };
  }, [map]);

  if (asTable) {
    return (
      <div>
        <div className="flex justify-end">
          <Button variant="quiet" onClick={() => setAsTable(false)} className="no-print">
            차트로 보기
          </Button>
        </div>
        <table className="mt-3 w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line-strong text-left text-[11px] uppercase tracking-[0.12em] text-ink-3">
              <th className="py-2 pr-3 font-semibold">브랜드</th>
              <th className="py-2 pr-3 font-semibold">{map.xAxis.label}</th>
              <th className="py-2 pr-3 font-semibold">{map.yAxis.label}</th>
              <th className="py-2 font-semibold">메모</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p, i) => (
              <tr key={p.name + i} className="border-b border-line align-top">
                <td className="py-2 pr-3 font-medium">
                  {p.name}
                  {p.isYou && <span className="ml-1.5 text-[11px] text-series-1">← 우리</span>}
                </td>
                <td className="py-2 pr-3 tabular-nums text-ink-2">{Math.round(p.x)}</td>
                <td className="py-2 pr-3 tabular-nums text-ink-2">{Math.round(p.y)}</td>
                <td className="py-2 text-ink-2">{p.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const hovered = hover !== null ? points[hover] : null;

  return (
    <div>
      <div className="flex justify-end">
        <Button variant="quiet" onClick={() => setAsTable(true)} className="no-print">
          표로 보기
        </Button>
      </div>

      <div className="relative mt-3">
        <svg
          viewBox={"0 0 " + W + " " + H}
          className="w-full"
          role="img"
          aria-label={"포지셔닝 맵. 가로축 " + map.xAxis.label + ", 세로축 " + map.yAxis.label + "."}
        >
          {/* 사분면 기준선 — 격자는 뒤로 물러나야 한다 */}
          <line x1={X0} y1={(Y0 + Y1) / 2} x2={X1} y2={(Y0 + Y1) / 2} stroke="var(--line)" strokeWidth="1" />
          <line x1={(X0 + X1) / 2} y1={Y0} x2={(X0 + X1) / 2} y2={Y1} stroke="var(--line)" strokeWidth="1" />
          <rect
            x={X0}
            y={Y0}
            width={X1 - X0}
            height={Y1 - Y0}
            fill="none"
            stroke="var(--line-strong)"
            strokeWidth="1"
          />

          {/* 기회 영역 */}
          {ws.w > 4 && ws.h > 4 && (
            <g>
              <rect
                x={ws.x}
                y={ws.y}
                width={ws.w}
                height={ws.h}
                fill="var(--series-1)"
                fillOpacity="0.07"
                stroke="var(--series-1)"
                strokeOpacity="0.5"
                strokeWidth="1.5"
                strokeDasharray="5 4"
                rx="4"
              />
              <text
                x={ws.x + ws.w / 2}
                y={ws.y + 17}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                letterSpacing="0.06em"
                fill="var(--series-1)"
              >
                {map.whitespace.label}
              </text>
            </g>
          )}

          {/* 축 */}
          <text x={(X0 + X1) / 2} y={Y1 + 62} textAnchor="middle" fontSize="12.5" fontWeight="600" fill="var(--ink-2)">
            {map.xAxis.label}
          </text>
          <text x={X0} y={Y1 + 26} textAnchor="start" fontSize="11.5" fill="var(--ink-3)">
            ← {map.xAxis.low}
          </text>
          <text x={X1} y={Y1 + 26} textAnchor="end" fontSize="11.5" fill="var(--ink-3)">
            {map.xAxis.high} →
          </text>

          <text
            transform={"translate(26 " + (Y0 + Y1) / 2 + ") rotate(-90)"}
            textAnchor="middle"
            fontSize="12.5"
            fontWeight="600"
            fill="var(--ink-2)"
          >
            {map.yAxis.label}
          </text>
          <text
            transform={"translate(60 " + (Y0 + 4) + ") rotate(-90)"}
            textAnchor="end"
            fontSize="11.5"
            fill="var(--ink-3)"
          >
            {map.yAxis.high} →
          </text>
          <text
            transform={"translate(60 " + (Y1 - 4) + ") rotate(-90)"}
            textAnchor="start"
            fontSize="11.5"
            fill="var(--ink-3)"
          >
            ← {map.yAxis.low}
          </text>

          {/* 마크 — 겹칠 수 있으므로 표면색 링을 두른다 */}
          {points.map((p, i) => (
            <g
              key={p.name + i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <circle cx={p.px} cy={p.py} r="20" fill="transparent" />
              {p.isYou && (
                <circle
                  cx={p.px}
                  cy={p.py}
                  r="15"
                  fill="none"
                  stroke="var(--series-1)"
                  strokeWidth="1.5"
                  strokeOpacity="0.4"
                />
              )}
              <line
                x1={p.px}
                y1={p.py + (p.isYou ? 11 : 8)}
                x2={p.px}
                y2={p.labelY - 9}
                stroke={p.isYou ? "var(--series-1)" : "var(--line-strong)"}
                strokeWidth="1"
                strokeOpacity={p.labelY - p.py > 22 ? 0.55 : 0}
              />
              <circle
                cx={p.px}
                cy={p.py}
                r={p.isYou ? 8 : 5.5}
                fill={p.isYou ? "var(--series-1)" : "var(--ink-3)"}
                stroke="var(--surface-1)"
                strokeWidth="2"
              />
              <text
                x={p.px}
                y={p.labelY}
                textAnchor="middle"
                fontSize={p.isYou ? "12.5" : "11.5"}
                fontWeight={p.isYou ? "700" : "500"}
                fill={p.isYou ? "var(--series-1)" : "var(--ink-2)"}
                paintOrder="stroke"
                stroke="var(--surface-1)"
                strokeWidth="3.5"
                strokeLinejoin="round"
              >
                {p.name}
              </text>
            </g>
          ))}
        </svg>

        {hovered && hovered.note && (
          <div
            className="pointer-events-none absolute z-10 w-56 -translate-x-1/2 rounded-lg border border-line-strong bg-surface-1 px-3 py-2 text-[12px] leading-relaxed shadow-lg"
            style={{
              left: (hovered.px / W) * 100 + "%",
              top: ((hovered.py + 28) / H) * 100 + "%",
            }}
          >
            <span className="font-semibold">{hovered.name}</span>
            <span className="mt-0.5 block text-ink-2">{hovered.note}</span>
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-ink-2">
        <span className="flex items-center gap-1.5">
          <svg width="14" height="14" aria-hidden="true">
            <circle cx="7" cy="7" r="5" fill="var(--series-1)" />
          </svg>
          우리 제품 (권장 포지션)
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="14" height="14" aria-hidden="true">
            <circle cx="7" cy="7" r="4" fill="var(--ink-3)" />
          </svg>
          경쟁 브랜드
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="14" height="14" aria-hidden="true">
            <rect
              x="1"
              y="3"
              width="12"
              height="8"
              rx="2"
              fill="var(--series-1)"
              fillOpacity="0.12"
              stroke="var(--series-1)"
              strokeOpacity="0.5"
              strokeDasharray="3 2"
            />
          </svg>
          {map.whitespace.label}
        </span>
      </div>

      <div className="mt-4 rounded-lg border border-line bg-surface-0 px-4 py-3">
        <Label>이 자리가 비어 있는 이유</Label>
        <p className="text-[13.5px] leading-relaxed text-ink-2">{map.whitespace.why}</p>
      </div>
    </div>
  );
}
