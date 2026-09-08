"use client";

import { InputError, buildJob, type JobName } from "@/lib/engine";
import { runInBrowser } from "@/lib/browser-run";

export type StreamEvent =
  | { type: "progress"; stage: string; chars: number }
  | { type: "done"; data: unknown; usage?: { input: number; output: number; cacheRead: number } }
  | { type: "error"; message: string };

/** 정적 빌드(GitHub Pages)에는 서버가 없으므로 브라우저 호출만 가능하다. */
export const STATIC_BUILD = process.env.NEXT_PUBLIC_STATIC === "1";

export type CallMode = "server" | "browser";

const PASSWORD_KEY = "brandlab.password";
const APIKEY_KEY = "brandlab.apikey";
const MODE_KEY = "brandlab.mode";

function read(key: string): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* 시크릿 모드 등에서 저장이 막혀도 이번 세션은 동작해야 한다 */
  }
}

export const getStoredPassword = () => read(PASSWORD_KEY);
export const setStoredPassword = (v: string) => write(PASSWORD_KEY, v);
export const getStoredApiKey = () => read(APIKEY_KEY);
export const setStoredApiKey = (v: string) => write(APIKEY_KEY, v);

export function getCallMode(): CallMode {
  if (STATIC_BUILD) return "browser";
  return read(MODE_KEY) === "browser" ? "browser" : "server";
}

export function setCallMode(mode: CallMode) {
  write(MODE_KEY, mode);
}

/**
 * 한 번의 분석을 실행한다.
 * 서버 모드면 /api로 SSE를 받고, 브라우저 모드면 Anthropic을 직접 호출한다.
 * 어느 쪽이든 같은 이벤트 모양으로 돌려주므로 화면 코드는 모드를 몰라도 된다.
 */
export async function runJob(
  job: JobName,
  payload: { product?: unknown; design?: unknown; images: string[] },
  onEvent: (e: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (getCallMode() === "browser") {
    let built;
    try {
      built = buildJob(job, payload as never);
    } catch (err) {
      onEvent({
        type: "error",
        message: err instanceof InputError ? err.message : "잘못된 입력입니다.",
      });
      return;
    }

    const result = await runInBrowser(
      built,
      getStoredApiKey(),
      (stage, chars) => onEvent({ type: "progress", stage, chars }),
      signal,
    );

    if (result.ok) onEvent({ type: "done", data: result.data });
    else if (result.message) onEvent({ type: "error", message: result.message });
    return;
  }

  await streamFromServer("/api/" + job, payload, onEvent, signal);
}

/** SSE 응답을 읽어 이벤트 단위로 넘겨준다. EventSource는 POST를 못 보내서 fetch를 쓴다. */
async function streamFromServer(
  url: string,
  body: unknown,
  onEvent: (e: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-app-password": getStoredPassword() },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok || !res.body) {
    let message = "요청이 실패했습니다 (" + res.status + ")";
    try {
      const json = await res.json();
      if (json?.error) message = json.error;
    } catch {
      /* 본문이 JSON이 아니면 기본 메시지를 쓴다 */
    }
    onEvent({ type: "error", message });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const chunk = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const line = chunk.split("\n").find((l) => l.startsWith("data: "));
      if (line) {
        try {
          onEvent(JSON.parse(line.slice(6)) as StreamEvent);
        } catch {
          /* 깨진 프레임은 버린다 */
        }
      }
      boundary = buffer.indexOf("\n\n");
    }
  }
}

const MAX_EDGE = 1568; // Claude 비전이 내부적으로 리사이즈하는 상한. 그 이상은 낭비.

/**
 * 업로드 전에 브라우저에서 축소한다.
 * 원본을 그대로 보내면 요청 본문 제한(4.5MB)에 걸리고, 토큰도 더 든다.
 */
export function downscaleImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("이미지를 처리할 수 없습니다."));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(file.name + " 파일을 읽을 수 없습니다."));
    };
    img.src = url;
  });
}

export function downloadJson(filename: string, data: unknown) {
  triggerDownload(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" }),
    filename,
  );
}

export function downloadText(filename: string, text: string) {
  triggerDownload(new Blob([text], { type: "text/markdown;charset=utf-8" }), filename);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** #RRGGBB로 정규화. 모델이 이상한 값을 주면 폴백을 쓴다. */
export function safeHex(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const v = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v;
  if (/^#[0-9a-fA-F]{3}$/.test(v)) return "#" + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
  if (/^[0-9a-fA-F]{6}$/.test(v)) return "#" + v;
  return fallback;
}

export function clamp(n: number, lo = 0, hi = 100): number {
  if (!Number.isFinite(n)) return (lo + hi) / 2;
  return Math.min(hi, Math.max(lo, n));
}
