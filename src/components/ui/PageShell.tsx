import type { ReactNode } from "react";
import { FloatingHearts } from "./FloatingHearts";
import { ThemeToggle } from "./ThemeToggle";

export function PageShell({
  children,
  showHearts = true,
  showThemeToggle = true,
  className = "",
}: {
  children: ReactNode;
  showHearts?: boolean;
  showThemeToggle?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative flex min-h-screen w-full flex-col overflow-hidden ${className}`}
      style={{
        background:
          "linear-gradient(135deg, var(--bg), var(--surface-alt) 45%, var(--lavender-soft))",
      }}
    >
      <div className="animate-gradient-pan pointer-events-none absolute inset-0 opacity-70" />
      {showHearts && <FloatingHearts />}
      {showThemeToggle && (
        <div className="absolute right-4 top-4 z-20 sm:right-8 sm:top-8">
          <ThemeToggle />
        </div>
      )}
      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </div>
  );
}
