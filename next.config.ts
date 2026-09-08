import type { NextConfig } from "next";

// 정적 빌드(GitHub Pages)와 서버 빌드(Vercel)를 같은 코드에서 갈라 쓴다.
const isStatic = process.env.NEXT_PUBLIC_STATIC === "1";

// 프로젝트 저장소(username.github.io/저장소이름)에 올릴 때는
// 저장소 이름을 basePath로 넣어야 CSS와 JS 경로가 맞는다.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

// API 라우트 파일은 route.server.ts 로 두고, 서버 빌드에서만
// "server.ts" 를 라우트 확장자로 인정한다.
// 정적 빌드에서는 그냥 같은 폴더에 놓인 파일로 취급돼 무시된다 —
// 빌드 중에 소스를 옮겼다가 되돌리는 것보다 안전하다.
// (output:"export" 는 POST 라우트 핸들러가 있으면 빌드에 실패한다.)
const pageExtensions = isStatic ? ["tsx", "ts"] : ["server.ts", "tsx", "ts"];

const nextConfig: NextConfig = {
  pageExtensions,
  serverExternalPackages: isStatic ? undefined : ["@anthropic-ai/sdk"],
  // 램이 빠듯한 노트북에서 빌드 워커가 죽으면 LOW_MEMORY=1 을 주고 빌드한다.
  // 워커를 하나로 줄여 느려지는 대신 메모리를 훨씬 덜 쓴다.
  experimental: {
    webpackMemoryOptimizations: true,
    ...(process.env.LOW_MEMORY === "1" ? { cpus: 1, workerThreads: false } : {}),
  },
  ...(isStatic
    ? {
        output: "export" as const,
        images: { unoptimized: true },
        trailingSlash: true,
        basePath: basePath || undefined,
        assetPrefix: basePath || undefined,
      }
    : {}),
};

export default nextConfig;
