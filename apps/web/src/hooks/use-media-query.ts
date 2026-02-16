"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);

    onChange();

    // Safari <14 support
    if ("addEventListener" in media) {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (media as any).addListener(onChange);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return () => (media as any).removeListener(onChange);
  }, [query]);

  return matches;
}
