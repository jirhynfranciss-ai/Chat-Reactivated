import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { Question } from "../../types";
import { Button } from "../ui/Button";
import { ChoiceOption } from "./ChoiceOption";

export function EditAnswerModal({
  question,
  value,
  onSave,
  onClose,
}: {
  question: Question;
  value: string;
  onSave: (value: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(value);
  const [selected, setSelected] = useState<string[]>(
    value ? value.split(", ").filter(Boolean) : []
  );
  const isTextType =
    question.question_type === "TEXT" || question.question_type === "LONG_TEXT";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
          className="romantic-card w-full max-w-lg rounded-3xl p-6"
          style={{ background: "var(--surface)" }}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <h3 className="font-serif text-xl font-semibold">
              {question.question_text}
            </h3>
            <button onClick={onClose} aria-label="Close">
              <X size={20} style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>

          {isTextType &&
            (question.question_type === "LONG_TEXT" ? (
              <textarea
                autoFocus
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full resize-none rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--border-color)", background: "var(--bg)" }}
              />
            ) : (
              <input
                autoFocus
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--border-color)", background: "var(--bg)" }}
              />
            ))}

          {(question.question_type === "SINGLE_CHOICE" ||
            question.question_type === "MULTIPLE_CHOICE") && (
            <div className="space-y-2">
              {question.options?.map((option) => (
                <ChoiceOption
                  key={option}
                  label={option}
                  selected={selected.includes(option)}
                  onClick={() => {
                    if (question.question_type === "SINGLE_CHOICE") {
                      setSelected([option]);
                    } else {
                      setSelected((prev) =>
                        prev.includes(option)
                          ? prev.filter((o) => o !== option)
                          : [...prev, option]
                      );
                    }
                  }}
                />
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                onSave(isTextType ? text.trim() : selected.join(", "));
                onClose();
              }}
            >
              Save Answer 💗
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
