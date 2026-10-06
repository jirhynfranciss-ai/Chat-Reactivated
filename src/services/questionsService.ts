// src/services/questionnaireService.ts
import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { debugLog } from './debugLogger';

interface AnswerEntry {
  response_id: string;
  question_id: string;
  answer_text: string;
}

export const submitQuestionnaire = async (answers: Record<string, any>) => {
  let sessionId = '';
  let responseId = '';

  try {
    debugLog.info('START SUBMISSION', { timestamp: new Date().toISOString() });
    debugLog.info('ANSWERS OBJECT', answers);

    // Validate Supabase connection
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    debugLog.info('AUTH SESSION CHECK', { session: session ? 'authenticated' : 'anonymous', sessionError });

    // Generate session ID
    sessionId = uuidv4();
    debugLog.info('GENERATED SESSION ID', sessionId);

    // Validate answers object
    if (!answers || Object.keys(answers).length === 0) {
      throw new Error('No answers provided to submit');
    }

    debugLog.info('ANSWERS COUNT', Object.keys(answers).length);

    // ============================================
    // STEP 1: CREATE RESPONSE RECORD
    // ============================================
    debugLog.info('STEP 1: Creating response record', {
      session_id: sessionId,
      user_id: null,
      submitted_at: new Date().toISOString(),
    });

    const responsePayload = {
      session_id: sessionId,
      user_id: null,
      submitted_at: new Date().toISOString(),
    };

    debugLog.info('RESPONSE PAYLOAD', responsePayload);

    // Try basic insert first
    const { data: responseInsertResult, error: responseInsertError } = await supabase
      .from('responses')
      .insert([responsePayload]);

    if (responseInsertError) {
      debugLog.error('RESPONSE INSERT FAILED', responseInsertError);
      throw new Error(`Failed to create response record: ${responseInsertError.message}`);
    }

    debugLog.info('RESPONSE INSERT SUCCESS', responseInsertResult);

    // Now fetch the created record
    const { data: createdResponse, error: fetchError } = await supabase
      .from('responses')
      .select('id')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError) {
      debugLog.error('RESPONSE FETCH FAILED', fetchError);
      throw new Error(`Failed to retrieve response ID: ${fetchError.message}`);
    }

    if (!createdResponse?.id) {
      throw new Error('Response record created but no ID returned');
    }

    responseId = createdResponse.id;
    debugLog.info('RESPONSE CREATED WITH ID', responseId);

    // ============================================
    // STEP 2: PREPARE ANSWER RECORDS
    // ============================================
    debugLog.info('STEP 2: Preparing answer records');

    const answersToInsert: AnswerEntry[] = [];

    for (const [questionId, answerValue] of Object.entries(answers)) {
      debugLog.info(`Processing answer for question: ${questionId}`, answerValue);

      // Skip null, undefined, or empty values
      if (answerValue === null || answerValue === undefined || answerValue === '') {
        debugLog.warn(`Skipping empty answer for question ${questionId}`, answerValue);
        continue;
      }

      let answerText = '';

      // Handle different types
      if (typeof answerValue === 'string') {
        answerText = answerValue.trim();
      } else if (typeof answerValue === 'number') {
        answerText = String(answerValue);
      } else if (Array.isArray(answerValue)) {
        // Multiple choice - join with comma
        answerText = answerValue
          .filter((item) => item !== null && item !== undefined && item !== '')
          .map((item) => String(item).trim())
          .join(', ');
      } else if (typeof answerValue === 'boolean') {
        answerText = answerValue ? 'Yes' : 'No';
      } else if (typeof answerValue === 'object') {
        answerText = JSON.stringify(answerValue);
      } else {
        answerText = String(answerValue);
      }

      if (!answerText || answerText.trim() === '') {
        debugLog.warn(`Answer text empty after processing for question ${questionId}`);
        continue;
      }

      answersToInsert.push({
        response_id: responseId,
        question_id: questionId,
        answer_text: answerText,
      });

      debugLog.info(`Added answer for question ${questionId}`, {
        questionId,
        answerTextLength: answerText.length,
        answerTextPreview: answerText.substring(0, 50),
      });
    }

    debugLog.info('ANSWERS PREPARED', {
      count: answersToInsert.length,
      answers: answersToInsert,
    });

    if (answersToInsert.length === 0) {
      throw new Error('No valid answers to submit after processing');
    }

    // ============================================
    // STEP 3: INSERT ANSWER RECORDS
    // ============================================
    debugLog.info('STEP 3: Inserting answer records');

    const { data: answersInsertResult, error: answersInsertError } = await supabase
      .from('answers')
      .insert(answersToInsert);

    if (answersInsertError) {
      debugLog.error('ANSWERS INSERT FAILED', answersInsertError);
      throw new Error(`Failed to create answer records: ${answersInsertError.message}`);
    }

    debugLog.info('ANSWERS INSERT SUCCESS', answersInsertResult);

    // ============================================
    // STEP 4: VERIFY SUBMISSION
    // ============================================
    debugLog.info('STEP 4: Verifying submission');

    const { data: verifyResponse, error: verifyError } = await supabase
      .from('responses')
      .select(
        `
        id,
        session_id,
        submitted_at,
        answers (
          id,
          question_id,
          answer_text
        )
      `
      )
      .eq('id', responseId)
      .single();

    if (verifyError) {
      debugLog.warn('VERIFICATION FAILED (non-critical)', verifyError);
    } else {
      debugLog.info('VERIFICATION SUCCESS', {
        responseId: verifyResponse.id,
        sessionId: verifyResponse.session_id,
        answersCount: verifyResponse.answers?.length || 0,
        answers: verifyResponse.answers,
      });
    }

    debugLog.info('SUBMISSION COMPLETE SUCCESS', {
      responseId,
      sessionId,
      answersCount: answersToInsert.length,
    });

    return {
      success: true,
      responseId,
      sessionId,
      answersCount: answersToInsert.length,
    };
  } catch (error) {
    debugLog.error('SUBMISSION COMPLETE FAILURE', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    debugLog.info('ERROR SUMMARY', {
      sessionId,
      responseId,
      errorMessage,
      errorType: error instanceof Error ? 'Error' : typeof error,
    });

    throw new Error(errorMessage);
  }
};
