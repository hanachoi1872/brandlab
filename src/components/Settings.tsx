"use client";

import { useEffect, useState } from "react";
import {
  STATIC_BUILD,
  getCallMode,
  getStoredApiKey,
  getStoredPassword,
  setCallMode,
  setStoredApiKey,
  setStoredPassword,
  type CallMode,
} from "@/lib/client";
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
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!open) return;
    setMode(getCallMode());
    setApiKey(getStoredApiKey());
    setPassword(getStoredPassword());
  }, [open]);

  if (!open) return null;

  const save = () => {
    setCallMode(mode);
    setStoredApiKey(apiKey);
    setStoredPassword(password);
    onSaved();
    onClose();
  };

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
                  body="이 브라우저에 저장한 키로 Anthropic에 직접 요청합니다. 서버가 없어도 동작합니다."
                />
              </div>
            </div>
          )}

          {(mode === "browser" || STATIC_BUILD) && (
            <div>
              <Field label="Anthropic API 키" required>
                <Input
                  type="password"
                  value={apiKey}
                  placeholder="sk-ant-..."
                  autoComplete="off"
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </Field>
              <p className="mt-2 text-[12px] leading-relaxed text-ink-3">
                키는 <b>이 브라우저에만</b> 저장되고 Anthropic 외에는 어디로도 전송되지 않습니다.
                공용 컴퓨터에서는 사용 후 지워주세요.{" "}
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:text-ink"
                >
                  키 발급받기 ↗
                </a>
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
