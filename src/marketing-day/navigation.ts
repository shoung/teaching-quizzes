import type { MarketingNpcId } from '../types';

export interface WalkPoint { x: number; z: number }
export type WalkDirection = 'up' | 'down' | 'left' | 'right';
export const officeTargets: Record<MarketingNpcId, { position: WalkPoint; approach: WalkPoint }> = {
  lead: { position: { x: 3.25, z: -3.7 }, approach: { x: 2, z: -3.1 } },
  designer: { position: { x: -6.9, z: -2.7 }, approach: { x: -5.8, z: -2.25 } },
  media: { position: { x: -3.25, z: 3.05 }, approach: { x: -2.3, z: 3.5 } },
  analyst: { position: { x: 7.8, z: .25 }, approach: { x: 8.9, z: .1 } },
};

// Bounds include a small margin for the character, rather than only its center.
const bounds = { minX: -10.4, maxX: 10.4, minZ: -7.8, maxZ: 7.8 };
const obstacles = [
  [-8.8, -1.7, -5.95, -3.05], [-8.8, -1.7, -.15, 2.75],
  [3.15, 9.25, -7.15, -2.7], [4.35, 7.9, .2, 3.1],
  [5.25, 9.6, 6, 7.7], [-10.75, -8.85, 4, 5.5],
  [-10.5, -9, -8, -6.7], [9.2, 10.5, -8, -6.7], [9.25, 10.5, 5, 6.5],
];

export function isWalkable(point: WalkPoint): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.z)
    && point.x >= bounds.minX && point.x <= bounds.maxX && point.z >= bounds.minZ && point.z <= bounds.maxZ
    && !obstacles.some(([left, right, top, bottom]) => point.x >= left && point.x <= right && point.z >= top && point.z <= bottom);
}

export function moveWithinOffice(point: WalkPoint, dx: number, dz: number): WalkPoint {
  const distance = Math.hypot(dx, dz);
  if (!Number.isFinite(distance)) return point;
  const steps = Math.max(1, Math.ceil(distance / .15));
  let next = { ...point };
  for (let i = 0; i < steps; i++) {
    const candidate = { x: next.x + dx / steps, z: next.z + dz / steps };
    if (!isWalkable(candidate)) return point;
    next = candidate;
  }
  return { x: point.x + dx, z: point.z + dz };
}

export function planWalk(start: WalkPoint, end: WalkPoint): WalkPoint[] | null {
  if (!isWalkable(start) || !isWalkable(end)) return null;
  const step = .3;
  const cols = Math.floor((bounds.maxX - bounds.minX) / step) + 1;
  const rows = Math.floor((bounds.maxZ - bounds.minZ) / step) + 1;
  const cell = (p: WalkPoint) => [Math.round((p.x - bounds.minX) / step), Math.round((p.z - bounds.minZ) / step)];
  const world = (key: number) => ({ x: bounds.minX + (key % cols) * step, z: bounds.minZ + Math.floor(key / cols) * step });
  function nearestAccessibleCell(point: WalkPoint) {
    const [cx,cz]=cell(point);
    let best: number|null=null, distance=Infinity;
    for(let x=Math.max(0,cx-3);x<=Math.min(cols-1,cx+3);x++) {
      for(let z=Math.max(0,cz-3);z<=Math.min(rows-1,cz+3);z++) {
        const key=z*cols+x, candidate=world(key);
        if(!isWalkable(candidate))continue;
        const moved=moveWithinOffice(point,candidate.x-point.x,candidate.z-point.z);
        if(Math.hypot(moved.x-candidate.x,moved.z-candidate.z)>1e-6)continue;
        const length=Math.hypot(candidate.x-point.x,candidate.z-point.z);
        if(length<distance){distance=length;best=key;}
      }
    }
    return best;
  }
  const first=nearestAccessibleCell(start), last=nearestAccessibleCell(end);
  if(first===null||last===null)return null;
  const ex=last%cols,ez=Math.floor(last/cols);
  const open = new Set([first]); const cost = new Map([[first, 0]]); const parent = new Map<number, number>();
  const estimate = (key: number) => Math.abs(key % cols - ex) + Math.abs(Math.floor(key / cols) - ez);
  while (open.size) {
    let current = -1; let best = Infinity;
    for (const key of open) { const score = cost.get(key)! + estimate(key); if (score < best) { current = key; best = score; } }
    if (current === last) {
      const keys = [current];
      while (parent.has(keys[0])) keys.unshift(parent.get(keys[0])!);
      const path = [start, ...keys.map(world), end];
      // Grid rounding must not introduce a diagonal corner through furniture.
      for (let i = 1; i < path.length; i++) {
        const moved = moveWithinOffice(path[i - 1], path[i].x - path[i - 1].x, path[i].z - path[i - 1].z);
        if (Math.hypot(moved.x-path[i].x,moved.z-path[i].z)>1e-6) return null;
      }
      return path;
    }
    open.delete(current);
    const x = current % cols; const z = Math.floor(current / cols);
    for (const [nx, nz] of [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]]) {
      if (nx < 0 || nx >= cols || nz < 0 || nz >= rows) continue;
      const key = nz * cols + nx;
      if (!isWalkable(world(key))) continue;
      const nextCost = cost.get(current)! + 1;
      if (nextCost >= (cost.get(key) ?? Infinity)) continue;
      cost.set(key, nextCost); parent.set(key, current); open.add(key);
    }
  }
  return null;
}
