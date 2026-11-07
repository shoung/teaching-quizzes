export interface Question {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer?: number;
  explanation: string;
  kind?: 'single' | 'multiple';
  images?: string[];
  optionImages?: (string | null)[];
  referenceAnswers?: number[];
  reflection?: boolean;
  dimension?: string;
  scenario?: string;
  evidence?: { label: string; value: string }[];
  optionScores?: number[];
  optionFeedback?: string[];
}

export interface Quiz {
  id: string;
  version: number;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  minutes: number;
  color: 'sage' | 'peach' | 'lavender';
  icon: 'web' | 'ai' | 'media' | 'color' | 'briefcase';
  mode?: 'assessment' | 'consulting';
  cover?: string;
  questions: Question[];
}

export interface Session {
  version: number;
  answers: (number | number[] | null)[];
  completed: boolean;
}
