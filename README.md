# BrandLab

제품을 넣으면 **포지셔닝 전략**을, 레퍼런스를 넣으면 **브랜드 디자인 키트와 시안**을 만들어주는 웹앱.

**두 가지 방식으로 배포됩니다:**

| | GitHub Pages | Vercel |
|---|---|---|
| 서버 | 없음 (정적) | 있음 |
| API 키 | **쓰는 사람이 각자 입력** | 서버에 숨겨짐 |
| 링크 공유 | 받는 사람도 자기 키 필요 | 키 없이 바로 사용 |
| 비용 부담 | 각자 자기 키로 | 회원님 키로 전부 |
| 적합한 경우 | 나 혼자 쓸 때 | 클라이언트·동료에게 줄 때 |

같은 코드에서 둘 다 빌드됩니다. 먼저 GitHub Pages로 쓰다가 나중에 Vercel로 옮겨도 코드는 그대로입니다.

---

## 무엇을 해주나

### 1번 탭 — 포지셔닝

제품 정보(제품명·설명만 있어도 시작 가능)와 제품 사진을 넣으면:

- **제품 진단** — 지금 이대로면 시장에서 어떻게 읽히는지, 핵심 과제는 무엇인지
- **타겟 세그먼트 3개** — 프로필, 해결하려는 일, 구매 방아쇠, **안 사는 이유**까지
- **포지셔닝 맵** — 소비자가 실제로 저울질하는 두 축 위에 경쟁사와 우리 위치를 찍고, 빈 공간이 기회인지 함정인지 판단 (마우스를 올리면 각 브랜드 설명, 표로도 볼 수 있음)
- **포지셔닝 문장** — 사내 문서에 그대로 붙여넣는 형태 + **방향이 다른 대안 노선 2개와 각각의 트레이드오프**
- **차별점** — 근거와 방어력(따라하기 어려운 정도) 등급까지
- **메시지 하우스**, **브랜드 톤**(아키타입 / 이렇게 말한다·말하지 않는다)
- **태그라인 5개** (서로 다른 결로), **채널 전략**(첫 액션 포함), **리스크**, **이번 주 실행 항목**
- **디자인 브리프** — 2번 탭으로 자동 전달

### 2번 탭 — 디자인

레퍼런스 이미지(최대 4장) 또는 무드 설명을 넣으면:

- **레퍼런스 해부** — "미니멀하다"가 아니라 *무엇이* 그 인상을 만드는지 구체적 관찰로. 레퍼런스가 포지셔닝과 어긋나면 어디가 어긋나는지도 지적
- **컬러 팔레트** — 역할별 색 + 이름 + 근거. **WCAG 대비를 실제로 계산해서 통과/미달 표시** (클릭하면 hex 복사)
- **타이포그래피** — 실제 Google Fonts에서 골라 화면에 바로 로드. 한글 카피가 들어가는 자리는 한글 지원 서체만
- **시안 5종** — 로고 락업 / SNS 카드 1:1 / 포스터 A비율 / 패키지 라벨 / 웹사이트 히어로. **전부 실제로 렌더링되고 PNG로 저장됩니다**
- **아트 디렉션** — 사진·그래픽 장치·레이아웃·질감, 지킬 것 / 하지 말 것

포지셔닝 결과가 있으면 자동으로 컨텍스트가 넘어가서, 디자인이 전략과 어긋나지 않게 만듭니다.

결과는 **마크다운**(노션·구글독스 붙여넣기용)과 **JSON**으로 내보낼 수 있고, 브라우저에 자동 저장되어 새로고침해도 남습니다.

API 키 없이도 각 탭의 **"샘플 결과 둘러보기"** 버튼으로 결과물의 형태를 미리 볼 수 있습니다.

---

## 방법 A — GitHub Pages (내 사이트에 올리기)

서버가 없으므로 **쓰는 사람이 각자 자기 API 키를 입력**합니다.
키는 그 사람 브라우저에만 저장되고 Anthropic 외에는 어디로도 가지 않습니다.

### 1. 정적 빌드

