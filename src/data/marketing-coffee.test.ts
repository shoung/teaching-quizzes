import { describe, expect, it } from 'vitest';
import { chapterThreeCase } from './marketing-coffee';

const coverage: Record<string, { questions: string[]; choices: string[] }> = {
  needs: { questions: ['coffee-needs-q1', 'coffee-needs-q2', 'coffee-needs-q3', 'coffee-needs-q4'], choices: ['coffee-needs-c01', 'coffee-needs-c02', 'coffee-needs-c03', 'coffee-needs-c04'] },
  persona: { questions: ['coffee-persona-q1', 'coffee-persona-q2', 'coffee-persona-q3', 'coffee-persona-q4'], choices: ['coffee-persona-c01', 'coffee-persona-c02', 'coffee-persona-c03', 'coffee-persona-c04'] },
  journey: { questions: ['coffee-journey-q1', 'coffee-journey-q2', 'coffee-journey-q3', 'coffee-journey-q4', 'coffee-journey-q5'], choices: ['coffee-journey-c01', 'coffee-journey-c03', 'coffee-journey-c04', 'coffee-journey-c05', 'coffee-journey-c07', 'coffee-journey-c15'] },
  ideas: { questions: ['coffee-ideas-q1', 'coffee-ideas-q2', 'coffee-ideas-q4', 'coffee-ideas-q5', 'coffee-ideas-q7'], choices: ['coffee-ideas-c01', 'coffee-ideas-c02', 'coffee-ideas-c03', 'coffee-ideas-c04', 'coffee-ideas-c05', 'coffee-ideas-c06'] },
  blueprint: { questions: ['coffee-blueprint-q1', 'coffee-blueprint-q2', 'coffee-blueprint-q3', 'coffee-blueprint-q6', 'coffee-blueprint-q8'], choices: ['coffee-blueprint-c01', 'coffee-blueprint-c02', 'coffee-blueprint-c03', 'coffee-blueprint-c04', 'coffee-blueprint-c05', 'coffee-blueprint-c16'] },
};
const length = (text: string) => Array.from(text).length;

