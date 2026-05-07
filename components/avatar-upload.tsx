"use client";

import React, { useRef, useState, useCallback } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AvatarStyle } from "@/lib/resume-schema";

interface AvatarUploadProps {
  readonly value: string;
  readonly onChange: (url: string) => void;
  readonly avatarStyle: AvatarStyle;
  readonly onStyleChange: (style: AvatarStyle) => void;
}

const MAX_SIZE = 2 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PREVIEW_SIZE = 120;

export default function AvatarUpload({ value, onChange, avatarStyle, onStyleChange }: AvatarUploadProps) {
  const t = useTranslations("editor");
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const dragRef = useRef({ active: false, startX: 0, startY: 0, startOX: 0, startOY: 0 });

  const { shape = "circle", scale = 1, offsetX = 0, offsetY = 0 } = avatarStyle || {};

  let borderRadius: number | string = "50%";
  if (shape === "square") borderRadius = 0;
  else if (shape === "rounded") borderRadius = 12;
  const imgSize = PREVIEW_SIZE * scale;
  const tx = offsetX * PREVIEW_SIZE / 100;
  const ty = offsetY * PREVIEW_SIZE / 100;
  const canDrag = !!value && scale > 1;

  const uploadFile = useCallback(async (file: File) => {
    setError("");

    if (!ACCEPTED_TYPES.has(file.type)) {
      setError(t("fields.avatarInvalidType"));
      return;
    }
    if (file.size > MAX_SIZE) {
      setError(t("fields.avatarTooLarge"));
      return;
    }

    setUploading(true);
    try {
      if (value) {
        await fetch("/api/uploads/avatars", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: value }),
        });
      }

      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads/avatars", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      onChange(data.url);
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }, [value, onChange, t]);

  const handleRemove = useCallback(async () => {
    if (!value) return;
    try {
      await fetch("/api/uploads/avatars", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      });
    } catch { /* ignore */ }
    onChange("");
    onStyleChange({ shape: "circle", scale: 1, offsetX: 0, offsetY: 0 });
  }, [value, onChange, onStyleChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (!value || scale <= 1) return;
    e.preventDefault();
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startOX: offsetX,
      startOY: offsetY,
    };
    const handleMove = (ev: MouseEvent) => {
      if (!dragRef.current.active) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      onStyleChange({
        ...avatarStyle,
        offsetX: Math.max(-50, Math.min(50, dragRef.current.startOX + dx)),
        offsetY: Math.max(-50, Math.min(50, dragRef.current.startOY + dy)),
      });
    };
    const handleUp = () => {
      dragRef.current.active = false;
      globalThis.removeEventListener("mousemove", handleMove);
      globalThis.removeEventListener("mouseup", handleUp);
    };
    globalThis.addEventListener("mousemove", handleMove);
    globalThis.addEventListener("mouseup", handleUp);
  }, [value, scale, offsetX, offsetY, avatarStyle, onStyleChange]);

  const shapes: { key: "circle" | "square" | "rounded"; label: string; style: React.CSSProperties }[] = [
    { key: "circle", label: t("fields.avatarShapeCircle"), style: { borderRadius: "50%" } },
    { key: "square", label: t("fields.avatarShapeSquare"), style: { borderRadius: 2 } },
    { key: "rounded", label: t("fields.avatarShapeRounded"), style: { borderRadius: 6 } },
  ];

  let cursorStyle = "pointer";
  if (canDrag && dragRef.current.active) cursorStyle = "grabbing";
  else if (canDrag) cursorStyle = "grab";

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Preview */}
      <div
        className={`relative group ${dragOver ? "ring-2 ring-blue-400" : ""}`}
        style={{
          width: PREVIEW_SIZE, height: PREVIEW_SIZE,
          borderRadius,
          overflow: "hidden",
          position: "relative",
          cursor: cursorStyle,
          border: "1px solid var(--border)",
        }}
        onClick={() => !uploading && !dragRef.current.active && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onMouseDown={handleDragStart}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="avatar"
            style={{
              width: imgSize, height: imgSize,
              objectFit: "cover", position: "absolute",
              top: "50%", left: "50%",
              transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`,
              pointerEvents: "none",
            }}
          />
        ) : (
          <div className={`w-full h-full border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors ${
            dragOver
              ? "border-blue-400 bg-blue-50 dark:bg-blue-950"
              : "border-[var(--border)] hover:border-[var(--foreground)]"
          }`} style={{ borderRadius }}>
            <Camera className="w-6 h-6 text-[var(--muted-foreground)]" />
            <span className="text-xs text-[var(--muted-foreground)]">Upload</span>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center" style={{ borderRadius }}>
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}

        {value && !uploading && (
          <button
            type="button"
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={(e) => { e.stopPropagation(); handleRemove(); }}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Controls - only shown when avatar is present */}
      {value && (
        <div className="flex flex-col items-center gap-3 w-full max-w-[200px]">
          {/* Shape selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted-foreground)]">{t("fields.avatarShape")}</span>
            <div className="flex gap-1">
              {shapes.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  className={`w-7 h-7 border-2 transition-colors ${
                    shape === s.key
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                      : "border-[var(--border)] hover:border-[var(--foreground)]"
                  }`}
                  style={s.style}
                  title={s.label}
                  onClick={() => onStyleChange({ ...avatarStyle, shape: s.key })}
                />
              ))}
            </div>
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap">{t("fields.avatarZoom")}</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={scale}
              onChange={(e) => onStyleChange({ ...avatarStyle, scale: parseFloat(e.target.value) })}
              className="flex-1 h-1 accent-blue-500 cursor-pointer"
            />
            <span className="text-xs text-[var(--muted-foreground)] w-8 text-right">{scale.toFixed(1)}x</span>
          </div>

          {/* Position hint */}
          {scale > 1 && (
            <span className="text-[10px] text-[var(--muted-foreground)]">{t("fields.avatarPosition")}</span>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