저장소 종류에 따라 명령이 다릅니다.

**`아이디.github.io` 저장소** (사이트 주소가 `https://아이디.github.io`):

```bash
npm install
npm run build:static
```

**일반 저장소** (사이트 주소가 `https://아이디.github.io/brandlab`):

```bash
npm install
npm run build:static -- brandlab
```

> 저장소 이름을 반드시 넘겨야 합니다. 안 넘기면 CSS와 JS 경로가 어긋나서 화면이 깨집니다.
> `brandlab` 자리에 실제 저장소 이름을 넣으세요. 앞에 `/`를 붙여도 되지만,
> Windows Git Bash에서는 경로가 잘못 변환될 수 있어 슬래시 없이 쓰는 편이 안전합니다.

`out/` 폴더가 만들어집니다.

> **빌드가 도중에 죽는다면** 메모리 부족입니다. 크롬 탭 등을 좀 닫고 다시 시도하거나,
> 워커를 하나로 줄여서 돌리세요 (느리지만 메모리를 훨씬 덜 씁니다):
>
> ```bash
> LOW_MEMORY=1 npm run build:static -- brandlab
> ```
>
> Windows PowerShell에서는 `$env:LOW_MEMORY=1; npm run build:static -- brandlab`

### 2. GitHub에 올리기

가장 간단한 방법은 `out/` 안의 내용을 GitHub Pages용 저장소(또는 브랜치)에 그대로 올리는 것입니다.

```bash
cd out
git init
git add .
git commit -m "BrandLab 배포"
git branch -M main
git remote add origin https://github.com/<아이디>/<저장소>.git
git push -f origin main
```

그리고 GitHub 저장소 → **Settings → Pages** 에서 Source를 `main` 브랜치 `/ (root)` 로 지정합니다.

### 3. 사용

