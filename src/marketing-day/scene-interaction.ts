import * as THREE from 'three';
import type { MarketingNpcId } from '../types';

export type OfficeSceneHit = { kind: 'actor'; actorId: MarketingNpcId } | { kind: 'blocked' } | { kind: 'miss' };
export type OfficeActorClick = 'current' | 'other' | 'world';

function isVisibleInScene(object: THREE.Object3D, scene: THREE.Object3D): boolean {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (!current.visible) return false;
    if (current === scene) return true;
    current = current.parent;
  }
  return false;
}

/** Raycast rendered geometry so child meshes are clickable and nearer scenery occludes actors. */
export function raycastOfficeActor(
  scene: THREE.Object3D,
  camera: THREE.Camera,
  ndc: THREE.Vector2,
  actors: Record<MarketingNpcId, THREE.Object3D>,
): OfficeSceneHit {
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(ndc, camera);
  const actorIds = new Map(Object.entries(actors).map(([id, object]) => [object, id as MarketingNpcId]));
  const intersections = raycaster.intersectObjects(scene.children, true).filter(hit => isVisibleInScene(hit.object, scene));
  if (!intersections.length) return { kind: 'miss' };

  let object: THREE.Object3D | null = intersections[0].object;
  while (object && object !== scene) {
    const actorId = actorIds.get(object);
    if (actorId) return { kind: 'actor', actorId };
    object = object.parent;
  }
  return { kind: 'blocked' };
}

export function classifyOfficeActorClick(hit: OfficeSceneHit, targetId: MarketingNpcId): OfficeActorClick {
  if (hit.kind !== 'actor') return 'world';
  return hit.actorId === targetId ? 'current' : 'other';
}
