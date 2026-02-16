"use client";

import { useEffect, useState } from "react";

export function ProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = document.querySelector("main");
    if (!(el instanceof HTMLElement)) return;
    const mainEl = el;

    function handleScroll() {
      const maxScroll = mainEl.scrollHeight - mainEl.clientHeight;
      if (maxScroll <= 0) {
        setProgress(0);
        return;
      }
      setProgress(Math.min(Math.max(mainEl.scrollTop / maxScroll, 0), 1));
    }

    handleScroll();
    mainEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => mainEl.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-40 h-0.5 bg-gray-100">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-[width] duration-150"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
