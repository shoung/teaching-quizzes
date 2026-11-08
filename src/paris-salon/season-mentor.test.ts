import { describe, expect, it } from 'vitest';
import { initialSeason, replaySeason } from './season-engine';
import { getMentorAdvice } from './season-mentor';
import type { SeasonReplay } from './season-types';
const fresh = () => replaySeason([])!;
describe('路易斯依經營結果提供引導', () => {
  it('新手先認識自由配置與四個準備時段', () => {
    expect(getMentorAdvice(initialSeason(), fresh())).toContain('四個');
  });
  it('現金不足時說明恢復選項，不強迫增加宣傳', () => {
    const replay = fresh(); replay.assets.cash = 3;
    expect(getMentorAdvice(initialSeason(), replay)).toContain('3');
    expect(getMentorAdvice(initialSeason(), replay)).toContain('免費小聚');
  });
  it('接待過載的具體數字連結人手與規模取捨', () => {
    const replay = replaySeason([{ audience: 'creators', theme: 'workshop', scale: 'grand', actions: ['promotion'] }])!;
    const advice = getMentorAdvice({ ...initialSeason(), started: true, plans: replay.events.map(e => e.plan), acknowledged: 1 }, replay);
    expect(advice).toContain(String(replay.events[0].attendance));
    expect(advice).toMatch(/人手|助手/);
    expect(advice).toContain('規模');
  });
  it('最後一場提醒有限投資回收期間', () => {
    const replay = { ...fresh(), events: [] } as SeasonReplay;
    const session = { ...initialSeason(), plans: Array.from({ length: 5 }, () => initialSeason().draft) };
    replay.assets.cash = 3;
    expect(getMentorAdvice(session, replay)).toContain('最後一場');
    expect(getMentorAdvice(session, replay)).not.toContain('等一等');
  });
});
