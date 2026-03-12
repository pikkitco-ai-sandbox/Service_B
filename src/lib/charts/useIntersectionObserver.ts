"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Returns [ref, isVisible] — triggers once when the element scrolls into view.
 * Threshold 0.25 means 25% of the element must be visible.
 */
export function useIntersectionObserver(threshold = 0.25) {
  const ref = useRef<HTMLDivElement>(null!);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isVisible] as const;
}
