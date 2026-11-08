import { describe, expect, it } from 'vitest';
import { initialSeason, replaySeason } from './season-engine';
import { getMentorAdvice } from './season-mentor';
import type { SeasonReplay } from './season-types';
const fresh = () => replaySeason([])!;
describe('路易斯依經營結果提供引導', () => {
  it('以實際接待結果說明知名度升降，不把宣傳當保證', () => {
    const good = replaySeason([{ ...initialSeason().draft }])!;
    const bad = replaySeason([{ ...initialSeason().draft, scale: 'grand', actions: ['promotion'] }])!;
    const goodSession = { ...initialSeason(), plans: good.events.map(event => event.plan), acknowledged: 1 };
    const badSession = { ...initialSeason(), plans: bad.events.map(event => event.plan), acknowledged: 1 };
    expect(getMentorAdvice(goodSession, good)).toContain('知名度由 50 升至 53');
    expect(getMentorAdvice(badSession, bad)).toContain('知名度由 50 降至 47');
  });

  it('新手先認識依助手人數分配工作', () => {
    expect(getMentorAdvice(initialSeason(), fresh())).toContain('助手人數');
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
