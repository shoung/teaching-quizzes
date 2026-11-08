import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { classifyOfficeActorClick, raycastOfficeActor } from './scene-interaction';

function actorAt(x: number) {
  const actor = new THREE.Group();
  actor.position.x = x;
  actor.add(new THREE.Mesh(new THREE.BoxGeometry(2, 2, 1), new THREE.MeshBasicMaterial()));
  return actor;
}

describe('office scene actor picking', () => {
  it('hits a nested actor mesh and distinguishes the current task from another NPC', () => {
    const scene = new THREE.Scene();
    const lead = actorAt(0), designer = actorAt(5);
    scene.add(lead, designer);
    const camera = new THREE.PerspectiveCamera(50, 1, .1, 100);
    camera.position.set(0, 0, 10); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
    scene.updateMatrixWorld(true);
    const hit = raycastOfficeActor(scene, camera, new THREE.Vector2(0, 0), { lead, designer, media: new THREE.Group(), analyst: new THREE.Group() });
    expect(hit).toEqual({ kind: 'actor', actorId: 'lead' });
    expect(classifyOfficeActorClick(hit, 'lead')).toBe('current');
    expect(classifyOfficeActorClick({ kind: 'actor', actorId: 'designer' }, 'lead')).toBe('other');
    expect(classifyOfficeActorClick({ kind: 'miss' }, 'lead')).toBe('world');
  });

  it('does not pick an actor through nearer scene geometry', () => {
    const scene = new THREE.Scene();
    const lead = actorAt(0); scene.add(lead);
    const desk = new THREE.Mesh(new THREE.BoxGeometry(3, 3, .5), new THREE.MeshBasicMaterial());
    desk.position.z = 3; scene.add(desk);
    const camera = new THREE.PerspectiveCamera(50, 1, .1, 100);
    camera.position.set(0, 0, 10); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
    scene.updateMatrixWorld(true);
    expect(raycastOfficeActor(scene, camera, new THREE.Vector2(0, 0), { lead, designer: new THREE.Group(), media: new THREE.Group(), analyst: new THREE.Group() })).toEqual({ kind: 'blocked' });
  });

  it('ignores a hidden nearer occluder when picking a visible actor', () => {
    const scene = new THREE.Scene();
    const lead = actorAt(0); scene.add(lead);
    const hiddenDesk = new THREE.Mesh(new THREE.BoxGeometry(3, 3, .5), new THREE.MeshBasicMaterial());
    hiddenDesk.position.z = 3; hiddenDesk.visible = false; scene.add(hiddenDesk);
    const camera = new THREE.PerspectiveCamera(50, 1, .1, 100);
    camera.position.set(0, 0, 10); camera.lookAt(0, 0, 0); camera.updateMatrixWorld(); scene.updateMatrixWorld(true);
    expect(raycastOfficeActor(scene, camera, new THREE.Vector2(0, 0), { lead, designer: new THREE.Group(), media: new THREE.Group(), analyst: new THREE.Group() })).toEqual({ kind: 'actor', actorId: 'lead' });
  });

  it('does not pick an actor beneath a hidden ancestor', () => {
    const scene = new THREE.Scene();
    const hiddenGroup = new THREE.Group(); hiddenGroup.visible = false;
    const lead = actorAt(0); hiddenGroup.add(lead); scene.add(hiddenGroup);
    const camera = new THREE.PerspectiveCamera(50, 1, .1, 100);
    camera.position.set(0, 0, 10); camera.lookAt(0, 0, 0); camera.updateMatrixWorld(); scene.updateMatrixWorld(true);
    expect(raycastOfficeActor(scene, camera, new THREE.Vector2(0, 0), { lead, designer: new THREE.Group(), media: new THREE.Group(), analyst: new THREE.Group() })).toEqual({ kind: 'miss' });
  });
});
