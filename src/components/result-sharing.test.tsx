import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { ConsultingResult } from './ConsultingResult';
import { consultingQuiz } from '../data/consulting';

it('結果頁底部分享個人成果，保留上方的成績與重新測驗操作', () => {
  render(<ConsultingResult quiz={consultingQuiz} session={{version:consultingQuiz.version,completed:true,answers:consultingQuiz.questions.map(q=>q.correctAnswer!)}} onRestart={vi.fn()} onShare={vi.fn()} />);
  expect(screen.getByRole('button', {name:'分享測驗結果'})).toBeInTheDocument();
  expect(screen.queryByRole('button', {name:'分享這份測驗'})).not.toBeInTheDocument();
  expect(screen.getByLabelText('測驗分數')).toHaveTextContent('100');
  expect(screen.getByRole('button', {name:/重新測驗/})).toBeInTheDocument();
});
