import { describe, expect, it } from 'vitest';
import { chapterTwoCase } from './marketing-detective';

const coreCoverage: Record<string, { questions: string[]; choices: string[] }> = {
  needs: { questions: ['needs-q2', 'needs-q3', 'needs-q4', 'needs-q5'], choices: ['needs-c01', 'needs-c02', 'needs-c03', 'needs-c18'] },
  persona: { questions: ['persona-q1', 'persona-q2', 'persona-q3', 'persona-q5'], choices: ['persona-c01', 'persona-c02', 'persona-c03', 'persona-c04', 'persona-c09'] },
  journey: { questions: ['journey-q1', 'journey-q2', 'journey-q3', 'journey-q4', 'journey-q5'], choices: ['journey-c01', 'journey-c02', 'journey-c03', 'journey-c04', 'journey-c05', 'journey-c06'] },
  ideas: { questions: ['ideas-q1', 'ideas-q4', 'ideas-q5', 'ideas-q7'], choices: ['ideas-c01', 'ideas-c02', 'ideas-c03', 'ideas-c04'] },
  blueprint: { questions: ['blueprint-q1', 'blueprint-q2', 'blueprint-q3', 'blueprint-q4', 'blueprint-q6'], choices: ['blueprint-c01', 'blueprint-c02', 'blueprint-c03', 'blueprint-c04', 'blueprint-c05'] },
};

const length = (text: string) => Array.from(text).length;

describe('chapterTwoCase teaching content', () => {
  it('has the requested case identity, five rounds, and unique stable IDs', () => {
    expect(chapterTwoCase).toMatchObject({
      id: 'marketing-day-chapter-2', version: 6, title: '客戶來訪日',
      clientName: '林老闆', clientRole: '轉角動作室負責人', brand: '轉角動作室',
      minutes: 12, questionLimit: 5,
    });
    expect(chapterTwoCase.stages.map((stage) => stage.id)).toEqual([
      'needs', 'persona', 'journey', 'ideas', 'blueprint',
    ]);

    const ids = [chapterTwoCase.id];
    for (const stage of chapterTwoCase.stages) {
      ids.push(stage.id, ...stage.questions.map((question) => question.id), ...stage.choices.map((choice) => choice.id));
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('provides three short opening paragraphs and eight questions per round', () => {
    for (const stage of chapterTwoCase.stages) {
      expect(stage.intro).toHaveLength(3);
      for (const paragraph of stage.intro) expect(length(paragraph)).toBeGreaterThanOrEqual(30);
      for (const paragraph of stage.intro) expect(length(paragraph)).toBeLessThanOrEqual(55);
      expect(stage.questions).toHaveLength(8);
      for (const question of stage.questions) {
        expect(question.id).toMatch(new RegExp(`^${stage.id}-q\\d+$`));
        expect(length(question.reply)).toBeGreaterThanOrEqual(40);
        expect(length(question.reply)).toBeLessThanOrEqual(90);
      }
      expect(stage.prompt).toContain('只選本案已有線索支持');
    }
  });

  it('has sufficiently large multiple-select choice pools and multiple grounded answers', () => {
    const expectedCorrectCounts = [4, 5, 6, 4, 5];
    for (const [index, stage] of chapterTwoCase.stages.entries()) {
      expect(stage.choices.length).toBeGreaterThanOrEqual(index === 0 ? 20 : 16);
      expect(stage.choices.filter((choice) => choice.correct)).toHaveLength(expectedCorrectCounts[index]);
      for (const choice of stage.choices) {
        expect(choice.label.length).toBeGreaterThanOrEqual(12);
        expect(choice.label.length).toBeLessThanOrEqual(22);
        expect(choice.explanation.length).toBeGreaterThan(15);
        expect(choice.evidenceIds.length).toBeGreaterThan(0);
      }
    }
  });

  it('keeps every evidence reference local to intro or a question in its own round', () => {
    for (const stage of chapterTwoCase.stages) {
      const validEvidence = new Set(['intro', ...stage.questions.map((question) => question.id)]);
      for (const choice of stage.choices) {
        expect(choice.evidenceIds.every((evidenceId) => validEvidence.has(evidenceId))).toBe(true);
      }
    }
  });

  it('makes every scored answer available within the five-question allowance', () => {
    for (const stage of chapterTwoCase.stages) {
      const coverage = coreCoverage[stage.id];
      expect(coverage).toBeDefined();
      expect(coverage.questions.length).toBeLessThanOrEqual(chapterTwoCase.questionLimit);
      const available = new Set([...coverage.questions, 'intro']);
      const correctChoices = stage.choices.filter((choice) => choice.correct);
      expect(correctChoices.map(({ id }) => id).sort()).toEqual([...coverage.choices].sort());
      expect(correctChoices.every((choice) => choice.evidenceIds.some((id) => available.has(id)))).toBe(true);
    }
  });

  it('includes three non-live-AI examples, five blueprint work layers, and a useful glossary', () => {
    const ideas = chapterTwoCase.stages.find((stage) => stage.id === 'ideas')!;
    expect(ideas.aiIdeas).toHaveLength(3);
    expect(ideas.choices.filter((choice) => choice.kind === 'proposal').map((choice) => choice.id)).toEqual(['ideas-c01', 'ideas-c05', 'ideas-c06']);
    expect(ideas.choices.find((choice) => choice.id === 'ideas-c01')?.correct).toBe(true);
    expect(ideas.choices.filter((choice) => choice.kind === 'proposal' && choice.correct)).toHaveLength(1);
    expect(ideas.aiIdeas!.map(({ title }) => title)).toEqual([
      '示範 A｜白話體驗導航頁', '示範 B｜新手參觀時段', '示範 C｜人工短諮詢',
    ]);
    const blueprint = chapterTwoCase.stages.find((stage) => stage.id === 'blueprint')!;
    for (const layer of ['顧客', '前台', '後台', '支援', '異常']) {
      expect(blueprint.choices.some((choice) => choice.label.includes(layer) || choice.explanation.includes(layer))).toBe(true);
    }
    expect(chapterTwoCase.glossary.length).toBeGreaterThanOrEqual(8);
    for (const term of ['Persona', 'Journey', 'Blueprint']) {
      expect(chapterTwoCase.glossary.some((item) => item.name === term)).toBe(true);
    }
  });
});
