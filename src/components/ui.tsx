"use client";

import { useState } from "react";

export function Card({
  title,
  hint,
  children,
  actions,
}: {
  title?: string;
  hint?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section className="bl-in rounded-xl border border-line bg-surface-1">
      {(title || actions) && (
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            {title && <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>}
            {hint && <p className="mt-1 text-[13px] leading-relaxed text-ink-3">{hint}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline gap-1.5 text-[13px] font-medium">
        {label}
        {required && <span className="text-brand-accent">*</span>}
        {hint && <span className="font-normal text-ink-3">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-line bg-surface-0 px-3 py-2 text-[14px] leading-relaxed outline-none transition placeholder:text-ink-3 focus:border-series-1 focus:ring-2 focus:ring-series-1/20";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputClass} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} resize-y`} />;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "quiet" }) {
  const styles = {
    primary:
      "bg-ink text-surface-1 hover:opacity-88 disabled:opacity-35 disabled:cursor-not-allowed",
    ghost:
      "border border-line bg-surface-1 hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed",
    quiet: "text-ink-2 hover:text-ink hover:bg-surface-2 disabled:opacity-40",
  }[variant];
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-medium transition ${styles} ${className}`}
    />
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "strong" | "accent" | "good";
}) {
  const styles = {
    neutral: "border-line text-ink-3",
    strong: "border-line-strong text-ink-2",
    accent: "border-brand-accent/45 text-brand-accent",
    good: "border-good/45 text-good",
  }[tone];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-tight ${styles}`}
    >
      {children}
    </span>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
      {children}
    </h3>
  );
}

export function CopyButton({ text, label = "복사" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      variant="quiet"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        } catch {
          /* 클립보드 권한이 없으면 조용히 넘어간다 */
        }
      }}
    >
      {done ? "복사됨" : label}
    </Button>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-10 text-center text-[13px] text-ink-3">{children}</p>;
}
