"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  STATIC_BUILD,
  downloadJson,
  downloadText,
  getCallMode,
  getStoredApiKey,
  runJob,
  type StreamEvent,
} from "@/lib/client";
import { EMPTY_DESIGN, EMPTY_PRODUCT } from "@/lib/engine";
import {
  brandKitToMarkdown,
  positioningToDesignContext,
  positioningToMarkdown,
} from "@/lib/export";
import type { BrandKit } from "@/lib/schema/brand";
import type { Positioning } from "@/lib/schema/positioning";
import type { DesignInput, ProductInput } from "@/lib/prompts";
import {
  SAMPLE_DESIGN,
  SAMPLE_KIT,
  SAMPLE_POSITIONING,
  SAMPLE_PRODUCT,
} from "@/lib/sample";
import { BrandKitView } from "@/components/BrandKitView";
import { ImageUploader } from "@/components/ImageUploader";
import { PositioningReport } from "@/components/PositioningReport";
import { Settings } from "@/components/Settings";
import { Button, Card, Field, Input, Pill, Textarea } from "@/components/ui";

type Tab = "position" | "design";

const STORE_KEY = "brandlab.session.v1";

export default function Home() {
  const [tab, setTab] = useState<Tab>("position");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [needsKey, setNeedsKey] = useState(false);

  const [product, setProduct] = useState<ProductInput>(EMPTY_PRODUCT);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [positioning, setPositioning] = useState<Positioning | null>(null);
  const [posBusy, setPosBusy] = useState(false);
  const [posStage, setPosStage] = useState("");
  const [posChars, setPosChars] = useState(0);
  const [posError, setPosError] = useState("");

  const [design, setDesign] = useState<DesignInput>(EMPTY_DESIGN);
  const [refImages, setRefImages] = useState<string[]>([]);
  const [kit, setKit] = useState<BrandKit | null>(null);
  const [designBusy, setDesignBusy] = useState(false);
  const [designStage, setDesignStage] = useState("");
  const [designChars, setDesignChars] = useState(0);
  const [designError, setDesignError] = useState("");

  const abortRef = useRef<AbortController | null>(null);
  const resultTop = useRef<HTMLDivElement>(null);

  const refreshKeyState = useCallback(() => {
    setNeedsKey(getCallMode() === "browser" && !getStoredApiKey());
  }, []);

  // 새로고침으로 작업을 잃지 않도록 결과만 저장한다(이미지는 용량 때문에 제외).
  useEffect(() => {
    refreshKeyState();
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.product) setProduct({ ...EMPTY_PRODUCT, ...saved.product });
      if (saved.design) setDesign({ ...EMPTY_DESIGN, ...saved.design });
      if (saved.positioning) setPositioning(saved.positioning);
      if (saved.kit) setKit(saved.kit);
      if (saved.tab === "design") setTab("design");
    } catch {
      /* 저장된 데이터가 깨졌으면 무시하고 새로 시작한다 */
    }
  }, [refreshKeyState]);

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ product, design, positioning, kit, tab }));
    } catch {
      /* 용량 초과 등은 무시 — 저장은 편의 기능일 뿐이다 */
    }
  }, [product, design, positioning, kit, tab]);

  const handleEvent = useCallback(
    (
      e: StreamEvent,
      setStage: (s: string) => void,
      setChars: (n: number) => void,
      setError: (s: string) => void,
      onDone: (data: unknown) => void,
    ) => {
      if (e.type === "progress") {
        setStage(e.stage);
        setChars(e.chars);
      } else if (e.type === "error") {
        setError(e.message);
        if (e.message.includes("비밀번호") || e.message.includes("API 키")) {
          setSettingsOpen(true);
        }
      } else if (e.type === "done") {
        onDone(e.data);
      }
    },
    [],
  );

  const runPositioning = useCallback(async () => {
    if (!product.name.trim() && !product.description.trim()) {
      setPosError("제품명이나 제품 설명 중 하나는 입력해주세요.");
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPosBusy(true);
    setPosError("");
    setPosStage("요청 준비");
    setPosChars(0);
    setPositioning(null);

    try {
      await runJob(
        "position",
        { product, images: productImages },
        (e) =>
          handleEvent(e, setPosStage, setPosChars, setPosError, (data) => {
            const result = data as Positioning;
            setPositioning(result);
            // 디자인 탭에서 바로 이어갈 수 있게 컨텍스트를 채워둔다.
            setDesign((d) => ({
              ...d,
              brandName: d.brandName || product.name,
              category: d.category || product.category,
              productNote: d.productNote || product.description,
              positioningContext: positioningToDesignContext(result),
            }));
            setTimeout(() => resultTop.current?.scrollIntoView({ behavior: "smooth" }), 80);
          }),
        controller.signal,
      );
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        setPosError(err instanceof Error ? err.message : "요청에 실패했습니다.");
      }
    } finally {
      setPosBusy(false);
    }
  }, [product, productImages, handleEvent]);

  const runDesign = useCallback(async () => {
    if (refImages.length === 0 && !design.moodNote.trim()) {
      setDesignError("레퍼런스 이미지를 올리거나, 원하는 무드를 글로 설명해주세요.");
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setDesignBusy(true);
    setDesignError("");
    setDesignStage("요청 준비");
    setDesignChars(0);
    setKit(null);

    try {
      await runJob(
        "design",
        { design, images: refImages },
        (e) =>
          handleEvent(e, setDesignStage, setDesignChars, setDesignError, (data) => {
            setKit(data as BrandKit);
            setTimeout(() => resultTop.current?.scrollIntoView({ behavior: "smooth" }), 80);
          }),
        controller.signal,
      );
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        setDesignError(err instanceof Error ? err.message : "요청에 실패했습니다.");
      }
    } finally {
      setDesignBusy(false);
    }
  }, [design, refImages, handleEvent]);

  const busy = posBusy || designBusy;

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">BrandLab</h1>
          <p className="mt-1 text-[13.5px] text-ink-2">
            제품을 넣으면 포지셔닝을, 레퍼런스를 넣으면 브랜드 디자인을.
          </p>
        </div>

        <div className="no-print flex items-center gap-2">
          <nav className="flex rounded-lg border border-line bg-surface-1 p-1">
            <TabButton active={tab === "position"} onClick={() => setTab("position")} disabled={busy}>
              1. 포지셔닝
            </TabButton>
            <TabButton active={tab === "design"} onClick={() => setTab("design")} disabled={busy}>
              2. 디자인
            </TabButton>
          </nav>
          <Button variant="ghost" onClick={() => setSettingsOpen(true)}>
            설정
          </Button>
        </div>
      </header>

      <Settings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={() => {
          refreshKeyState();
          setPosError("");
          setDesignError("");
        }}
      />

      {needsKey && (
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-accent/45 bg-surface-1 px-4 py-3">
          <p className="text-[13px] leading-relaxed">
            {STATIC_BUILD
              ? "이 페이지는 서버 없이 동작합니다. 사용하려면 본인의 Gemini API 키가 필요합니다 (무료)."
              : "'내 API 키로 직접 호출' 모드입니다. API 키를 입력해주세요."}
          </p>
          <Button onClick={() => setSettingsOpen(true)}>API 키 입력</Button>
        </div>
      )}

      {tab === "position" ? (
        <div className="grid gap-4 lg:grid-cols-[380px_1fr] lg:items-start">
          <div className="space-y-4 lg:sticky lg:top-6">
            <Card title="제품 정보" hint="제품명 또는 설명만 있어도 시작할 수 있습니다">
              <div className="space-y-3.5">
                <Field label="제품명" required>
                  <Input
                    value={product.name}
                    placeholder="예: 라이트업 비타민 세럼"
                    onChange={(e) => setProduct({ ...product, name: e.target.value })}
                  />
                </Field>
                <Field label="카테고리">
                  <Input
                    value={product.category}
                    placeholder="예: 기초 화장품 / 앰플·세럼"
                    onChange={(e) => setProduct({ ...product, category: e.target.value })}
                  />
                </Field>
                <Field label="제품 설명" required>
                  <Textarea
                    rows={3}
                    value={product.description}
                    placeholder="이 제품이 무엇이고 무엇을 해주는지"
                    onChange={(e) => setProduct({ ...product, description: e.target.value })}
                  />
                </Field>
                <Field label="가격">
                  <Input
                    value={product.price}
                    placeholder="예: 38,000원 / 30ml"
                    onChange={(e) => setProduct({ ...product, price: e.target.value })}
                  />
                </Field>
                <Field label="주요 기능·성분·스펙">
                  <Textarea
                    rows={2}
                    value={product.features}
                    placeholder="차별화 근거가 되는 사실들"
                    onChange={(e) => setProduct({ ...product, features: e.target.value })}
                  />
                </Field>
                <Field label="생각하는 타겟">
                  <Input
                    value={product.audienceGuess}
                    placeholder="예: 20대 후반 여성"
                    onChange={(e) => setProduct({ ...product, audienceGuess: e.target.value })}
                  />
                </Field>
                <Field label="경쟁사">
                  <Input
                    value={product.competitors}
                    placeholder="예: 토리든, 아누아, 라운드랩"
                    onChange={(e) => setProduct({ ...product, competitors: e.target.value })}
                  />
                </Field>
                <Field label="자사 강점">
                  <Textarea
                    rows={2}
                    value={product.strengths}
                    placeholder="스스로 생각하는 강점"
                    onChange={(e) => setProduct({ ...product, strengths: e.target.value })}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="판매 채널">
                    <Input
                      value={product.channels}
                      placeholder="자사몰, 올리브영"
                      onChange={(e) => setProduct({ ...product, channels: e.target.value })}
                    />
                  </Field>
                  <Field label="시장">
                    <Input
                      value={product.market}
                      onChange={(e) => setProduct({ ...product, market: e.target.value })}
                    />
                  </Field>
                </div>
                <Field label="기타 참고사항">
                  <Textarea
                    rows={2}
                    value={product.extra}
                    placeholder="예산, 제약, 이미 시도해본 것 등"
                    onChange={(e) => setProduct({ ...product, extra: e.target.value })}
                  />
                </Field>
                <Field label="제품 이미지" hint="선택">
                  <ImageUploader
                    images={productImages}
                    onChange={setProductImages}
                    hint="제품 사진이나 상세페이지 캡처. 패키지 인상까지 함께 분석합니다."
                  />
                </Field>
              </div>

              <div className="mt-5 flex gap-2 border-t border-line pt-4">
                <Button onClick={runPositioning} disabled={busy} className="flex-1">
                  {posBusy ? "분석 중…" : "포지셔닝 분석"}
                </Button>
                {posBusy && (
                  <Button variant="ghost" onClick={() => abortRef.current?.abort()}>
                    중단
                  </Button>
                )}
                {!posBusy && positioning && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setProduct(EMPTY_PRODUCT);
                      setProductImages([]);
                      setPositioning(null);
                    }}
                  >
                    초기화
                  </Button>
                )}
              </div>
            </Card>
          </div>

          <div ref={resultTop} className="min-w-0">
            {posError && <ErrorBox message={posError} />}
            {posBusy && <Progress stage={posStage} chars={posChars} expected={9000} />}

            {positioning && !posBusy && (
              <div className="space-y-4">
                <div className="no-print flex flex-wrap justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() =>
                      downloadText(
                        (product.name || "positioning") + "-포지셔닝.md",
                        positioningToMarkdown(positioning, product.name),
                      )
                    }
                  >
                    마크다운 저장
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => downloadJson((product.name || "positioning") + ".json", positioning)}
                  >
                    JSON 저장
                  </Button>
                  <Button onClick={() => setTab("design")}>이 포지셔닝으로 디자인 만들기 →</Button>
                </div>
                <PositioningReport r={positioning} />
              </div>
            )}

            {!positioning && !posBusy && !posError && (
              <Placeholder
                title="왼쪽에 제품을 입력하고 분석을 시작하세요"
                body="타겟 세그먼트, 포지셔닝 맵, 포지셔닝 문장, 메시지 하우스, 태그라인, 채널 전략, 실행 항목까지 한 번에 나옵니다. 보통 1~3분 걸립니다."
                onSample={() => {
                  setProduct(SAMPLE_PRODUCT);
                  setPositioning(SAMPLE_POSITIONING);
                  setDesign({
                    ...SAMPLE_DESIGN,
                    positioningContext: positioningToDesignContext(SAMPLE_POSITIONING),
                  });
                }}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[380px_1fr] lg:items-start">
          <div className="space-y-4 lg:sticky lg:top-6">
            <Card title="레퍼런스" hint="이미지가 있으면 훨씬 정확합니다">
              <div className="space-y-3.5">
                <Field label="레퍼런스 이미지" hint="최대 4장">
                  <ImageUploader
                    images={refImages}
                    onChange={setRefImages}
                    hint="좋아하는 브랜드의 패키지·포스터·웹사이트 캡처. 색과 서체, 여백을 직접 읽어냅니다."
                  />
                </Field>
                <Field label="원하는 무드" hint="이미지가 없으면 필수">
                  <Textarea
                    rows={3}
                    value={design.moodNote}
                    placeholder="예: 조용하고 절제된, 종이 질감이 느껴지는, 약국 같은 신뢰감"
                    onChange={(e) => setDesign({ ...design, moodNote: e.target.value })}
                  />
                </Field>
                <Field label="브랜드명" hint="비우면 제안해드립니다">
                  <Input
                    value={design.brandName}
                    placeholder="예: 라이트업"
                    onChange={(e) => setDesign({ ...design, brandName: e.target.value })}
                  />
                </Field>
                <Field label="카테고리">
                  <Input
                    value={design.category}
                    placeholder="예: 기초 화장품"
                    onChange={(e) => setDesign({ ...design, category: e.target.value })}
                  />
                </Field>
                <Field label="제품 설명">
                  <Textarea
                    rows={2}
                    value={design.productNote}
                    onChange={(e) => setDesign({ ...design, productNote: e.target.value })}
                  />
                </Field>

                <Field label="포지셔닝 컨텍스트" hint="1번 탭에서 자동으로 채워집니다">
                  <Textarea
                    rows={4}
                    value={design.positioningContext}
                    placeholder="비어 있으면 레퍼런스만 보고 디자인합니다."
                    onChange={(e) => setDesign({ ...design, positioningContext: e.target.value })}
                  />
                </Field>
                {positioning && design.positioningContext && (
                  <Pill tone="good">포지셔닝 연동됨</Pill>
                )}
              </div>

              <div className="mt-5 flex gap-2 border-t border-line pt-4">
                <Button onClick={runDesign} disabled={busy} className="flex-1">
                  {designBusy ? "디자인 중…" : "브랜드 디자인 만들기"}
                </Button>
                {designBusy && (
                  <Button variant="ghost" onClick={() => abortRef.current?.abort()}>
                    중단
                  </Button>
                )}
                {!designBusy && kit && (
                  <Button variant="ghost" onClick={runDesign}>
                    다시 생성
                  </Button>
                )}
              </div>
            </Card>
          </div>

          <div ref={resultTop} className="min-w-0">
            {designError && <ErrorBox message={designError} />}
            {designBusy && <Progress stage={designStage} chars={designChars} expected={4500} />}

            {kit && !designBusy && (
              <div className="space-y-4">
                <div className="no-print flex flex-wrap justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() =>
                      downloadText(
                        (kit.logo.wordmark || "brand") + "-브랜드키트.md",
                        brandKitToMarkdown(kit),
                      )
                    }
                  >
                    마크다운 저장
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => downloadJson((kit.logo.wordmark || "brand") + "-kit.json", kit)}
                  >
                    JSON 저장
                  </Button>
                </div>
                <BrandKitView kit={kit} />
              </div>
            )}

            {!kit && !designBusy && !designError && (
              <Placeholder
                title="레퍼런스를 올리고 디자인을 시작하세요"
                body="레퍼런스를 해부해서 컬러 팔레트, 서체 조합, 로고 락업, 아트 디렉션을 만들고 — SNS 카드·포스터·패키지 라벨·웹 히어로 시안을 실제로 렌더링합니다. 각 시안은 PNG로 저장됩니다."
                onSample={() => {
                  setDesign({
                    ...SAMPLE_DESIGN,
                    positioningContext: positioningToDesignContext(SAMPLE_POSITIONING),
                  });
                  setKit(SAMPLE_KIT);
                }}
              />
            )}
          </div>
        </div>
      )}

      <footer className="mt-12 border-t border-line pt-5 text-[12px] leading-relaxed text-ink-3">
        Google Gemini로 분석합니다. 결과는 전략 초안이며, 경쟁사 정보와 시장 수치는 반드시 실제
        데이터로 검증한 뒤 사용하세요.
      </footer>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        "rounded-md px-3.5 py-1.5 text-[13px] font-medium transition disabled:opacity-40 " +
        (active ? "bg-ink text-surface-1" : "text-ink-2 hover:text-ink")
      }
    >
      {children}
    </button>
  );
}

