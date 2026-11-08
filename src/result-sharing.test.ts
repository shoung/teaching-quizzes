import { expect, it } from 'vitest';
import { buildResultPost } from './result-sharing';
import { getConsultingReport } from './consulting-engine';
import { consultingQuiz } from './data/consulting';

it('不同成績產生各自評語與六項技能，分享連結只帶測驗介紹',()=>{
  const report=getConsultingReport(consultingQuiz,{version:consultingQuiz.version,completed:true,answers:consultingQuiz.questions.map(q=>q.optionScores!.indexOf(0))})!;
  const post=buildResultPost(consultingQuiz,report,'https://is.gd/SpjRZt');
  expect(post).toContain('0 / 100 分｜潛力新手，先練這兩招');
  expect(post).toContain('拆題力 0 · 數字感 0 · 商業直覺 0 · AI 助攻 0 · 找破綻 0 · 說服力 0');
  expect(post).toContain('非官方招募');
  expect(post).not.toMatch(/answers|token|\/result|learning-lab:/);
});
