import type { Quiz } from '../types';
import { chromaticQuiz } from './chromatic';
import { consultingQuiz } from './consulting';

export const quizzes: Quiz[] = [chromaticQuiz, consultingQuiz];

// The game owns a memory-only session and never enters the quiz persistence loop.
export { marketingDayGame } from './marketing-day';
// The salon uses a separately validated, versioned game session.
export { seasonGame as salonGame } from './paris-salon-season';
