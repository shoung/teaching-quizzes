import { describe, expect, it } from 'vitest';
import { isWalkable, moveWithinOffice, officeTargets, planWalk } from './navigation';

describe('辦公室走道與目標路徑', () => {
  it('能從玩家起點走到四位同事附近，全路段不穿桌椅', () => {
    for (const target of Object.values(officeTargets)) {
      const path = planWalk({ x: .5, z: 2.6 }, target.approach)!;
      expect(path.length).toBeGreaterThan(1);
      expect(path.at(-1)).toEqual(target.approach);
      path.forEach((point, index) => {
        expect(isWalkable(point)).toBe(true);
        if (!index) return;
        const previous = path[index - 1];
        for (let t = 0; t <= 1; t += .05) expect(isWalkable({ x: previous.x + (point.x - previous.x) * t, z: previous.z + (point.z - previous.z) * t })).toBe(true);
      });
    }
  });
  it('牆外、桌面、非法座標不能走入，方向移動也不會穿越障礙', () => {
    for (const point of [{x:50,z:0},{x:NaN,z:0},{x:-7,z:-5},{x:6,z:-5}]) {
      expect(isWalkable(point)).toBe(false);
      expect(planWalk({x:.5,z:2.6},point)).toBeNull();
    }
    expect(moveWithinOffice({x:0,z:0},-3,0)).toEqual({x:0,z:0});
    expect(moveWithinOffice({x:0,z:0},.3,.3)).toEqual({x:.3,z:.3});
  });
  it('貼近桌角的合法位置不會被網格取整困住', () => {
    const start={x:-1.65,z:0};
    expect(isWalkable(start)).toBe(true);
    for(const target of Object.values(officeTargets)) expect(planWalk(start,target.approach)).not.toBeNull();
  });
});
