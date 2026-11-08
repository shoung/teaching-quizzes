import { describe, expect, it } from 'vitest';
import { seasonMarkets } from './paris-salon-season';
import { getEndingDialogue, getEventVoices, getNpcConversation, getOpeningDialogue, metricHelp, seasonScenes } from './paris-salon-rpg';
import type { ConversationContext, SalonNpcId } from '../paris-salon/rpg-types';
import type { SeasonEvent } from '../paris-salon/season-types';

const expected = [
  [5, 2, 1], [5, 4, 6], [5, 3, 2], [5, 4, 1], [5, 2, 6], [5, 3, 1],
];
const context: ConversationContext = {
  assets: { cash: 44, regulars: 7, reputation: 62, awareness: 51, seats: 24, training: 1, ambience: 0, insight: 0, tested: false },
  previous: { number: 2, plan: { audience: 'enthusiasts', theme: 'exhibition', scale: 'standard', actions: [] },
    before: { cash: 45, regulars: 7, reputation: 62, awareness: 51, seats: 24, training: 1, ambience: 0, insight: 0, tested: false },
    after: { cash: 44, regulars: 7, reputation: 62, awareness: 51, seats: 24, training: 1, ambience: 0, insight: 0, tested: false },
    reach: 20, inquiries: 16, reservations: 12, attendance: 12, waiting: 2, returning: 4, newGuests: 8, retained: 5, newRegulars: 2,
    satisfaction: 70, awarenessChange: -1, safeCapacity: 10, seatCapacity: 24, income: { support: 0, members: 0, sponsor: 0, total: 0 },
    costs: { base: 0, actions: 0, total: 0 }, profit: 0, notes: [], lessons: [] },
};

