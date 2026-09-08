import { z } from "zod";
import { BODY_FONTS, DISPLAY_FONTS, LOGO_FONTS } from "@/lib/fonts";

const hex = (what: string) => z.string().describe(`${what}. #RRGGBB 형식의 6자리 hex.`);

/**
 * 브랜드 키트 스키마.
 * 여기서 나온 토큰이 그대로 목업 컴포넌트의 CSS 변수로 들어간다 —
 * 즉 모델이 고른 색과 서체가 실제로 화면에 렌더링된다.
 */
export const BrandKitSchema = z.object({
  dna: z.object({
    readsAs: z.string().describe("레퍼런스가 한마디로 어떤 인상인지"),
    era: z.string().describe("어느 시대/사조의 언어인지 (예: 90년대 일본 미니멀, 60년대 스위스)"),
    signals: z.array(z.string()).describe("그렇게 읽히는 구체적 근거 4~6개. '여백이 넓다'가 아니라 '판면의 40%를 여백으로 비우고 텍스트를 하단 1/3에 몰아넣었다' 수준으로."),
    borrow: z.array(z.string()).describe("이 제품에 가져올 요소 3~4개"),
    avoid: z.array(z.string()).describe("가져오면 안 되는 요소 2~3개와 그 이유"),
    positioningFit: z.string().describe("이 레퍼런스가 제품 포지셔닝과 맞는지, 어긋나면 어디가 어긋나는지"),
  }),

  palette: z.object({
    surface: hex("가장 넓게 깔리는 배경색"),
    surfaceAlt: hex("보조 배경색. surface와 미세하게 다른 톤"),
    ink: hex("본문 텍스트 색. surface 위에서 대비 7:1 이상"),
    inkSoft: hex("보조 텍스트 색. surface 위에서 대비 4.5:1 이상"),
    brand: hex("메인 브랜드 컬러. 가장 눈에 띄는 색"),
    brandDeep: hex("brand의 어두운 변형. 텍스트나 강조용"),
    accent: hex("포인트 컬러. 아주 좁은 면적에만 쓴다"),
    onBrand: hex("brand 배경 위에 올라가는 텍스트 색. 대비 4.5:1 이상"),
    line: hex("구분선 색"),
    brandName: z.string().describe("brand 컬러에 붙인 이름 (예: '늦은 오후의 테라코타')"),
    accentName: z.string().describe("accent 컬러에 붙인 이름"),
    rationale: z.string().describe("이 팔레트가 레퍼런스와 제품에 맞는 이유"),
  }),

  // 구조화 출력은 enum을 제약이 아니라 설명 힌트로만 전달한다.
  // 그래서 스키마는 관대하게 받고, 화면에서 화이트리스트로 보정한다 —
  // 서체 이름 하나 어긋났다고 분석 결과 전체를 버리면 안 되기 때문.
  typography: z.object({
    logoFont: z.string().describe("워드마크 서체. 반드시 다음 중 하나: " + LOGO_FONTS.join(" | ")),
    displayFont: z
      .string()
      .describe("한글 헤드라인 서체. 반드시 다음 중 하나: " + DISPLAY_FONTS.join(" | ")),
    bodyFont: z.string().describe("한글 본문 서체. 반드시 다음 중 하나: " + BODY_FONTS.join(" | ")),
    logoCase: z.string().describe("uppercase | lowercase | none 중 하나"),
    logoTracking: z
      .string()
      .describe("워드마크 자간. -0.04em | -0.02em | 0em | 0.04em | 0.1em | 0.2em | 0.34em 중 하나"),
    displayWeight: z.string().describe("헤드라인 굵기. 300 | 400 | 500 | 600 | 700 | 800 | 900 중 하나"),
    displayTracking: z
      .string()
      .describe("헤드라인 자간. -0.05em | -0.03em | -0.015em | 0em | 0.02em | 0.06em 중 하나"),
    rationale: z.string().describe("이 조합을 고른 이유"),
  }),

  logo: z.object({
    wordmark: z.string().describe("워드마크에 들어갈 텍스트. 브랜드명."),
    sub: z.string().describe("워드마크 아래 붙는 짧은 보조 텍스트 (예: SKINCARE, EST. 2024). 3단어 이내."),
    lockup: z
      .string()
      .describe("stacked | horizontal | boxed | underlined | circle 중 하나"),
    symbolIdea: z.string().describe("심볼을 만든다면 어떤 형태여야 하는지"),
  }),

  artDirection: z.object({
    photography: z.string().describe("사진 방향 — 피사체, 광원, 배경, 색온도"),
    graphicDevice: z.string().describe("반복해서 쓸 그래픽 장치 하나"),
    layout: z.string().describe("레이아웃 원칙 — 그리드, 여백, 정렬"),
    texture: z.string().describe("종이/질감/마감"),
    dos: z.array(z.string()).describe("반드시 지킬 것 3~4개"),
    donts: z.array(z.string()).describe("절대 하지 말 것 3~4개"),
  }),

  copy: z.object({
    tagline: z.string().describe("태그라인. 12자 이내가 이상적."),
    descriptor: z.string().describe("카테고리 설명 한 줄 (예: 저온 추출 콜드브루)"),
    posterHeadline: z.string().describe("포스터용 헤드라인. 짧고 강하게. 20자 이내."),
    posterSub: z.string().describe("포스터 서브카피 한 줄"),
    socialHeadline: z.string().describe("SNS 카드용 헤드라인. 15자 이내."),
    socialBody: z.string().describe("SNS 카드 본문 두 줄 이내"),
    packageName: z.string().describe("패키지 전면 제품명"),
    packageDescriptor: z.string().describe("패키지 전면 설명 (예: 고보습 세럼)"),
    packageVolume: z.string().describe("용량 표기 (예: 50ml / NET 250g)"),
    heroHeadline: z.string().describe("웹사이트 히어로 헤드라인"),
    heroSub: z.string().describe("웹사이트 히어로 서브카피"),
    ctaLabel: z.string().describe("버튼 문구. 6자 이내."),
    features: z.array(
      z.object({ title: z.string(), body: z.string().describe("한 줄") }),
    ).describe("웹 히어로 아래 들어갈 셀링포인트 3개"),
  }),

  usage: z.string().describe("이 키트를 실무에 적용할 때의 주의사항 한 단락"),
});

export type BrandKit = z.infer<typeof BrandKitSchema>;
