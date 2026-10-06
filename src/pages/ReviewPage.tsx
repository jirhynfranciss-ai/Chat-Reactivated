// src/components/questionnaire/ReviewPage.tsx or wherever submission happens
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { submitQuestionnaire } from '../../services/questionnaireService';
import { debugLog } from '../../services/debugLogger';

interface ReviewPageProps {
  answers: Record<string, any>;
  onEdit: (questionId: string) => void;
  onBack: () => void;
}

export const ReviewPage = ({ answers, onEdit, onBack }: ReviewPageProps) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      debugLog.info('HANDLE SUBMIT CALLED', { answersCount: Object.keys(answers).length });

      // Show loading toast
      const loadingToast = toast.loading('Sending your answers... 💌');

      const result = await submitQuestionnaire(answers);

      debugLog.info('SUBMISSION RESULT', result);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Show success toast
      toast.success('Thank you for your answers! 💗');

      // Store in localStorage as backup
      localStorage.setItem('questionnaire_session_id', result.sessionId);
      localStorage.setItem('questionnaire_response_id', result.responseId);

      debugLog.info('STORED IN LOCALSTORAGE', {
        sessionId: result.sessionId,
        responseId: result.responseId,
      });

      // Redirect after a brief delay
      setTimeout(() => {
        navigate('/complete');
      }, 500);
    } catch (error) {
      debugLog.error('HANDLE SUBMIT ERROR', error);

      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';

      // Show actual error to user
      toast.error(errorMessage, { duration: 5000 });

      // Also log to console
      console.error('❌ SUBMISSION FAILED:', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Your review content here */}

      <div className="flex gap-4">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="px-6 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 rounded-lg bg-rose-400 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold"
        >
          {isSubmitting ? 'Sending...' : 'Send My Answers 💗'}
        </button>
      </div>
    </div>
  );
};
