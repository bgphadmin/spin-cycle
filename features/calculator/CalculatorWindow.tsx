"use client";

import { PointerEvent, useRef, useState } from "react";
import { X } from "lucide-react";
import Calculator from "./Calculator";

type Position = {
  left: number;
  top: number;
};

type DragState = {
  pointerId: number;
  pointerX: number;
  pointerY: number;
  left: number;
  top: number;
  width: number;
  height: number;
};

export default function CalculatorWindow({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const windowRef = useRef<HTMLElement>(null);
  const dragState = useRef<DragState | null>(null);
  const [position, setPosition] = useState<Position | null>(null);

  function startDragging(event: PointerEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("button")) return;

    const rect = windowRef.current?.getBoundingClientRect();
    if (!rect) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = {
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
    setPosition({ left: rect.left, top: rect.top });
  }

  function drag(event: PointerEvent<HTMLElement>) {
    const currentDrag = dragState.current;
    if (!currentDrag || currentDrag.pointerId !== event.pointerId) return;

    const left = currentDrag.left + event.clientX - currentDrag.pointerX;
    const top = currentDrag.top + event.clientY - currentDrag.pointerY;
    setPosition({
      left: Math.max(0, Math.min(left, window.innerWidth - currentDrag.width)),
      top: Math.max(0, Math.min(top, window.innerHeight - currentDrag.height)),
    });
  }

  function stopDragging(event: PointerEvent<HTMLElement>) {
    if (dragState.current?.pointerId === event.pointerId) {
      dragState.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
  }

  if (!open) return null;

  return (
    <section
      ref={windowRef}
      aria-label="Calculator window"
      className={`fixed z-40 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-xl border border-teal-200 bg-white shadow-2xl ${
        position ? "" : "right-4 top-20"
      }`}
      style={position ? { left: position.left, top: position.top } : undefined}
    >
      <header
        onPointerDown={startDragging}
        onPointerMove={drag}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        className="flex touch-none cursor-grab items-center justify-between gap-3 border-b border-teal-100 bg-teal-50 px-4 py-3 active:cursor-grabbing"
      >
        <h2 className="font-semibold text-teal-800">Calculator</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close calculator"
          className="rounded-md p-1 text-gray-500 hover:bg-white hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
        >
          <X className="h-5 w-5" />
        </button>
      </header>
      <div className="max-h-[calc(100dvh-7rem)] overflow-y-auto p-3">
        <Calculator />
      </div>
    </section>
  );
}
