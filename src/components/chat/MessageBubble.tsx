import { motion } from "framer-motion";
import { format } from "date-fns";
import { Check, CheckCheck } from "lucide-react";
import type { MessageRecord } from "../../types";

export function MessageBubble({
  message,
  isOwn,
}: {
  message: MessageRecord;
  isOwn: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
    >
      <div
        className="max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm sm:max-w-[65%]"
        style={{
          background: isOwn ? "var(--bubble-user)" : "var(--bubble-admin)",
          color: "var(--text-primary)",
          borderBottomRightRadius: isOwn ? 4 : undefined,
          borderBottomLeftRadius: !isOwn ? 4 : undefined,
        }}
      >
        <p className="whitespace-pre-wrap break-words">{message.message_text}</p>
        <div
          className={`mt-1 flex items-center gap-1 text-[10px] ${
            isOwn ? "justify-end" : "justify-start"
          }`}
          style={{ color: "var(--text-secondary)" }}
        >
          <span>{format(new Date(message.created_at), "h:mm a")}</span>
          {isOwn &&
            (message.read_at ? (
              <CheckCheck size={12} className="text-[var(--gold)]" />
            ) : (
              <Check size={12} />
            ))}
        </div>
      </div>
    </motion.div>
  );
}
