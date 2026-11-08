import { describe, expect, it } from 'vitest';
import { salonDecisionBriefs, salonPrologue } from './paris-salon-story';
import { salonGame } from './paris-salon';

describe('巴黎沙龍故事與決策提示', () => {
  it('用四段開場交代克萊兒、藝術之夜目標、未來手帳與首批受眾訪談', () => {
    expect(salonPrologue).toHaveLength(4);
    expect(salonPrologue.map(beat => beat.id)).toEqual(['salon-opening-1', 'salon-opening-2', 'salon-opening-3', 'salon-opening-4']);
    expect(salonPrologue[0].text).toMatch(/1900.*巴黎.*克萊兒.*畫.*茶.*來客.*藝術之夜/);
    expect(salonPrologue[1].text).toMatch(/100點.*36/);
    expect(salonPrologue[1].text).toMatch(/兩週.*28.*70/);
    expect(salonPrologue[1].text).toMatch(/信任.*60/);
    expect(salonPrologue[1].text).toMatch(/接待.*60/);
    expect(salonPrologue[2].text).toMatch(/2026.*先聽需求.*小量驗證.*安排資源/);
    expect(salonPrologue[3].speaker).toBe('露易絲');
    expect(salonPrologue[3].text).toMatch(/三組訪談.*先聽.*受眾/);

    for (const beat of salonPrologue) {
      expect(beat.title.trim()).not.toBe('');
      expect(beat.speaker.trim()).not.toBe('');
      expect(beat.text.length).toBeLessThanOrEqual(100);
      expect(beat.npc).toBeGreaterThanOrEqual(0);
      expect(beat.npc).toBeLessThanOrEqual(6);
      expect(['salon', 'study', 'print', 'cafe']).toContain(beat.place);
    }
  });

  it('為十二題的每個原選項提供精簡、可回扣證據的學習提示', () => {
    expect(Object.keys(salonDecisionBriefs).sort()).toEqual(salonGame.decisions.map(decision => decision.id).sort());

    for (const decision of salonGame.decisions) {
      const brief = salonDecisionBriefs[decision.id];
      expect(brief.setup.trim()).not.toBe('');
      expect(brief.setup.length).toBeLessThanOrEqual(85);
      expect(brief.objective.trim()).not.toBe('');
      expect(brief.objective.length).toBeLessThanOrEqual(40);
      expect(brief.clues.length).toBeGreaterThanOrEqual(2);
      expect(brief.clues.length).toBeLessThanOrEqual(3);
      expect(brief.principle.title.trim()).not.toBe('');
      expect(brief.principle.text.length).toBeLessThanOrEqual(45);
      for (const clue of brief.clues) {
        expect(clue.label.trim()).not.toBe('');
        expect(clue.text.trim()).not.toBe('');
        expect(clue.label.length).toBeLessThanOrEqual(75);
        expect(clue.text.length).toBeLessThanOrEqual(75);
      }

      expect(Object.keys(brief.options).sort()).toEqual(decision.options.map(option => option.id).sort());
      for (const option of decision.options) {
        const teaching = brief.options[option.id];
        expect(teaching.basis.trim()).not.toBe('');
        expect(teaching.tradeoff.trim()).not.toBe('');
        expect(teaching.outcome.trim()).not.toBe('');
        expect(teaching.lesson.trim()).not.toBe('');
        expect(teaching.basis.length).toBeLessThanOrEqual(45);
        expect(teaching.tradeoff.length).toBeLessThanOrEqual(45);
        expect(teaching.outcome.length).toBeLessThanOrEqual(65);
        expect(teaching.lesson.length).toBeLessThanOrEqual(70);
        expect(teaching.outcome.trim()).not.toBe('');
        expect(teaching.lesson.trim()).not.toBe('');
      }
    }
  });

  it('讓當晚協調先於隔日回訪，依故事時序而非 canonical ID 排序', () => {
    expect(salonDecisionBriefs['salon-11'].setup).toMatch(/^克萊兒，當晚交流途中/);
    expect(salonDecisionBriefs['salon-10'].setup).toMatch(/^克萊兒，隔天清晨/);
  });

  it('保留題目中會改變判斷的樣本分母、抽查界線、容量鎖定與因果限制', () => {
    const q5 = salonDecisionBriefs['salon-05'].clues.map(clue => clue.text).join(' ');
    expect(q5).toMatch(/各寄100封/);
    expect(q5).toMatch(/20%/);
    expect(q5).toMatch(/12%/);
    expect(q5).toMatch(/回函不等於到場/);

    const q8 = salonDecisionBriefs['salon-08'].clues.map(clue => clue.text).join(' ');
    expect(q8).toMatch(/獨立抽查/);
    expect(q8).toMatch(/六筆/);
    expect(q8).toMatch(/4人/);
    expect(q8).toMatch(/不.*總名單|不是.*總名單/);
    expect(q8).toMatch(/36/);

    const q9 = salonDecisionBriefs['salon-09'].clues.map(clue => clue.text).join(' ');
    expect(q9).toMatch(/兩位助手/);
    expect(q9).toMatch(/36席/);
    expect(q9).toMatch(/有效確認.*信任.*準備.*到場/);
    expect(q9).toMatch(/回訪.*不能改寫.*今晚人數/);
    expect(q9).toMatch(/候補不直接算入/);

    const q11 = salonDecisionBriefs['salon-11'].clues.map(clue => clue.text).join(' ');
    expect(q11).toMatch(/20分鐘/);
    expect(q11).toMatch(/25點/);
    expect(q11).toMatch(/到場.*不變|不變.*到場/);

    const q10 = salonDecisionBriefs['salon-10'].clues.map(clue => clue.text).join(' ');
    expect(q10).toMatch(/同意回訪/);
    expect(q10).toMatch(/今晚到場.*結算/);
    expect(q10).toMatch(/回訪.*不改.*出席/);
    expect(q10).not.toMatch(/真實姓名|個資|應用程式/);

    const q12 = salonDecisionBriefs['salon-12'].clues.map(clue => clue.text).join(' ');
    expect(q12).toMatch(/沒有對照組/);
    expect(q12).toMatch(/因果/);
    expect(q12).toMatch(/保證/);
    expect(q12).toMatch(/已鎖定.*到場|到場.*已鎖定/);
  });
});
