import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PageShell } from "../components/ui/PageShell";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useQuestionnaireStore } from "../store/useQuestionnaireStore";

type Stage = "celebrate" | "invite" | "farewell";

export default function CompletePage() {
  const navigate = useNavigate();
  const { submitted } = useQuestionnaireStore();
  const [stage, setStage] = useState<Stage>("celebrate");

  useEffect(() => {
    if (!submitted) {
      navigate("/");
      return;
    }
    const timer = setTimeout(() => setStage("invite"), 2600);
    return () => clearTimeout(timer);
  }, [submitted, navigate]);

  const sparkles = ["💗", "✨", "🤍", "💞", "⭐"];

  return (
    <PageShell>
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16 sm:px-6">
        {stage === "celebrate" &&
          Array.from({ length: 18 }).map((_, i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute select-none text-2xl"
              initial={{
                top: "45%",
                left: "50%",
                opacity: 1,
                scale: 0,
              }}
              animate={{
                top: `${Math.random() * 90}%`,
                left: `${Math.random() * 90}%`,
                opacity: 0,
                scale: 1,
              }}
              transition={{ duration: 1.8 + Math.random(), ease: "easeOut" }}
            >
              {sparkles[i % sparkles.length]}
            </motion.span>
          ))}

        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {stage === "celebrate" && (
              <motion.div
                key="celebrate"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <Card>
                  <span className="mb-4 block text-5xl">💌</span>
                  <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
                    And that's all... for now.
                  </h1>
                  <p className="mt-4" style={{ color: "var(--text-secondary)" }}>
                    Thank you for letting me get to know you a little better.
                  </p>
                  <p className="mt-2 font-medium" style={{ color: "var(--accent)" }}>
                    Maybe this is just the beginning. 🤍
                  </p>
                  <p className="mt-6 text-sm" style={{ color: "var(--text-secondary)" }}>
                    It's on its way! 💌 Thank you for answering my little questions.
                  </p>
                </Card>
              </motion.div>
            )}

            {stage === "invite" && (
              <motion.div
                key="invite"
                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="text-center">
                  <span className="mb-4 block text-4xl">👀</span>
                  <h2 className="font-serif text-2xl font-semibold sm:text-3xl">
                    Before you go... can I ask you one more little thing? 👀
                  </h2>
                  <p className="mt-4" style={{ color: "var(--text-secondary)" }}>
                    Would you like to make a little account so we can chat privately? 💗
                  </p>
                  <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                    Nothing complicated. Just a simple account so our conversation can
                    stay between us.
                  </p>
                  <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Button onClick={() => navigate("/create-account")}>
                      Create My Account 💗
                    </Button>
                    <Button variant="secondary" onClick={() => setStage("farewell")}>
                      Maybe Later 🤍
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {stage === "farewell" && (
              <motion.div
                key="farewell"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <Card>
                  <span className="mb-4 block text-4xl">🤍</span>
                  <h2 className="font-serif text-2xl font-semibold">
                    That's okay. 🤍
                  </h2>
                  <p className="mt-4" style={{ color: "var(--text-secondary)" }}>
                    Thank you again for sharing a piece of you with me today.
                    Whenever you're ready, I'll be here.
                  </p>
                  <Button
                    variant="secondary"
                    className="mt-6"
                    onClick={() => navigate("/")}
                  >
                    Back to Start
                  </Button>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageShell>
  );
}