function Progress({ stage, chars, expected }: { stage: string; chars: number; expected: number }) {
  const pct = Math.min(96, Math.round((chars / expected) * 100));
  return (
    <div className="rounded-xl border border-line bg-surface-1 px-5 py-6">
      <div className="flex items-center justify-between gap-3">
        <span className="bl-pulse text-[13.5px] font-medium">{stage}</span>
        <span className="tabular-nums text-[12px] text-ink-3">{pct}%</span>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-series-1 transition-[width] duration-500"
          style={{ width: Math.max(4, pct) + "%" }}
        />
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-ink-3">
        Gemini가 단계별로 작성 중입니다. 창을 닫지 말고 기다려주세요.
      </p>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-lg border border-brand-accent/45 bg-surface-1 px-4 py-3 text-[13px] leading-relaxed text-brand-accent">
      {message}
    </div>
  );
}

function Placeholder({
  title,
  body,
  onSample,
}: {
  title: string;
  body: string;
  onSample: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong px-6 py-16 text-center">
      <p className="text-[14px] font-medium">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink-3">{body}</p>
      <Button variant="ghost" onClick={onSample} className="mt-5">
        샘플 결과 둘러보기
      </Button>
      <p className="mt-2 text-[11.5px] text-ink-3">API 호출 없이 결과물의 형태만 미리 봅니다</p>
    </div>
  );
}
