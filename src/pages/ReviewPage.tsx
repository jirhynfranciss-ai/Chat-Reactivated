import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Pencil } from "lucide-react";
import { PageShell } from "../components/ui/PageShell";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { EditAnswerModal } from "../components/questionnaire/EditAnswerModal";
import { useQuestionnaireStore } from "../store/useQuestionnaireStore";
import { submitResponse, hasExistingSubmission } from "../services/responsesService";
import type { Question } from "../types";

export default function ReviewPage() {
  const navigate = useNavigate();
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    sessionId,
    answers,
    setAnswer,
    getVisibleQuestions,
    setSubmitted,
    setResponseId,
  } = useQuestionnaireStore();

  const visibleQuestions = getVisibleQuestions();
  const answeredQuestions = visibleQuestions.filter((q) => answers[q.id]?.trim());

  useEffect(() => {
    if (answeredQuestions.length === 0) {
      navigate("/questionnaire");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answeredQuestions.length]);

  if (answeredQuestions.length === 0) {
    return null;
  }

  async function handleSubmit() {
    setSubmitting(true);
    const toastId = toast.loading("Sending your answers... 💌");
    try {
      const alreadySubmitted = await hasExistingSubmission(sessionId);
      if (alreadySubmitted) {
        toast.success("Looks like this was already sent. 💗", { id: toastId });
        setSubmitted(true);
        navigate("/complete");
        return;
      }

      const responseId = await submitResponse({
        sessionId,
        answers: answeredQuestions.map((q) => ({
          questionId: q.id,
          answerText: answers[q.id],
        })),
      });

      setResponseId(responseId);
      setSubmitted(true);
      toast.success("Sent! Thank you for sharing. 💗", { id: toastId });
      navigate("/complete");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again. 🤍", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell>
      <div className="flex flex-1 justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
              One last look... 💌
            </h1>
            <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
              Here's everything you shared with me. Tap any answer to change it.
            </p>
          </motion.div>

          <div className="space-y-4">
            {answeredQuestions.map((question, i) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card
                  className="cursor-pointer transition-shadow hover:shadow-lg"
                  onClick={() => setEditingQuestion(question)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p
                        className="mb-1 text-sm font-medium"
                        style={{ color: "var(--accent)" }}
                      >
                        {question.question_text}
                      </p>
                      <p className="text-base">{answers[question.id]}</p>
                    </div>
                    <Pencil
                      size={16}
                      className="mt-1 shrink-0"
                      style={{ color: "var(--text-secondary)" }}
                    />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              variant="secondary"
              onClick={() => navigate("/questionnaire")}
              type="button"
            >
              Back to Edit
            </Button>
            <Button
              onClick={handleSubmit}
              isLoading={submitting}
              type="button"
              className="px-10"
            >
              Send My Answers 💗
            </Button>
          </div>
        </div>
      </div>

      {editingQuestion && (
        <EditAnswerModal
          question={editingQuestion}
          value={answers[editingQuestion.id] || ""}
          onSave={(value) => setAnswer(editingQuestion.id, value)}
          onClose={() => setEditingQuestion(null)}
        />
      )}
    </PageShell>
  );
}
