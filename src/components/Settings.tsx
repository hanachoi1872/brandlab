"use client";

import { useCallback, useEffect, useState } from "react";
import {
  STATIC_BUILD,
  getCallMode,
  getStoredApiKey,
  getStoredModel,
  getStoredPassword,
  setCallMode,
  setStoredApiKey,
  setStoredModel,
  setStoredPassword,
  type CallMode,
} from "@/lib/client";
import { FALLBACK_MODELS, listModels } from "@/lib/gemini";
import { Button, Field, Input } from "@/components/ui";

export function Settings({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [mode, setMode] = useState<CallMode>("server");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [password, setPassword] = useState("");
  const [models, setModels] = useState<string[]>(FALLBACK_MODELS);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelNote, setModelNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setMode(getCallMode());
    setApiKey(getStoredApiKey());
    setModel(getStoredModel());
    setPassword(getStoredPassword());
    setModelNote("");
  }, [open]);

  // 모델 ID는 자주 바뀐다. 하드코딩에 의존하지 않고 사용자의 키로 실제 목록을 불러온다.
  const refreshModels = useCallback(async () => {
    if (!apiKey.trim()) {
      setModelNote("먼저 API 키를 입력해주세요.");
      return;
    }
    setLoadingModels(true);
    setModelNote("");
    const list = await listModels(apiKey.trim());
    setLoadingModels(false);
    if (list.length === 0) {
      setModelNote("목록을 불러오지 못했습니다. 키가 맞는지 확인해주세요.");
      return;
    }
    setModels(list);
    setModelNote(list.length + "개 모델을 불러왔습니다.");
    if (!list.includes(model)) setModel(list[0]);
  }, [apiKey, model]);

  if (!open) return null;

  const save = () => {
    setCallMode(mode);
    setStoredApiKey(apiKey);
    setStoredModel(model);
    setStoredPassword(password);
    onSaved();
    onClose();
  };

  const needsKey = mode === "browser" || STATIC_BUILD;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/35 p-4 py-10"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-line bg-surface-1 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-[15px] font-semibold tracking-tight">설정</h2>
          <Button variant="quiet" onClick={onClose}>
            닫기
          </Button>
        </header>

        <div className="space-y-5 px-5 py-5">
          {!STATIC_BUILD && (
            <div>
              <span className="mb-1.5 block text-[13px] font-medium">API 호출 방식</span>
              <div className="space-y-2">
                <ModeOption
                  checked={mode === "server"}
                  onSelect={() => setMode("server")}
                  title="서버가 대신 호출 (기본)"
                  body="서버에 저장된 키를 씁니다. 이 링크를 받은 사람은 키 없이 바로 쓸 수 있습니다."
                />
                <ModeOption
                  checked={mode === "browser"}
                  onSelect={() => setMode("browser")}
                  title="내 API 키로 직접 호출"
                  body="이 브라우저에 저장한 키로 Gemini에 직접 요청합니다. 서버가 없어도 동작합니다."
                />
              </div>
            </div>
          )}

          {needsKey && (
            <>
              <div>
                <Field label="Gemini API 키" required>
                  <Input
                    type="password"
                    value={apiKey}
                    placeholder="AIza..."
                    autoComplete="off"
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </Field>
                <p className="mt-2 text-[12px] leading-relaxed text-ink-3">
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:text-ink"
                  >
                    Google AI Studio에서 무료로 발급 ↗
                  </a>{" "}
                  — 신용카드 등록이 필요 없습니다. 키는 <b>이 브라우저에만</b> 저장되고 Google
                  외에는 어디로도 전송되지 않습니다. 공용 컴퓨터에서는 사용 후 지워주세요.
                </p>
                {apiKey && (
                  <Button
                    variant="quiet"
                    className="mt-2 px-0"
                    onClick={() => {
                      setApiKey("");
                      setStoredApiKey("");
                    }}
                  >
                    저장된 키 지우기
                  </Button>
                )}
              </div>

              <div>
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <span className="text-[13px] font-medium">모델</span>
                  <Button variant="quiet" onClick={refreshModels} disabled={loadingModels}>
                    {loadingModels ? "불러오는 중…" : "내 키로 목록 불러오기"}
                  </Button>
                </div>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full rounded-lg border border-line bg-surface-0 px-3 py-2 text-[14px] outline-none focus:border-series-1 focus:ring-2 focus:ring-series-1/20"
                >
                  {[...new Set([model, ...models])].filter(Boolean).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-[12px] leading-relaxed text-ink-3">
                  {modelNote || "flash 계열이 무료 한도가 넉넉합니다. 한도 초과(429)가 뜨면 더 가벼운 모델로 바꿔보세요."}
                </p>
              </div>
            </>
          )}

          {!STATIC_BUILD && mode === "server" && (
            <Field label="접속 비밀번호" hint="서버에 APP_PASSWORD를 설정한 경우에만">
              <Input
                type="password"
                value={password}
                placeholder="비워두면 사용 안 함"
                autoComplete="off"
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-line px-5 py-4">
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button onClick={save}>저장</Button>
        </footer>
      </div>
    </div>
  );
}

function ModeOption({
  checked,
  onSelect,
  title,
  body,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  body: string;
}) {
  return (
    <button
      onClick={onSelect}
      className={
        "block w-full rounded-lg border px-3.5 py-3 text-left transition " +
        (checked ? "border-series-1 bg-series-1/5" : "border-line hover:bg-surface-2")
      }
    >
      <span className="flex items-center gap-2 text-[13px] font-medium">
        <span
          className={
            "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border " +
            (checked ? "border-series-1" : "border-line-strong")
          }
        >
          {checked && <span className="h-1.5 w-1.5 rounded-full bg-series-1" />}
        </span>
        {title}
      </span>
      <span className="mt-1 block pl-5.5 text-[12px] leading-relaxed text-ink-3">{body}</span>
    </button>
  );
}