사이트에 접속하면 API 키를 입력하라는 안내가 뜹니다.
[console.anthropic.com](https://console.anthropic.com/settings/keys) 에서 키를 발급받아 **설정**에 넣으면 됩니다. 한 번 넣으면 그 브라우저에 저장됩니다.

---

## 방법 B — Vercel (링크만 주면 되는 방식)

키가 서버에 숨겨져서, 링크를 받은 사람은 키 없이 바로 씁니다. 비용은 회원님 키로 나갑니다.

### 1. API 키 발급

[console.anthropic.com](https://console.anthropic.com/settings/keys) 에서 키를 만들고 결제 수단을 등록합니다.
(Claude 구독과는 별개입니다. API는 쓴 만큼 과금됩니다.)

### 2. GitHub에 올리기

```bash
git init
git add .
git commit -m "BrandLab 초기 버전"
gh repo create brandlab --private --source=. --push
```

`gh`가 없으면 GitHub에서 빈 저장소를 만든 뒤 `git remote add origin <주소>` → `git push -u origin main`.

### 3. Vercel 연결

1. [vercel.com/new](https://vercel.com/new) 에서 방금 만든 저장소를 선택
2. **Environment Variables** 에 추가:

   | Name | Value |
   |---|---|
   | `ANTHROPIC_API_KEY` | 1번에서 발급한 키 |
   | `APP_PASSWORD` | (선택) 접속 비밀번호 |

3. Deploy

> **`APP_PASSWORD`를 꼭 설정하는 걸 권합니다.** 없으면 링크를 아는 사람이 회원님의 API 크레딧을 쓸 수 있습니다.
> 처음 요청할 때 입력창이 뜨고, 한 번 입력하면 브라우저에 저장됩니다.

환경변수를 나중에 바꿨다면 Vercel 대시보드 → Settings → Environment Variables 에서 수정한 뒤 **Redeploy** 해야 반영됩니다.

Vercel에 올렸어도 **설정 → "내 API 키로 직접 호출"** 을 켜면 개인 키로 쓸 수 있습니다.

---

## 로컬에서 돌리기

```bash
npm install
cp .env.example .env.local   # .env.local 을 열어 ANTHROPIC_API_KEY 채우기
npm run dev
```

→ http://localhost:3000

키를 `.env.local`에 넣지 않아도, 설정에서 "내 API 키로 직접 호출"을 켜고 키를 넣으면 동작합니다.

---

## 비용

Claude Opus 5 기준 (입력 $5 / 출력 $25 per 1M 토큰):

| 작업 | 대략 |
|---|---|
| 포지셔닝 분석 1회 | 약 $0.2 ~ $0.4 |
| 디자인 생성 1회 (이미지 4장 포함) | 약 $0.15 ~ $0.3 |

한 제품을 처음부터 끝까지 돌리면 대략 **500~1,000원** 수준입니다.
정확한 사용량은 [console.anthropic.com/usage](https://console.anthropic.com/usage) 에서 확인하세요.

---

## 구조

```
src/
├─ app/
│  ├─ page.tsx              메인 화면 (탭·폼·상태 관리)
│  ├─ layout.tsx            폰트·메타
│  ├─ globals.css           디자인 토큰 (라이트/다크)
│  └─ api/                  서버 모드 전용. 정적 빌드 때는 잠시 치워둔다
│     ├─ position/route.ts
│     └─ design/route.ts
├─ lib/
│  ├─ engine.ts             ★ 프롬프트·스키마 조립 (서버/브라우저 공용)
│  ├─ server-run.ts         서버 모드 — SSE 스트리밍
│  ├─ browser-run.ts        브라우저 모드 — Anthropic 직접 호출
│  ├─ client.ts             모드 분기·이미지 축소·다운로드
│  ├─ prompts.ts            시스템 프롬프트 (컨설턴트 인격)
│  ├─ schema/               Zod 스키마 = 출력 형식
│  ├─ fonts.ts              Google Fonts 화이트리스트 + 보정
│  ├─ contrast.ts           WCAG 대비 계산
│  ├─ export.ts             마크다운 내보내기
│  └─ sample.ts             샘플 데이터
└─ components/
   ├─ PositioningReport.tsx / PositioningMap.tsx
   ├─ BrandKitView.tsx
   ├─ Settings.tsx          API 키·호출 방식 설정
   ├─ ImageUploader.tsx / ui.tsx
   └─ mockups/              시안 5종 + 캡처 프레임
```

### 설계상 알아둘 점

- **프롬프트와 스키마는 `engine.ts` 한 곳에만 있습니다.** 서버 모드와 브라우저 모드가 같은 함수를 쓰므로, 어느 쪽으로 배포하든 결과가 갈라지지 않습니다.
- **구조화 출력의 `enum`은 강제되지 않습니다.** Anthropic SDK가 지원하지 않는 JSON Schema 키워드를 설명 힌트로 바꿔 넘기기 때문입니다. 그래서 서체·등급 같은 필드는 스키마에서 관대하게 받고, 화면에서 화이트리스트로 보정합니다 — 서체 이름 하나 어긋났다고 비싼 분석 결과 전체를 버리지 않기 위해서입니다.
- **응답을 스트리밍합니다.** 긴 분석에도 연결이 끊기지 않고, 진행 단계를 실제로 보여줄 수 있습니다.
- **이미지는 업로드 전에 브라우저에서 축소합니다** (최대 1568px). 요청 크기 제한을 넘지 않고 토큰도 아낍니다.
- **시안은 고정 픽셀로 그린 뒤 화면에서만 축소해 보여줍니다.** 화면 폭에 따라 레이아웃이 깨지지 않고, PNG 해상도가 항상 일정합니다.

---

## 결과를 그대로 믿지 마세요

포지셔닝 리포트의 **경쟁사 위치와 시장 판단은 전략 초안**입니다. 특히:

- 경쟁사 좌표는 모델의 추정이지 조사 데이터가 아닙니다
- 차별점에 "확보 필요"라고 적힌 항목은 실제로 측정해서 채워야 합니다
- 팔레트 대비 검사에서 **미달**이 뜨면 그 색은 실제 인쇄·화면에서 안 읽힙니다. 다시 생성하거나 직접 조정하세요
