import { z } from "zod";

/**
 * 포지셔닝 리포트 스키마.
 * 구조화 출력(output_config.format)으로 강제하므로, 여기 있는 필드는 항상 채워져서 온다.
 * 배열 길이는 JSON Schema 제약 대신 프롬프트로 지시하고, UI에서 방어적으로 자른다.
 */
export const PositioningSchema = z.object({
  snapshot: z.object({
    oneLiner: z.string().describe("이 제품이 무엇인지 한 문장으로. 마케팅 수식어 없이 사실로."),
    category: z.string().describe("지금 소비자 머릿속에서 속하는 카테고리"),
    categoryAlternatives: z.array(z.string()).describe("이 제품을 다르게 규정할 수 있는 대안 카테고리 2~3개"),
    asIs: z.string().describe("아무것도 안 바꾸면 시장에서 어떻게 읽히는지. 냉정하게."),
    coreTension: z.string().describe("가장 큰 포지셔닝 과제 한 가지"),
  }),

  audience: z.array(
    z.object({
      name: z.string().describe("세그먼트 이름 (예: '성분 따지는 30대 직장인')"),
      profile: z.string().describe("연령·상황·소득·라이프스타일"),
      jobToBeDone: z.string().describe("이 사람이 제품을 '고용'해서 해결하려는 일"),
      pain: z.string().describe("지금 겪는 불편"),
      trigger: z.string().describe("구매 방아쇠가 되는 순간"),
      objection: z.string().describe("그럼에도 안 사는 이유"),
      priority: z.string().describe("1순위 | 2순위 | 3순위 중 하나"),
    }),
  ).describe("정확히 3개, 우선순위 순으로"),

  map: z.object({
    xAxis: z.object({
      label: z.string(),
      low: z.string().describe("왼쪽 끝 레이블"),
      high: z.string().describe("오른쪽 끝 레이블"),
    }),
    yAxis: z.object({
      label: z.string(),
      low: z.string().describe("아래쪽 끝 레이블"),
      high: z.string().describe("위쪽 끝 레이블"),
    }),
    competitors: z.array(
      z.object({
        name: z.string(),
        x: z.number().describe("0~100"),
        y: z.number().describe("0~100"),
        note: z.string().describe("이 위치에 있는 이유 한 줄"),
      }),
    ).describe("실존하는 경쟁 브랜드 4~6개"),
    you: z.object({
      x: z.number().describe("0~100. 권장 포지션"),
      y: z.number().describe("0~100. 권장 포지션"),
      label: z.string(),
      note: z.string().describe("여기로 가야 하는 이유"),
    }),
    whitespace: z.object({
      x: z.number().describe("빈 공간 영역 좌하단 x, 0~100"),
      y: z.number().describe("빈 공간 영역 좌하단 y, 0~100"),
      w: z.number().describe("너비, 0~100"),
      h: z.number().describe("높이, 0~100"),
      label: z.string(),
      why: z.string().describe("왜 비어 있는지 — 기회인지 함정인지도 밝힐 것"),
    }),
  }),

  positioning: z.object({
    statement: z.string().describe("완성된 포지셔닝 문장 한 단락"),
    forWho: z.string(),
    need: z.string(),
    frame: z.string().describe("싸울 경쟁 프레임(카테고리)"),
    benefit: z.string(),
    unlike: z.string(),
    because: z.string().describe("근거(RTB)"),
    alternatives: z.array(
      z.object({
        angle: z.string().describe("이 대안 노선의 이름"),
        statement: z.string(),
        tradeoff: z.string().describe("이걸 택하면 포기하는 것"),
      }),
    ).describe("메인과 다른 방향의 대안 2개"),
  }),

  differentiators: z.array(
    z.object({
      claim: z.string(),
      evidence: z.string().describe("이 주장을 뒷받침할 근거 또는 '확보 필요'"),
      defensibility: z
        .string()
        .describe("경쟁사가 따라하기 어려운 정도. 높음 | 중간 | 낮음 중 하나"),
    }),
  ).describe("3~5개"),

  messaging: z.object({
    core: z.string().describe("핵심 메시지 한 줄"),
    pillars: z.array(
      z.object({
        title: z.string(),
        message: z.string(),
        proof: z.array(z.string()).describe("증거 2~3개"),
      }),
    ).describe("정확히 3개"),
  }),

  brand: z.object({
    archetype: z.string().describe("브랜드 아키타입 (예: 현자, 탐험가, 창조자)"),
    archetypeWhy: z.string(),
    toneWords: z.array(z.string()).describe("톤 형용사 4~6개"),
    voiceDo: z.array(z.string()).describe("이렇게 말한다 3~4개"),
    voiceDont: z.array(z.string()).describe("이렇게 말하지 않는다 3~4개"),
  }),

  taglines: z.array(
    z.object({
      line: z.string(),
      rationale: z.string(),
      tone: z.string().describe("이 카피의 톤 (예: 단정한, 도발적인)"),
    }),
  ).describe("서로 다른 결의 5개"),

  channels: z.array(
    z.object({
      channel: z.string(),
      why: z.string().describe("이 채널이 타겟과 맞는 이유"),
      firstMove: z.string().describe("당장 실행할 첫 액션 하나"),
      priority: z.string().describe("높음 | 중간 | 낮음 중 하나"),
    }),
  ).describe("4~5개"),

  risks: z.array(
    z.object({
      risk: z.string(),
      mitigation: z.string(),
    }),
  ).describe("3개"),

  quickWins: z.array(z.string()).describe("이번 주에 바로 할 수 있는 것 4~5개"),

  designBrief: z.string().describe(
    "이 포지셔닝을 시각화할 디자이너용 브리프 한 단락. 컬러 방향, 서체 성격, 사진 톤, 피해야 할 클리셰를 포함.",
  ),
});

export type Positioning = z.infer<typeof PositioningSchema>;
