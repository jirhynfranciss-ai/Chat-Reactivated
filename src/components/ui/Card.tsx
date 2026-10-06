import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

export function Card({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "romantic-card rounded-3xl p-6 sm:p-8",
        className
      )}
    >
      {children}
    </div>
  );
}
