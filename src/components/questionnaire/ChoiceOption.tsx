import { motion } from "framer-motion";
import { Check } from "lucide-react";

export function ChoiceOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      className="relative flex w-full items-center justify-between gap-3 rounded-2xl border px-5 py-4 text-left text-base transition-colors duration-200"
      style={{
        borderColor: selected ? "var(--accent)" : "var(--border-color)",
        background: selected ? "var(--surface-alt)" : "var(--surface)",
        color: "var(--text-primary)",
        boxShadow: selected ? "0 0 18px var(--shadow-color)" : undefined,
      }}
    >
      <span>{label}</span>
      {selected && (
        <motion.span
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="flex h-6 w-6 items-center justify-center rounded-full"
          style={{ background: "var(--accent)", color: "white" }}
        >
          <Check size={14} />
        </motion.span>
      )}
    </motion.button>
  );
}
