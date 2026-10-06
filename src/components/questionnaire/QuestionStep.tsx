import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Heart } from "lucide-react";
import type { Question } from "../../types";
import { ChoiceOption } from "./ChoiceOption";
import { Button } from "../ui/Button";

interface QuestionStepProps {
  question: Question;
  value: string;
  onSubmit: (value: string) => void;
  onBack: () => void;
  canGoBack: boolean;
  isLast: boolean;
}

export function QuestionStep({
  question,
  value,
  onSubmit,
  onBack,
  canGoBack,
  isLast,
}: QuestionStepProps) {
  const [text, setText] = useState(value || "");
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>(
    value ? value.split(", ").filter(Boolean) : []
  );
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setText(value || "");
    setSelected(value ? value.split(", ").filter(Boolean) : []);
    setError(null);
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, [question.id, value]);

  const isTextType =
    question.question_type === "TEXT" || question.question_type === "LONG_TEXT";

  function validateAndSubmit(finalValue: string) {
    if (question.is_required && !finalValue.trim()) {
      setError("This one means a lot to me... mind answering? 🤍");
      return;
    }
    setError(null);
    onSubmit(finalValue.trim());
  }

  function handleSingleSelect(option: string) {
    setSelected([option]);
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    autoAdvanceTimer.current = setTimeout(() => {
      validateAndSubmit(option);
    }, 450);
  }

  function handleMultiToggle(option: string) {
    setSelected((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full"
    >
      {question.introduction_text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-2 text-sm font-medium"
          style={{ color: "var(--accent)" }}
        >
          {question.introduction_text}
        </motion.p>
      )}

      <h2 className="font-serif mb-6 text-2xl font-semibold leading-snug sm:text-3xl">
        {question.question_text}
      </h2>

      <div className="space-y-3">
        {question.question_type === "TEXT" && (
          <input
            autoFocus
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              question.id === "seed-3" || question.conditional_question_id
                ? "Your Facebook name or profile URL..."
                : "Type your answer..."
            }
            className="w-full rounded-2xl border px-5 py-4 text-base outline-none transition-shadow duration-200 focus:shadow-[0_0_0_3px_var(--shadow-color)]"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--surface)",
              color: "var(--text-primary)",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") validateAndSubmit(text);
            }}
          />
        )}

        {question.question_type === "LONG_TEXT" && (
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Take your time..."
            className="w-full resize-none rounded-2xl border px-5 py-4 text-base outline-none transition-shadow duration-200 focus:shadow-[0_0_0_3px_var(--shadow-color)]"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--surface)",
              color: "var(--text-primary)",
            }}
          />
        )}

        {question.question_type === "SINGLE_CHOICE" &&
          question.options?.map((option) => (
            <ChoiceOption
              key={option}
              label={option}
              selected={selected.includes(option)}
              onClick={() => handleSingleSelect(option)}
            />
          ))}

        {question.question_type === "MULTIPLE_CHOICE" &&
          question.options?.map((option) => (
            <ChoiceOption
              key={option}
              label={option}
              selected={selected.includes(option)}
              onClick={() => handleMultiToggle(option)}
            />
          ))}

        {error && (
          <motion.p
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-1 text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        {canGoBack ? (
          <Button variant="secondary" onClick={onBack} type="button">
            <ArrowLeft size={16} /> Back
          </Button>
        ) : (
          <span />
        )}

        {isTextType && (
          <Button type="button" onClick={() => validateAndSubmit(text)}>
            {isLast ? "Finish 💗" : "Continue"}
          </Button>
        )}

        {question.question_type === "MULTIPLE_CHOICE" && (
          <Button
            type="button"
            onClick={() => validateAndSubmit(selected.join(", "))}
          >
            <Heart size={16} className="mr-1" />
            {isLast ? "Finish 💗" : "Continue"}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
