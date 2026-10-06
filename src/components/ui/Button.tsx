import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "../../utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  isLoading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "text-white shadow-lg [background:linear-gradient(135deg,var(--accent),var(--gold))] hover:brightness-110",
  secondary:
    "border bg-transparent hover:bg-[var(--surface-alt)]",
  ghost: "bg-transparent hover:bg-[var(--surface-alt)]",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export function Button({
  variant = "primary",
  isLoading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      disabled={disabled || isLoading}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-medium tracking-wide transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        className
      )}
      style={
        variant === "secondary"
          ? { borderColor: "var(--border-color)", color: "var(--text-primary)" }
          : undefined
      }
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          Please wait...
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}
