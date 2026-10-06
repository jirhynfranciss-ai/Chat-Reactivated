import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { Question } from "../types";

interface QuestionnaireState {
  sessionId: string;
  questions: Question[];
  currentIndex: number;
  answers: Record<string, string>;
  submitted: boolean;
  responseId: string | null;
  setQuestions: (questions: Question[]) => void;
  setAnswer: (questionId: string, value: string) => void;
  goNext: () => void;
  goBack: () => void;
  goToIndex: (index: number) => void;
  setSubmitted: (value: boolean) => void;
  setResponseId: (id: string | null) => void;
  resetSession: () => void;
  getVisibleQuestions: () => Question[];
}

export const useQuestionnaireStore = create<QuestionnaireState>()(
  persist(
    (set, get) => ({
      sessionId: uuidv4(),
      questions: [],
      currentIndex: 0,
      answers: {},
      submitted: false,
      responseId: null,
      setQuestions: (questions) => set({ questions }),
      setAnswer: (questionId, value) =>
        set((state) => ({
          answers: { ...state.answers, [questionId]: value },
        })),
      getVisibleQuestions: () => {
        const { questions, answers } = get();
        return questions.filter((q) => {
          if (!q.conditional_question_id) return true;
          const parentAnswer = answers[q.conditional_question_id];
          if (parentAnswer === undefined) return false;
          return parentAnswer === q.conditional_value;
        });
      },
      goNext: () => {
        const visible = get().getVisibleQuestions();
        set((state) => ({
          currentIndex: Math.min(state.currentIndex + 1, visible.length - 1),
        }));
      },
      goBack: () =>
        set((state) => ({ currentIndex: Math.max(state.currentIndex - 1, 0) })),
      goToIndex: (index) => set({ currentIndex: index }),
      setSubmitted: (value) => set({ submitted: value }),
      setResponseId: (id) => set({ responseId: id }),
      resetSession: () =>
        set({
          sessionId: uuidv4(),
          currentIndex: 0,
          answers: {},
          submitted: false,
          responseId: null,
        }),
    }),
    {
      name: "romantic-questionnaire-session",
      partialize: (state) => ({
        sessionId: state.sessionId,
        answers: state.answers,
        currentIndex: state.currentIndex,
        submitted: state.submitted,
        responseId: state.responseId,
      }),
    }
  )
);
