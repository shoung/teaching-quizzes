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

export interface QuizPreview {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  minutes: number;
  color: Quiz['color'];
  icon: Quiz['icon'];
  scenarioCount: number;
}

export type MarketingNpcId = 'lead' | 'designer' | 'media' | 'analyst';
export type PlanningPreviewView = 'brief' | 'research' | 'persona' | 'journey' | 'ideas' | 'blueprint' | 'review';
export type DetectiveStageId = 'needs' | 'persona' | 'journey' | 'ideas' | 'blueprint';
export interface DetectiveQuestion {
  id: string;
  label: string;
  reply: string;
}
export interface DetectiveChoice {
  id: string;
  label: string;
  kind?: 'proposal';
  correct: boolean;
  explanation: string;
  evidenceIds: string[];
}
export interface DetectiveStage {
  id: DetectiveStageId;
  title: string;
  task: string;
  prompt: string;
  intro: string[];
  questions: DetectiveQuestion[];
  choices: DetectiveChoice[];
  terms: string[];
  aiIdeas?: { title: string; text: string }[];
}
export interface DetectiveCase {
  id: string;
  version: number;
  title: string;
  clientName: string;
  clientRole: string;
  brand: string;
  minutes: number;
  questionLimit: number;
  stages: DetectiveStage[];
  glossary: { name: string; definition: string; example: string }[];
}
export interface DetectiveRoundState {
  askedIds: string[];
  selectedIds: string[];
  submittedIds: string[] | null;
}
export interface DetectiveSession {
  caseVersion: number;
  started: boolean;
  rounds: DetectiveRoundState[];
  completed: boolean;
}
export interface DetectiveRoundResult {
  stageId: DetectiveStageId;
  title: string;
  points: number;
  maxPoints: number;
  selectedIds: string[];
  askedIds: string[];
  hits: DetectiveChoice[];
  wrong: DetectiveChoice[];
  missed: DetectiveChoice[];
}
export interface DetectiveResult {
  score: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  satisfaction: string;
  bossComment: string;
  expertComment: string;
  rounds: DetectiveRoundResult[];
  totalHits: number;
  totalWrong: number;
  totalMissed: number;
}
export type MarketingDimension = 'strategy' | 'data' | 'collaboration';

export interface MarketingOption {
  id: string;
  label: string;
  score: 0 | 1 | 2;
  feedback: string;
  outcome: string;
}

export interface MarketingDecision {
  id: string;
  time: string;
  title: string;
  npcId: MarketingNpcId;
  speaker: string;
  role: string;
  task: string;
  dialogue: string[];
  question: string;
  evidence: { label: string; value: string }[];
  terms: string[];
  dimension: MarketingDimension;
  options: MarketingOption[];
  explanation: string;
}

export interface MarketingGameDefinition extends QuizPreview {
  version: number;
  decisions: MarketingDecision[];
}

export interface MarketingSession {
  version: number;
  started: boolean;
  answers: (string | null)[];
  completed: boolean;
}

export interface MarketingAxis {
  id: MarketingDimension;
  label: string;
  points: number;
  maxPoints: number;
  score: number;
}

export interface MarketingResult {
  points: number;
  maxPoints: number;
  score: number;
  highestCount: number;
  axes: MarketingAxis[];
  title: string;
  summary: string;
  practice: string[];
  review: { decision: MarketingDecision; selected: MarketingOption; reference: MarketingOption }[];
}

export type SalonPlace = 'salon' | 'study' | 'print' | 'cafe';
export type SalonTarget = 'artists' | 'collectors' | 'curious';
export type SalonPositioning = 'feedback' | 'stories' | 'open';
export type SalonDimension = 'insight' | 'resources' | 'relationships' | 'data' | 'ai' | 'operations';
export interface SalonStats {
  budget: number; awareness: number; trust: number; preparation: number; confirmed: number; waiting: number;
}
export type SalonEffect = Partial<Omit<SalonStats, 'budget'>>;
export interface SalonOption {
  id: string; title: string; label: string; text: string; cost: number;
  score: 0 | 1 | 2 | 3; feedback: string; effects: SalonEffect;
  target?: SalonTarget; positioning?: SalonPositioning;
  fit?: { targets: SalonTarget[]; score: 0 | 1 | 2 | 3; effects?: SalonEffect };
}
export interface SalonDecision {
  id: string; act: 1 | 2 | 3 | 4; place: SalonPlace; npc: number;
  speaker: string; role: string; title: string; question: string; scenario: string;
  evidence: { label: string; value: string }[]; terms: string[];
  dimension: SalonDimension; options: SalonOption[]; explanation: string;
}
export interface SalonStoryBeat {
  id: string; title: string; speaker: string; text: string; npc: number; place: SalonPlace;
}
export interface SalonDecisionBrief {
  setup: string; objective: string;
  clues: { label: string; text: string }[];
  principle: { title: string; text: string };
  options: Record<string, { basis: string; tradeoff: string; outcome: string; lesson: string }>;
}
export interface SalonGameDefinition extends QuizPreview {
  version: number; decisions: SalonDecision[];
}
export interface SalonSession {
  version: number; started: boolean; answers: (string | null)[]; completed: boolean;
  position: { place: SalonPlace; x: number; y: number };
  draft?: { index: number; optionId: string | null };
}
export interface SalonOpening { stats: SalonStats; attendance: number }
export interface SalonResolvedChoice {
  decision: SalonDecision; option: SalonOption; score: number; before: SalonStats; after: SalonStats;
}
export interface SalonReplay {
  stats: SalonStats; target: SalonTarget | null; positioning: SalonPositioning | null;
  opening: SalonOpening | null; choices: SalonResolvedChoice[];
}
export interface SalonResult extends SalonReplay {
  ending: 0 | 1 | 2 | 3; points: number; maxPoints: number; score: number; highestCount: number;
  axes: { id: SalonDimension; label: string; points: number; maxPoints: number; score: number; practice: string }[];
  practice: string[];
}
