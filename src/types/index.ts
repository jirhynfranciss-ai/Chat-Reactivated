export type QuestionType =
  | "TEXT"
  | "LONG_TEXT"
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "YES_NO";

export interface Question {
  id: string;
  question_text: string;
  question_type: QuestionType;
  options: string[] | null;
  is_required: boolean;
  is_active: boolean;
  display_order: number;
  introduction_text: string | null;
  conditional_question_id: string | null;
  conditional_value: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Answer {
  question_id: string;
  answer_text: string;
}

export interface ResponseRecord {
  id: string;
  session_id: string;
  user_id: string | null;
  submitted_at: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface MessageRecord {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_text: string;
  created_at: string;
  read_at: string | null;
}

export interface AdminSettings {
  id: string;
  site_title: string;
  welcome_message: string;
  final_message: string;
  theme_appearance: "light" | "dark" | "auto";
  questionnaire_enabled: boolean;
  allow_multiple_submissions: boolean;
  account_creation_enabled: boolean;
  chat_enabled: boolean;
}

export type ThemePreference = "light" | "dark" | "system";
