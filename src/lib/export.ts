import type { BrandKit } from "@/lib/schema/brand";
import type { Positioning } from "@/lib/schema/positioning";

/** 포지셔닝 리포트를 노션·구글독스에 그대로 붙여넣을 수 있는 마크다운으로. */
export function positioningToMarkdown(r: Positioning, productName: string): string {
  const L: string[] = [];
  const h = (level: number, text: string) => L.push("\n" + "#".repeat(level) + " " + text + "\n");

  L.push("# " + (productName || "제품") + " 포지셔닝 리포트");
  L.push("\n> " + r.snapshot.oneLiner);

  h(2, "제품 진단");
  L.push("- **현재 카테고리**: " + r.snapshot.category);
  L.push("- **대안 프레임**: " + r.snapshot.categoryAlternatives.join(", "));
  L.push("- **현재 인식**: " + r.snapshot.asIs);
  L.push("- **핵심 과제**: " + r.snapshot.coreTension);

  h(2, "타겟 세그먼트");
  for (const a of r.audience) {
    h(3, a.name + " (" + a.priority + ")");
    L.push("- **프로필**: " + a.profile);
    L.push("- **해결하려는 일**: " + a.jobToBeDone);
    L.push("- **불편**: " + a.pain);
    L.push("- **구매 방아쇠**: " + a.trigger);
    L.push("- **안 사는 이유**: " + a.objection);
  }

  h(2, "포지셔닝 맵");
  L.push("- **가로축**: " + r.map.xAxis.label + " (" + r.map.xAxis.low + " ↔ " + r.map.xAxis.high + ")");
  L.push("- **세로축**: " + r.map.yAxis.label + " (" + r.map.yAxis.low + " ↔ " + r.map.yAxis.high + ")");
  L.push("");
  L.push("| 브랜드 | " + r.map.xAxis.label + " | " + r.map.yAxis.label + " | 메모 |");
  L.push("| --- | --- | --- | --- |");
  for (const c of r.map.competitors) {
    L.push("| " + c.name + " | " + Math.round(c.x) + " | " + Math.round(c.y) + " | " + c.note + " |");
  }
  L.push("| **" + r.map.you.label + "** | " + Math.round(r.map.you.x) + " | " + Math.round(r.map.you.y) + " | " + r.map.you.note + " |");
  L.push("");
  L.push("**" + r.map.whitespace.label + "** — " + r.map.whitespace.why);

  h(2, "포지셔닝 문장");
  L.push("> " + r.positioning.statement);
  L.push("");
  L.push("- **누구에게**: " + r.positioning.forWho);
  L.push("- **어떤 필요**: " + r.positioning.need);
  L.push("- **경쟁 프레임**: " + r.positioning.frame);
  L.push("- **핵심 편익**: " + r.positioning.benefit);
  L.push("- **무엇과 달리**: " + r.positioning.unlike);
  L.push("- **근거**: " + r.positioning.because);

  h(3, "대안 노선");
  for (const alt of r.positioning.alternatives) {
    L.push("- **" + alt.angle + "** — " + alt.statement + " _(포기하는 것: " + alt.tradeoff + ")_");
  }

  h(2, "차별점");
  for (const d of r.differentiators) {
    L.push("- **" + d.claim + "** (방어력 " + d.defensibility + ") — " + d.evidence);
  }

  h(2, "메시지 하우스");
  L.push("**핵심 메시지**: " + r.messaging.core);
  for (const p of r.messaging.pillars) {
    h(3, p.title);
    L.push(p.message);
    for (const pr of p.proof) L.push("- " + pr);
  }

  h(2, "브랜드 톤");
  L.push("- **아키타입**: " + r.brand.archetype + " — " + r.brand.archetypeWhy);
  L.push("- **톤**: " + r.brand.toneWords.join(", "));
  L.push("- **이렇게 말한다**: " + r.brand.voiceDo.join(" / "));
  L.push("- **이렇게 말하지 않는다**: " + r.brand.voiceDont.join(" / "));

  h(2, "태그라인 후보");
  for (const t of r.taglines) {
    L.push("- **" + t.line + "** (" + t.tone + ") — " + t.rationale);
  }

  h(2, "채널 전략");
  for (const c of r.channels) {
    L.push("- **" + c.channel + "** (우선순위 " + c.priority + ") — " + c.why + " → " + c.firstMove);
  }

  h(2, "리스크");
  for (const k of r.risks) L.push("- **" + k.risk + "** → " + k.mitigation);

  h(2, "이번 주에 할 것");
  r.quickWins.forEach((q, i) => L.push(i + 1 + ". " + q));

  h(2, "디자인 브리프");
  L.push(r.designBrief);

  return L.join("\n");
}

