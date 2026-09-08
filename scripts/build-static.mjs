// GitHub Pages 등 정적 호스팅용 빌드.
//
// API 라우트는 route.server.ts 라는 이름이라, NEXT_PUBLIC_STATIC=1 일 때
// next.config.ts 가 "server.ts" 를 라우트 확장자에서 빼면서 자동으로 무시된다.
// 그래서 이 스크립트는 소스를 전혀 건드리지 않는다.

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";

/**
 * basePath를 정규화한다.
 * "brandlab", "/brandlab" 둘 다 받고, Windows Git Bash가 "/brandlab"을
 * "C:/Program Files/Git/brandlab"으로 바꿔버리는 경우도 되돌린다(MSYS 경로 변환).
 */
function normalizeBasePath(raw) {
  let v = (raw ?? "").trim();
  if (!v) return "";
  if (/^[A-Za-z]:[\\/]/.test(v)) {
    v = v.split(/[\\/]/).filter(Boolean).pop() ?? "";
  }
  v = v.replace(/^\/+/, "").replace(/\/+$/, "");
  return v ? "/" + v : "";
}

const root = process.cwd();
const basePath = normalizeBasePath(process.argv[2] ?? process.env.NEXT_PUBLIC_BASE_PATH);

console.log(
  "\n정적 빌드를 시작합니다" +
    (basePath ? ` (basePath: ${basePath})` : " (basePath 없음 — 아이디.github.io 저장소용)") +
    "...\n",
);

execSync("npx next build", {
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_PUBLIC_STATIC: "1",
    NEXT_PUBLIC_BASE_PATH: basePath,
    // 메모리가 빠듯한 노트북에서 빌드 워커가 죽는 걸 막는다.
    // 이미 설정돼 있으면 사용자의 값을 존중한다.
    NODE_OPTIONS: process.env.NODE_OPTIONS || "--max-old-space-size=2048",
  },
});

// Jekyll이 _next 폴더를 무시하지 않게 한다. 없으면 GitHub Pages에서 CSS/JS가 404가 난다.
writeFileSync(path.join(root, "out", ".nojekyll"), "");

console.log("\n완료. out/ 폴더를 GitHub Pages에 올리면 됩니다.\n");
