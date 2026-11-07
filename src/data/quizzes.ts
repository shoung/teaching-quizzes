import type { Quiz } from '../types';
import { chromaticQuiz } from './chromatic';
import { consultingQuiz } from './consulting';

export const quizzes: Quiz[] = [chromaticQuiz, consultingQuiz];
