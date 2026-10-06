import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { PageShell } from "../components/ui/PageShell";
import { Card } from "../components/ui/Card";
import { ProgressBar } from "../components/ui/ProgressBar";
import { QuestionStep } from "../components/questionnaire/QuestionStep";
import { useQuestionnaireStore } from "../store/useQuestionnaireStore";
import { fetchActiveQuestions } from "../services/questionsService";

const MOTIVATIONAL_MESSAGES = [
  "Let's start simple... 💗",
  "I like learning about you already. 🤍",
  "You're doing great, keep going... ✨",
  "Almost halfway there... 💭",
  "I'm really enjoying this. 😊",
  "Just a few more... promise. 💗",
  "Nearly there... 💌",
];

export default function QuestionnairePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { questions, setQuestions, currentIndex, answers, setAnswer, goNext, goBack, getVisibleQuestions } =
    useQuestionnaireStore();

  useEffect(() => {
    let active = true;
    fetchActiveQuestions().then((qs) => {
      if (active) {
        setQuestions(qs);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [setQuestions]);

  const visibleQuestions = getVisibleQuestions();
  const currentQuestion = visibleQuestions[currentIndex];

  useEffect(() => {
    if (!loading && !currentQuestion && questions.length > 0) {
      navigate("/review");
    }
  }, [loading, currentQuestion, questions.length, navigate]);

  if (loading) {
    return (
      <PageShell>
        <div className="flex flex-1 items-center justify-center">
          <p style={{ color: "var(--text-secondary)" }}>
            Getting things ready for you... 💗
          </p>
        </div>
      </PageShell>
    );
  }

  if (!currentQuestion) {
    return (
      <PageShell>
        <div className="flex flex-1 items-center justify-center">
          <p style={{ color: "var(--text-secondary)" }}>One moment... 🤍</p>
        </div>
      </PageShell>
    );
  }

  function handleSubmit(value: string) {
    setAnswer(currentQuestion.id, value);

    const isLast = currentIndex >= visibleQuestions.length - 1;
    if (isLast) {
      toast.success("Got it! Let's take a look... 💌");
      navigate("/review");
    } else {
      goNext();
    }
  }

  const motivational =
    MOTIVATIONAL_MESSAGES[
      Math.min(
        Math.floor((currentIndex / Math.max(visibleQuestions.length, 1)) * MOTIVATIONAL_MESSAGES.length),
        MOTIVATIONAL_MESSAGES.length - 1
      )
    ];

  return (
    <PageShell>
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-xl">
          <div className="mb-6">
            <ProgressBar current={currentIndex} total={visibleQuestions.length} />
            <p
              className="mt-3 text-center text-sm italic"
              style={{ color: "var(--text-secondary)" }}
            >
              {motivational}
            </p>
          </div>

          <Card>
            <AnimatePresence mode="wait">
              <QuestionStep
                key={currentQuestion.id}
                question={currentQuestion}
                value={answers[currentQuestion.id] || ""}
                onSubmit={handleSubmit}
                onBack={goBack}
                canGoBack={currentIndex > 0}
                isLast={currentIndex >= visibleQuestions.length - 1}
              />
            </AnimatePresence>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