/** 브랜드 키트를 디자이너에게 넘길 스펙 문서로. */
export function brandKitToMarkdown(k: BrandKit): string {
  const L: string[] = [];
  const h = (level: number, text: string) => L.push("\n" + "#".repeat(level) + " " + text + "\n");

  L.push("# " + k.logo.wordmark + " 브랜드 키트");
  L.push("\n> " + k.dna.readsAs);

  h(2, "레퍼런스 해부");
  L.push("- **시대/사조**: " + k.dna.era);
  L.push("- **정합성**: " + k.dna.positioningFit);
  h(3, "관찰");
  for (const s of k.dna.signals) L.push("- " + s);
  h(3, "가져올 것");
  for (const b of k.dna.borrow) L.push("- " + b);
  h(3, "가져오면 안 되는 것");
  for (const a of k.dna.avoid) L.push("- " + a);

  h(2, "컬러");
  L.push("| 역할 | HEX | 이름 |");
  L.push("| --- | --- | --- |");
  L.push("| 배경 | `" + k.palette.surface + "` | surface |");
  L.push("| 보조 배경 | `" + k.palette.surfaceAlt + "` | surface-alt |");
  L.push("| 브랜드 | `" + k.palette.brand + "` | " + k.palette.brandName + " |");
  L.push("| 브랜드 딥 | `" + k.palette.brandDeep + "` | brand-deep |");
  L.push("| 포인트 | `" + k.palette.accent + "` | " + k.palette.accentName + " |");
  L.push("| 잉크 | `" + k.palette.ink + "` | ink |");
  L.push("| 잉크 소프트 | `" + k.palette.inkSoft + "` | ink-soft |");
  L.push("| 브랜드 위 텍스트 | `" + k.palette.onBrand + "` | on-brand |");
  L.push("| 라인 | `" + k.palette.line + "` | line |");
  L.push("\n" + k.palette.rationale);

  h(2, "타이포그래피");
  L.push("- **워드마크**: " + k.typography.logoFont + " / " + k.typography.logoCase + " / 자간 " + k.typography.logoTracking);
  L.push("- **헤드라인**: " + k.typography.displayFont + " / weight " + k.typography.displayWeight + " / 자간 " + k.typography.displayTracking);
  L.push("- **본문**: " + k.typography.bodyFont);
  L.push("\n" + k.typography.rationale);

  h(2, "로고");
  L.push("- **워드마크**: " + k.logo.wordmark);
  L.push("- **보조 텍스트**: " + k.logo.sub);
  L.push("- **락업**: " + k.logo.lockup);
  L.push("- **심볼 아이디어**: " + k.logo.symbolIdea);

  h(2, "아트 디렉션");
  L.push("- **사진**: " + k.artDirection.photography);
  L.push("- **그래픽 장치**: " + k.artDirection.graphicDevice);
  L.push("- **레이아웃**: " + k.artDirection.layout);
  L.push("- **질감**: " + k.artDirection.texture);
  h(3, "지킬 것");
  for (const d of k.artDirection.dos) L.push("- " + d);
  h(3, "하지 말 것");
  for (const d of k.artDirection.donts) L.push("- " + d);

  h(2, "카피");
  L.push("- **태그라인**: " + k.copy.tagline);
  L.push("- **카테고리 설명**: " + k.copy.descriptor);
  L.push("- **포스터**: " + k.copy.posterHeadline + " / " + k.copy.posterSub);
  L.push("- **SNS**: " + k.copy.socialHeadline + " / " + k.copy.socialBody);
  L.push("- **패키지**: " + k.copy.packageName + " / " + k.copy.packageDescriptor + " / " + k.copy.packageVolume);
  L.push("- **웹 히어로**: " + k.copy.heroHeadline + " / " + k.copy.heroSub);
  L.push("- **CTA**: " + k.copy.ctaLabel);
  h(3, "셀링포인트");
  for (const f of k.copy.features) L.push("- **" + f.title + "** — " + f.body);

  h(2, "적용 시 주의");
  L.push(k.usage);

  return L.join("\n");
}

/** 포지셔닝 결과를 디자인 프롬프트에 넘길 압축 컨텍스트로. */
export function positioningToDesignContext(r: Positioning): string {
  return [
    "포지셔닝: " + r.positioning.statement,
    "타겟: " + r.audience.map((a) => a.name).join(" / "),
    "경쟁 프레임: " + r.positioning.frame,
    "차별점: " + r.differentiators.map((d) => d.claim).join(" / "),
    "브랜드 아키타입: " + r.brand.archetype,
    "톤: " + r.brand.toneWords.join(", "),
    "핵심 메시지: " + r.messaging.core,
    "태그라인 후보: " + r.taglines.map((t) => t.line).join(" / "),
    "",
    "디자인 브리프: " + r.designBrief,
  ].join("\n");
}
