"use client";

import { type CSSProperties, type PointerEvent, type ReactNode, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type DragState = {
  active: boolean;
  pointerId: number | null;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
};

type DraggablePreviewScrollProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  style?: CSSProperties;
  contentStyle?: CSSProperties;
};

function isInteractiveElement(target: EventTarget | null) {
  return target instanceof Element && Boolean(
    target.closest("a,button,input,select,textarea,[role='button'],[data-no-drag]")
  );
}

export function DraggablePreviewScroll({
  children,
  className,
  contentClassName,
  style,
  contentStyle,
}: DraggablePreviewScrollProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<DragState>({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  });

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    if (isInteractiveElement(event.target)) return;

    const el = event.currentTarget;
    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
    el.setPointerCapture(event.pointerId);
    setIsDragging(true);
    event.preventDefault();
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;

    setOffset({
      x: drag.offsetX + event.clientX - drag.startX,
      y: drag.offsetY + event.clientY - drag.startY,
    });
    event.preventDefault();
  }

  function finishDrag(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (drag.pointerId === event.pointerId) {
      dragRef.current.active = false;
      dragRef.current.pointerId = null;
      setIsDragging(false);
    }
  }

  return (
    <div
      className={cn(
        "overflow-x-hidden overflow-y-auto select-none [scrollbar-gutter:stable]",
        isDragging ? "cursor-grabbing" : "cursor-grab",
        className
      )}
      style={{ touchAction: "none", ...style }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
    >
      <div
        className={contentClassName}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}
