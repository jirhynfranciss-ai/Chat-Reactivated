import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={`h-11 w-11 ${className}`} />;
  }

  const current = theme === "system" ? resolvedTheme : theme;

  return (
    <motion.button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(current === "dark" ? "light" : "dark")}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      className={`flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-sm transition-colors glow-accent ${className}`}
      style={{
        borderColor: "var(--border-color)",
        background: "var(--surface)",
        color: "var(--accent)",
      }}
    >
      <motion.span
        key={current}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        {current === "dark" ? <Sun size={20} /> : <Moon size={20} />}
      </motion.span>
    </motion.button>
  );
}