describe('chapterThreeCase coffee shop teaching content', () => {
  it('uses the approved identity and five stable, unique rounds', () => {
    expect(chapterThreeCase).toMatchObject({ id: 'marketing-day-chapter-3', version: 1, title: '咖啡店提案日', clientName: '陳店長', brand: '日常咖啡', clientRole: '日常咖啡負責人', minutes: 12, questionLimit: 5 });
    expect(chapterThreeCase.stages.map(({ id }) => id)).toEqual(['needs', 'persona', 'journey', 'ideas', 'blueprint']);
    const ids = [chapterThreeCase.id];
    for (const stage of chapterThreeCase.stages) ids.push(stage.id, ...stage.questions.map(({ id }) => id), ...stage.choices.map(({ id }) => id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const stage of chapterThreeCase.stages) {
      for (const id of [...stage.questions.map(({ id }) => id), ...stage.choices.map(({ id }) => id)]) expect(id).toContain('coffee-');
    }
  });

  it('gives each round six brief setup paragraphs and eight useful questions', () => {
    for (const stage of chapterThreeCase.stages) {
      expect(stage.intro).toHaveLength(6);
      for (const paragraph of stage.intro) expect(length(paragraph), `${stage.id} intro paragraph: ${paragraph}`).toBeGreaterThanOrEqual(20);
      for (const paragraph of stage.intro) expect(length(paragraph)).toBeLessThanOrEqual(100);
      expect(stage.questions).toHaveLength(8);
      for (const question of stage.questions) {
        expect(question.id).toMatch(new RegExp(`^coffee-${stage.id}-q\\d+$`));
        expect(length(question.reply), `${question.id}: ${question.reply}`).toBeGreaterThanOrEqual(20);
        expect(length(question.reply)).toBeLessThanOrEqual(160);
      }
      expect(stage.prompt).toContain('選');
    }
  });

  it('has substantial choice pools, grounded explanations, and round-local evidence', () => {
    const correctCounts = [4, 4, 6, 6, 6];
    for (const [index, stage] of chapterThreeCase.stages.entries()) {
      expect(stage.choices).toHaveLength(index === 0 ? 20 : 16);
      expect(stage.choices.filter(({ correct }) => correct)).toHaveLength(correctCounts[index]);
      const validEvidence = new Set(['intro', ...stage.questions.map(({ id }) => id)]);
      for (const choice of stage.choices) {
        expect(choice.id).toMatch(new RegExp(`^coffee-${stage.id}-c\\d+$`));
        expect(length(choice.explanation)).toBeGreaterThanOrEqual(15);
        expect(choice.evidenceIds.length).toBeGreaterThan(0);
        expect(choice.evidenceIds.every((id) => validEvidence.has(id))).toBe(true);
      }
      const selectedCoverage = coverage[stage.id];
      expect(selectedCoverage.questions.length).toBeLessThanOrEqual(5);
      const available = new Set(['intro', ...selectedCoverage.questions]);
      const correctChoices = stage.choices.filter(({ correct }) => correct);
      expect(correctChoices.map(({ id }) => id).sort()).toEqual([...selectedCoverage.choices].sort());
      expect(correctChoices.every(({ evidenceIds }) => evidenceIds.some((id) => available.has(id))), `${stage.id}: ${JSON.stringify(correctChoices.map(({ id, evidenceIds }) => [id, evidenceIds]))}`).toBe(true);
    }
  });

  it('anchors the case in confirmed peak-hour preorder constraints and a narrow persona', () => {
    const content = JSON.stringify(chapterThreeCase);
    expect(content).toMatch(/8.?9點|8到9點|八點到九點/);
    expect(content).toMatch(/兩人|2人/);
    expect(content).toMatch(/單號/);
    expect(content).toMatch(/取餐時段/);
    expect(content).toMatch(/客製/);
    expect(content).toMatch(/確認|覆核/);
    expect(content).toMatch(/產能|杯數/);
    expect(chapterThreeCase.stages[0].choices.find(({ id }) => id === 'coffee-needs-c05')).toMatchObject({ correct: false, explanation: expect.stringMatching(/沒有問到離開原因/) });
    expect(chapterThreeCase.stages[1].questions[0].reply).toMatch(/辦公室上班|上班族|通勤/);
    expect(chapterThreeCase.stages[1].questions[1].reply).toMatch(/八點三十五/);
    expect(chapterThreeCase.stages[1].questions[1].reply).toMatch(/八點四十/);
    expect(chapterThreeCase.stages[2].title).toContain('痛點');
    expect(chapterThreeCase.stages[2].title).toContain('機會');
    for (const stage of chapterThreeCase.stages) {
      for (const line of [...stage.intro, ...stage.questions.map(({ reply }) => reply)]) {
        expect(line).not.toMatch(/店長(?:希望|只記得|說|確認|核准)/);
      }
    }
  });

  it('compares three AI assisted proposals and maps all blueprint layers', () => {
    const ideas = chapterThreeCase.stages.find(({ id }) => id === 'ideas')!;
    expect(ideas.aiIdeas).toHaveLength(3);
    const proposals = ideas.choices.filter(({ kind }) => kind === 'proposal');
    expect(proposals).toHaveLength(3);
    expect(proposals.filter(({ correct }) => correct)).toHaveLength(1);
    const fullText = JSON.stringify({ ideas, blueprint: chapterThreeCase.stages[4] });
    expect(fullText).toMatch(/LINE/);
    expect(fullText).toMatch(/表單/);
    expect(fullText).toMatch(/單號/);
    expect(fullText).toMatch(/人工覆核|店員確認/);
    expect(fullText).toMatch(/新App|新 App/);
    expect(fullText).toMatch(/外送/);
    const blueprint = chapterThreeCase.stages[4];
    for (const layer of ['顧客', '前台', '後台', '支援', '異常']) {
      expect(blueprint.choices.some(({ label, explanation }) => label.includes(layer) || explanation.includes(layer))).toBe(true);
    }
  });

  it('defines at least eight terms with examples grounded in this cafe', () => {
    expect(chapterThreeCase.glossary.length).toBeGreaterThanOrEqual(8);
    for (const term of ['Persona', 'Journey', 'Blueprint', '痛點', '服務機會', '生成式AI', '人工覆核', '驗證指標']) {
      const item = chapterThreeCase.glossary.find(({ name }) => name.includes(term));
      expect(item, `missing glossary term ${term}`).toBeDefined();
      expect(item!.definition.length).toBeGreaterThan(15);
      expect(item!.example.length).toBeGreaterThan(15);
    }
  });
});
