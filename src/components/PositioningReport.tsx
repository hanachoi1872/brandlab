"use client";

import type { Positioning } from "@/lib/schema/positioning";
import { PositioningMap } from "@/components/PositioningMap";
import { Card, CopyButton, Label, Pill } from "@/components/ui";

type Tone = "neutral" | "strong" | "accent" | "good";

// 모델이 목록 밖의 값을 줄 수 있으므로 기본값으로 떨어지게 둔다.
const PRIORITY_TONE: Record<string, Tone> = {
  "1순위": "accent",
  "2순위": "strong",
  "3순위": "neutral",
};
const DEFENSE_TONE: Record<string, Tone> = { 높음: "good", 중간: "strong", 낮음: "neutral" };

export function PositioningReport({ r }: { r: Positioning }) {
  return (
    <div className="space-y-4">
      <Card title="제품 진단" hint="지금 이대로면 시장에서 어떻게 읽히는가">
        <p className="text-[17px] font-semibold leading-snug tracking-tight">{r.snapshot.oneLiner}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Pill tone="strong">{r.snapshot.category}</Pill>
          {r.snapshot.categoryAlternatives.slice(0, 3).map((c) => (
            <Pill key={c}>대안 프레임: {c}</Pill>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>현재 인식</Label>
            <p className="text-[13.5px] leading-relaxed text-ink-2">{r.snapshot.asIs}</p>
          </div>
          <div className="rounded-lg border-l-2 border-brand-accent bg-surface-0 py-1 pl-3.5">
            <Label>핵심 과제</Label>
            <p className="text-[13.5px] leading-relaxed">{r.snapshot.coreTension}</p>
          </div>
        </div>
      </Card>

      <Card title="타겟 세그먼트" hint="셋 중 하나를 고르면 나머지 둘을 포기하는 것입니다">
        <div className="grid gap-3 lg:grid-cols-3">
          {r.audience.slice(0, 3).map((a) => (
            <article key={a.name} className="rounded-lg border border-line bg-surface-0 p-4">
              <div className="mb-2.5 flex items-start justify-between gap-2">
                <h3 className="text-[14px] font-semibold leading-snug">{a.name}</h3>
                <Pill tone={PRIORITY_TONE[a.priority] ?? "neutral"}>{a.priority}</Pill>
              </div>
              <p className="text-[13px] leading-relaxed text-ink-2">{a.profile}</p>
              <dl className="mt-3.5 space-y-2.5 border-t border-line pt-3.5 text-[12.5px] leading-relaxed">
                <Row term="해결하려는 일" desc={a.jobToBeDone} />
                <Row term="불편" desc={a.pain} />
                <Row term="구매 방아쇠" desc={a.trigger} />
                <Row term="안 사는 이유" desc={a.objection} accent />
              </dl>
            </article>
          ))}
        </div>
      </Card>

      <Card title="포지셔닝 맵" hint="소비자가 실제로 저울질하는 두 축 위에서">
        <PositioningMap map={r.map} />
      </Card>

      <Card
        title="포지셔닝 문장"
        hint="사내 문서에 그대로 붙여넣을 수 있는 형태"
        actions={<CopyButton text={r.positioning.statement} />}
      >
        <blockquote className="border-l-2 border-series-1 pl-4 text-[15.5px] font-medium leading-relaxed">
          {r.positioning.statement}
        </blockquote>

        <dl className="mt-5 grid gap-x-6 gap-y-3 border-t border-line pt-4 text-[13px] sm:grid-cols-2">
          <Row term="누구에게" desc={r.positioning.forWho} />
          <Row term="어떤 필요" desc={r.positioning.need} />
          <Row term="경쟁 프레임" desc={r.positioning.frame} />
          <Row term="핵심 편익" desc={r.positioning.benefit} />
          <Row term="무엇과 달리" desc={r.positioning.unlike} />
          <Row term="근거" desc={r.positioning.because} />
        </dl>

        <div className="mt-5 border-t border-line pt-4">
          <Label>다른 노선을 택한다면</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {r.positioning.alternatives.slice(0, 3).map((alt) => (
              <div key={alt.angle} className="rounded-lg border border-line bg-surface-0 p-3.5">
                <h4 className="text-[13px] font-semibold">{alt.angle}</h4>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{alt.statement}</p>
                <p className="mt-2.5 border-t border-line pt-2 text-[12px] leading-relaxed text-ink-3">
                  포기하는 것 — {alt.tradeoff}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="차별점" hint="따라하기 어려운 순서로">
          <ul className="space-y-3">
            {r.differentiators.map((d) => (
              <li key={d.claim} className="border-b border-line pb-3 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-[13.5px] font-semibold leading-snug">{d.claim}</h4>
                  <Pill tone={DEFENSE_TONE[d.defensibility] ?? "neutral"}>
                    방어력 {d.defensibility}
                  </Pill>
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">근거 — {d.evidence}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="브랜드 톤" hint={r.brand.archetype + " 아키타입"}>
          <p className="text-[13px] leading-relaxed text-ink-2">{r.brand.archetypeWhy}</p>
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {r.brand.toneWords.map((w) => (
              <Pill key={w} tone="strong">
                {w}
              </Pill>
            ))}
          </div>
          <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
            <div>
              <Label>이렇게 말한다</Label>
              <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-ink-2">
                {r.brand.voiceDo.map((v) => (
                  <li key={v} className="flex gap-1.5">
                    <span className="text-good">＋</span>
                    {v}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Label>이렇게 말하지 않는다</Label>
              <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-ink-2">
                {r.brand.voiceDont.map((v) => (
                  <li key={v} className="flex gap-1.5">
                    <span className="text-ink-3">－</span>
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>

      <Card title="메시지 하우스" actions={<CopyButton text={r.messaging.core} label="핵심 메시지 복사" />}>
        <p className="text-center text-[16px] font-semibold leading-snug tracking-tight">
          {r.messaging.core}
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {r.messaging.pillars.slice(0, 3).map((p, i) => (
            <div key={p.title} className="rounded-lg border border-line bg-surface-0 p-4">
              <span className="text-[11px] font-semibold tabular-nums text-ink-3">
                0{i + 1}
              </span>
              <h4 className="mt-1 text-[13.5px] font-semibold">{p.title}</h4>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{p.message}</p>
              <ul className="mt-3 space-y-1 border-t border-line pt-2.5 text-[12px] leading-relaxed text-ink-3">
                {p.proof.map((pr) => (
                  <li key={pr}>· {pr}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <Card title="태그라인 후보" hint="서로 다른 결로 다섯 가지">
        <ul className="divide-y divide-line">
          {r.taglines.map((t) => (
            <li key={t.line} className="flex items-start gap-4 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold leading-snug tracking-tight">{t.line}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">{t.rationale}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Pill>{t.tone}</Pill>
                <CopyButton text={t.line} />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="채널 전략">
          <ul className="space-y-3">
            {r.channels.map((c) => (
              <li key={c.channel} className="border-b border-line pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-[13.5px] font-semibold">{c.channel}</h4>
                  <Pill tone={c.priority === "높음" ? "accent" : "neutral"}>{c.priority}</Pill>
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">{c.why}</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed">
                  <span className="text-ink-3">첫 액션 — </span>
                  {c.firstMove}
                </p>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card title="리스크">
            <ul className="space-y-3">
              {r.risks.map((k) => (
                <li key={k.risk} className="border-b border-line pb-3 last:border-0 last:pb-0">
                  <p className="text-[13px] font-medium leading-relaxed">{k.risk}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">→ {k.mitigation}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="이번 주에 할 것">
            <ol className="space-y-2">
              {r.quickWins.map((q, i) => (
                <li key={q} className="flex gap-2.5 text-[13px] leading-relaxed">
                  <span className="shrink-0 tabular-nums font-semibold text-ink-3">{i + 1}</span>
                  {q}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>

      <Card
        title="디자인 브리프"
        hint="이 내용은 디자인 탭으로 자동으로 넘어갑니다"
        actions={<CopyButton text={r.designBrief} />}
      >
        <p className="text-[13.5px] leading-relaxed text-ink-2">{r.designBrief}</p>
      </Card>
    </div>
  );
}

function Row({ term, desc, accent }: { term: string; desc: string; accent?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">{term}</dt>
      <dd className={"mt-0.5 leading-relaxed " + (accent ? "text-brand-accent" : "text-ink-2")}>
        {desc}
      </dd>
    </div>
  );
}
