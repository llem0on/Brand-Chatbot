"use client";

import { useRef } from "react";

const MAX_TILT_DEG = 8;

export function useTilt<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  function onMouseMove(e: React.MouseEvent<T>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${-y * MAX_TILT_DEG}deg) rotateY(${x * MAX_TILT_DEG}deg) translateY(-6px)`;
  }

  function onMouseLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0)";
  }

  return { ref, onMouseMove, onMouseLeave };
}
