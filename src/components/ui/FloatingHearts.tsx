import { useMemo } from "react";
import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

interface HeartConfig {
  id: number;
  left: string;
  size: number;
  duration: number;
  delay: number;
  symbol: string;
}

export function FloatingHearts({ count = 14 }: { count?: number }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const hearts = useMemo<HeartConfig[]>(() => {
    const symbols = ["💗", "🤍", "💞", "✨"];
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: 12 + Math.random() * 16,
      duration: 10 + Math.random() * 10,
      delay: Math.random() * 10,
      symbol: symbols[i % symbols.length],
    }));
  }, [count]);

  if (prefersReducedMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {hearts.map((heart) => (
        <motion.span
          key={heart.id}
          className="absolute select-none opacity-0"
          style={{ left: heart.left, fontSize: heart.size, bottom: "-5%" }}
          animate={{
            y: ["0%", "-120vh"],
            opacity: [0, 0.8, 0.8, 0],
            x: [0, 15, -15, 0],
          }}
          transition={{
            duration: heart.duration,
            delay: heart.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {heart.symbol}
        </motion.span>
      ))}
    </div>
  );
}