describe('Paris salon RPG story data', () => {
  it('has six rounds with exactly the intended three-person cast and different depths', () => {
    expect(seasonScenes.map((scene) => scene.number)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(seasonScenes.map((scene) => scene.npcs.map(({ id }) => id))).toEqual(expected);
    for (const scene of seasonScenes) {
      expect(new Set(scene.npcs.map(({ id }) => id)).size).toBe(3);
      expect(scene.npcs.every((npc) => [40, 63, 83].includes(npc.x) && [78, 89, 81].includes(npc.y))).toBe(true);
      expect(new Set(scene.npcs.map(({ facing }) => facing)).size).toBe(2);
    }
    const roles = new Map(seasonScenes.flatMap(({ npcs }) => npcs.map(({ id, role }) => [id, role] as const)));
    expect([...roles]).toEqual([[5, '沙龍主人'], [2, '藝文寫作者'], [1, '沙龍管家'], [4, '新銳畫家'], [6, '潛在支持者'], [3, '印刷店經營者']]);
    expect(new Set(seasonScenes.map(({ place }) => place))).toEqual(new Set(['salon', 'study', 'print', 'cafe']));
  });

  it('covers every present NPC with oral, partial clues and appropriately sized pages', () => {
    const guestTotals: { round: number; npc: number; total: number }[] = [];
    for (let event = 1; event <= 6; event++) {
      for (const npc of seasonScenes[event - 1].npcs) {
        const conversation = getNpcConversation(event, npc.id, context);
        expect(conversation.lines.length).toBeGreaterThanOrEqual(10);
        expect(conversation.lines.every(({ text }) => text.length <= 42)).toBe(true);
        expect(conversation.lines.map(({ text }) => text).join(' ')).not.toMatch(/不是|而是|不等於|不代表|還得看|不能只|別把|不只是|不表示/);
        expect(conversation.clue.length).toBeGreaterThan(0);
        const npcLines = conversation.lines.filter(({ portrait }) => portrait === npc.id);
        expect(npcLines.length).toBeGreaterThanOrEqual(10);
        expect(conversation.lines.some(({ portrait }) => portrait === 0)).toBe(true);
        expect(new Set(npcLines.map(({ text }) => text)).size).toBe(npcLines.length);
        expect(npcLines.map(({ text }) => text).join(' ')).not.toMatch(/\d+\s*(?:點|分|席|階)|舒適量/);
        if (npc.id === 5) expect(npcLines.reduce((sum, { text }) => sum + text.length, 0)).toBeGreaterThanOrEqual(300);
        else guestTotals.push({ round: event, npc: npc.id, total: npcLines.reduce((sum, { text }) => sum + text.length, 0) });
      }
    }
    expect(guestTotals.filter(({ total }) => total < 180)).toEqual([]);
    const mentorContexts = [
      { assets: context.assets },
      context,
      { ...context, previous: { ...context.previous!, waiting: 0, attendance: 13, safeCapacity: 10 } },
      { ...context, previous: { ...context.previous!, waiting: 0, attendance: 9, safeCapacity: 12, satisfaction: 50 } },
      { ...context, previous: { ...context.previous!, waiting: 0, attendance: 8, safeCapacity: 12, satisfaction: 72 } },
    ];
    for (let round = 1; round <= 6; round++) for (const mentorContext of mentorContexts) {
      const mentorLines = getNpcConversation(round, 5, mentorContext).lines;
      expect(mentorLines.every(({ text }) => text.length <= 42)).toBe(true);
      expect(mentorLines.filter(({ portrait }) => portrait === 5).reduce((sum, { text }) => sum + text.length, 0)).toBeGreaterThanOrEqual(300);
    }
  });

  it('keeps conversations inaccessible for absent guests and aligns their clue to the round market', () => {
    const marketPhrases = ['新畫', '散場', '街坊', '新作', '朋友', '帶朋友'];
    for (let event = 1; event <= 6; event++) {
      const expectedMarketNpc = seasonMarkets[event - 1].preferred === 'creators' ? 1
        : seasonMarkets[event - 1].preferred === 'enthusiasts' ? 6 : 3;
      expect(seasonScenes[event - 1].npcs.map(({ id }) => id)).toContain(expectedMarketNpc);
      const keyVoice = getNpcConversation(event, expectedMarketNpc as SalonNpcId, context);
      expect(keyVoice.lines.map(({ text }) => text).join(' ')).toContain(marketPhrases[event - 1]);
      expect(keyVoice.clue.length).toBeGreaterThan(0);
      for (const npc of seasonScenes[event - 1].npcs) {
        if (npc.id === 5) continue;
        const heard = getNpcConversation(event, npc.id as SalonNpcId, context);
        expect(heard.clue.length).toBeGreaterThan(0);
        expect(heard.lines.map(({ text }) => text).join(' ')).not.toMatch(/STP|Segmentation|Targeting|Positioning|\bcreators\b|\benthusiasts\b|\bnewcomers\b/i);
        expect(() => getNpcConversation(event, ( [1, 2, 3, 4, 5, 6].find((id) => !seasonScenes[event - 1].npcs.some((entry) => entry.id === id)) as SalonNpcId), context)).toThrow();
      }
    }
  });

  it('gives each mentor round different material and reacts honestly to a difficult season', () => {
    const rounds = seasonScenes.map(({ number }) => getNpcConversation(number, 5, context).lines.filter(({ portrait }) => portrait === 5).map(({ text }) => text));
    expect(new Set(rounds.map(lines => lines[0])).size).toBe(6);
    for (let index = 1; index < rounds.length; index++) {
      const shared = rounds[index].filter(text => rounds[index - 1].includes(text));
      expect(shared.length / Math.min(rounds[index].length, rounds[index - 1].length)).toBeLessThan(0.5);
    }
    const difficultSeason = {
      assets: { ...context.assets, cash: 10, regulars: 0 },
      events: Array.from({ length: 6 }, (_, index) => ({ ...context.previous!, number: index + 1, satisfaction: 40, waiting: 0, attendance: 8, safeCapacity: 12 })),
    };
    const ending = getEndingDialogue(difficultSeason).map(({ text }) => text).join(' ');
    expect(ending).not.toMatch(/真熱鬧|聊得很開心|大家挺自在|\d+\s*(點|分|階)/);
    expect(ending).toContain('沒盡興');
    expect(ending).toContain('茶葉和工錢');
  });

  it('keeps intro, ending, event voices, and metric help grounded and concise', () => {
    expect(getOpeningDialogue().length).toBeGreaterThanOrEqual(6);
    expect(getOpeningDialogue().every(({ text }) => text.length <= 42)).toBe(true);
    const openingText = getOpeningDialogue().map(({ text }) => text).join(' ');
    expect(openingText).not.toMatch(/2026|未來手帳|圖書館|書架/);
    expect(openingText).not.toMatch(/不是|而是|不等於|不代表|還得看|不能只|別把|不只是|不表示/);
    const replay = { assets: context.assets, events: [] };
    expect(getEndingDialogue(replay).length).toBeGreaterThanOrEqual(8);
    expect(getEndingDialogue(replay).every(({ text }) => text.length <= 42)).toBe(true);
    const event = context.previous as SeasonEvent;
    expect(Object.values(getEventVoices(event)).every((text) => text.length <= 65)).toBe(true);
    const cappedGain = { ...event, waiting: 0, attendance: 8, safeCapacity: 12, before: { ...event.before, awareness: 100 }, after: { ...event.after, awareness: 100 }, awarenessChange: 3 };
    const cappedLoss = { ...event, waiting: 0, attendance: 8, safeCapacity: 12, before: { ...event.before, awareness: 0 }, after: { ...event.after, awareness: 0 }, awarenessChange: -3 };
    expect(getEventVoices(cappedGain).assistant).toContain('和上回差不多');
    expect(getEventVoices(cappedLoss).assistant).toContain('和上回差不多');
    expect(getEventVoices({ ...event, waiting: 3 }).next).toContain('座位和人手');
    expect(getEventVoices({ ...event, waiting: 0, attendance: 14, safeCapacity: 10 }).next).toContain('助手');
    expect(getEventVoices({ ...event, waiting: 0, attendance: 8, safeCapacity: 12, after: { ...event.after, cash: 10 } }).next).toContain('茶葉錢');
    expect(getEventVoices({ ...event, satisfaction: 50, waiting: 0, attendance: 8, safeCapacity: 12 }).next).toContain('客人');
    const crowdedCampaign = { ...event, plan: { ...event.plan, audience: 'enthusiasts' as const, theme: 'exhibition' as const, scale: 'grand' as const, actions: ['promotion' as const] }, waiting: 0, attendance: 18, safeCapacity: 12 };
    expect(getEventVoices(crowdedCampaign).next).toContain('宣傳');
    expect(getEventVoices(crowdedCampaign).next).toContain('助手');
    const smallWait = { ...event, plan: { ...event.plan, scale: 'small' as const }, seatCapacity: 12, waiting: 3 };
    expect(getEventVoices(smallWait).next).toContain('小聚');
    expect(getEventVoices(smallWait).next).toContain('常設沙龍');
    const invested = { ...event, plan: { ...event.plan, actions: ['training' as const] }, after: { ...event.after, cash: 10 }, waiting: 0, attendance: 8, safeCapacity: 12 };
    expect(getEventVoices(invested).mentor).toContain('教助手');
    const marketMismatch = { ...event, number: 2, plan: { ...event.plan, audience: 'creators' as const, theme: 'workshop' as const }, waiting: 0, attendance: 8, safeCapacity: 12 };
    expect(getEventVoices(marketMismatch).mentor).toContain('創作者');
    const themeMismatch = { ...event, plan: { ...event.plan, audience: 'enthusiasts' as const, theme: 'workshop' as const }, waiting: 0, attendance: 8, safeCapacity: 12 };
    expect(getEventVoices(themeMismatch).mentor).toContain('動手改畫');
    expect(getEventVoices(themeMismatch).guest).toContain('作品的故事');
    const lowExperienceProfit = { ...themeMismatch, satisfaction: 55, profit: 8 };
    expect(getEventVoices(lowExperienceProfit).assistant).not.toMatch(/還有些餘錢|街坊提起/);
    expect(getEventVoices(lowExperienceProfit).assistant).toContain('客人');
    const adviceCases = [crowdedCampaign, smallWait, invested, marketMismatch, themeMismatch];
    expect(adviceCases.every((caseEvent) => Object.values(getEventVoices(caseEvent)).every((text) => text.length <= 65))).toBe(true);
    const allSpoken = [
      ...getOpeningDialogue().map(({ text }) => text),
      ...getEndingDialogue(replay).map(({ text }) => text),
      ...Object.values(getEventVoices(event)),
      ...adviceCases.flatMap((caseEvent) => Object.values(getEventVoices(caseEvent))),
    ].join(' ');
    expect(allSpoken).not.toMatch(/不是|而是|不等於|不代表|還得看|不能只|別把|不只是|不表示/);
    expect(Object.keys(metricHelp).sort()).toEqual(['ambience', 'awareness', 'cash', 'regulars', 'reputation', 'seats', 'training']);
  });
});
