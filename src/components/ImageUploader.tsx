"use client";

import { useCallback, useRef, useState } from "react";
import { downscaleImage } from "@/lib/client";

export function ImageUploader({
  images,
  onChange,
  max = 4,
  hint,
}: {
  images: string[];
  onChange: (next: string[]) => void;
  max?: number;
  hint: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const picked = Array.from(files)
        .filter((f) => f.type.startsWith("image/"))
        .slice(0, max - images.length);
      if (picked.length === 0) return;

      setBusy(true);
      setError("");
      try {
        const next = await Promise.all(picked.map(downscaleImage));
        onChange([...images, ...next].slice(0, max));
      } catch (e) {
        setError(e instanceof Error ? e.message : "이미지를 불러오지 못했습니다.");
      } finally {
        setBusy(false);
      }
    },
    [images, max, onChange],
  );

  const full = images.length >= max;

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void addFiles(e.dataTransfer.files);
        }}
        onClick={() => !full && inputRef.current?.click()}
        className={
          "cursor-pointer rounded-lg border border-dashed px-4 py-6 text-center transition " +
          (dragging ? "border-series-1 bg-series-1/5" : "border-line-strong bg-surface-0") +
          (full ? " cursor-not-allowed opacity-55" : " hover:border-series-1")
        }
      >
        <p className="text-[13px] font-medium">
          {busy ? "이미지 처리 중…" : full ? `최대 ${max}장까지 올릴 수 있습니다` : "이미지를 끌어다 놓거나 클릭해서 선택"}
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-ink-3">{hint}</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="mt-2 text-[12px] text-brand-accent">{error}</p>}

      {images.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {images.map((src, i) => (
            <li key={i} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={"레퍼런스 " + (i + 1)}
                className="h-20 w-20 rounded-md border border-line object-cover"
              />
              <button
                onClick={() => onChange(images.filter((_, j) => j !== i))}
                aria-label={"레퍼런스 " + (i + 1) + " 삭제"}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-line bg-surface-1 text-[13px] leading-none text-ink-2 opacity-0 transition group-hover:opacity-100 hover:text-ink"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
