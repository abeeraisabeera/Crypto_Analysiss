"use client";

import { useEffect, useRef, useState } from "react";

export function useCountUp(target, duration = 600, enabled = true) {
  const [value, setValue] = useState(target);
  const frameRef = useRef(null);
  const startRef = useRef(null);
  const fromRef = useRef(target);

  useEffect(() => {
    if (!enabled || target == null || Number.isNaN(target)) {
      setValue(target);
      return;
    }

    cancelAnimationFrame(frameRef.current);
    fromRef.current = typeof value === "number" ? value : target;
    startRef.current = null;

    const animate = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(fromRef.current + (target - fromRef.current) * eased);
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, enabled]);

  return value;
}
