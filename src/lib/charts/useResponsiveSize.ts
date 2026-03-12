"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Size {
  width: number;
  height: number;
}

/**
 * Returns [containerRef, size] — auto-updates when the container resizes.
 * Debounces resize events to avoid layout thrashing.
 */
export function useResponsiveSize(): [React.RefObject<HTMLDivElement>, Size] {
  const containerRef = useRef<HTMLDivElement>(null!);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  const measure = useCallback(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setSize((prev) =>
        prev.width === clientWidth && prev.height === clientHeight
          ? prev
          : { width: clientWidth, height: clientHeight },
      );
    }
  }, []);

  useEffect(() => {
    measure();
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  return [containerRef, size];
}
