"use client";

import { useEffect } from "react";

export function DropGuard() {
  useEffect(() => {
    function block(event: DragEvent) {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-drop-zone]")) return;
      event.preventDefault();
    }
    window.addEventListener("dragover", block);
    window.addEventListener("drop", block);
    return () => {
      window.removeEventListener("dragover", block);
      window.removeEventListener("drop", block);
    };
  }, []);
  return null;
}
