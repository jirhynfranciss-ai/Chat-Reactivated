import { motion } from "framer-motion";

export function ProgressBar({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const percentage = total > 0 ? ((current + 1) / total) * 100 : 0;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-xs font-medium tracking-wide" style={{ color: "var(--text-secondary)" }}>
        <span>Getting to know you... 💗</span>
        <span>
          {Math.min(current + 1, total)} of {total}
        </span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full"
        style={{ background: "var(--surface-alt)" }}
      >
        <motion.div
          className="h-full rounded-full [background:linear-gradient(90deg,var(--accent),var(--gold))]"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
