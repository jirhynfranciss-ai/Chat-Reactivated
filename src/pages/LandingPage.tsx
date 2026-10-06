import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PageShell } from "../components/ui/PageShell";
import { Button } from "../components/ui/Button";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <PageShell>
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 text-5xl"
        >
          💌
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-serif max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl"
          style={{
            color: "var(--text-primary)",
            textShadow: "0 0 30px var(--shadow-color)",
          }}
        >
          A little question for you...
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="font-serif mt-4 text-2xl font-medium sm:text-3xl"
          style={{ color: "var(--accent)" }}
        >
          Can I Get to Know You?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-6 max-w-lg text-base leading-relaxed sm:text-lg"
          style={{ color: "var(--text-secondary)" }}
        >
          I've been curious about you, so I thought I'd ask a few things.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-2 max-w-lg text-base"
          style={{ color: "var(--text-secondary)" }}
        >
          Don't worry... there are no wrong answers. 🤍
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="mt-10"
        >
          <Button
            onClick={() => navigate("/questionnaire")}
            className="px-10 py-4 text-base glow-accent"
          >
            Start Answering 💗
          </Button>
        </motion.div>
      </div>
    </PageShell>
  );
}
