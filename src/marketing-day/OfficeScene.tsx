import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import type { MarketingNpcId } from '../types';
import { buildOffice } from './build-office';
import { moveWithinOffice, officeTargets, planWalk } from './navigation';
import type { WalkDirection, WalkPoint } from './navigation';
import { classifyOfficeActorClick, raycastOfficeActor } from './scene-interaction';

export interface OfficeControls {
  goToTarget: () => void;
  interact: () => void;
  stopWalking: () => void;
  step: (direction: WalkDirection) => void;
}
interface Props {
  onTalk?: () => void;
  onInteract?: () => void;
  forceFallback?: boolean;
  paused?: boolean;
  npcId?: MarketingNpcId;
  targetName?: string;
  onMovingChange?: (moving: boolean) => void;
  onKeyboardOpen?: () => void;
  onMovementInput?: () => void;
  onArrival?: () => void;
  onWorldClick?: (valid: boolean) => void;
}
const names: Record<MarketingNpcId, string> = {
  lead: '美玲｜行銷主管', designer: '小晴｜品牌設計', media: '阿哲｜廣告投放', analyst: '子安｜數據分析',
};
const directions: Record<WalkDirection, WalkPoint> = { up: {x:0,z:-1}, down:{x:0,z:1}, left:{x:-1,z:0}, right:{x:1,z:0} };

export default forwardRef<OfficeControls, Props>(function OfficeScene(props, ref) {
  const host = useRef<HTMLDivElement>(null);
  const playerLabel = useRef<HTMLSpanElement>(null);
  const targetLabel = useRef<HTMLSpanElement>(null);
  const live = useRef(props); live.current = props;
  const control = useRef<(OfficeControls & { wake: () => void; resetTarget: () => void }) | null>(null);
  const [status, setStatus] = useState<'loading'|'ready'|'failed'>('loading');
  const [hint, setHint] = useState('');
  const talkLocked = useRef(false);
  const npcId = props.npcId ?? 'lead';
  const talk = () => {
    if (live.current.paused || talkLocked.current) return;
    talkLocked.current = true;
    (live.current.onInteract ?? live.current.onTalk)?.();
  };

  useImperativeHandle(ref, () => ({
    goToTarget: () => control.current ? control.current.goToTarget() : talk(),
    interact: () => control.current ? control.current.interact() : talk(),
    stopWalking: () => control.current?.stopWalking(),
    step: direction => control.current?.step(direction),
  }), []);

  useEffect(() => {
    const container = host.current;
    if (!container || props.forceFallback) return;
    let renderer: THREE.WebGLRenderer | undefined;
    let office: ReturnType<typeof buildOffice> | undefined;
    let observer: ResizeObserver | undefined;
    let sun: THREE.DirectionalLight | undefined;
    let frame = 0, lastFrame = 0, disposed = false, wasMoving = false, staticShadowsReady = false;
    let path: WalkPoint[] = [], interactAtEnd = false;
    const keys = new Set<string>();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const target = () => officeTargets[live.current.npcId ?? 'lead'];
    const notifyMoving = (moving: boolean) => {
      if (moving !== wasMoving) { wasMoving = moving; live.current.onMovingChange?.(moving); }
    };
    const contextLost = (event: Event) => {
      event.preventDefault(); cancelAnimationFrame(frame); frame = 0; control.current = null;
      keys.clear(); notifyMoving(false); setStatus('failed');
    };
    let onKeyDown: ((e: KeyboardEvent) => void) | undefined;
    let onKeyUp: ((e: KeyboardEvent) => void) | undefined;
    let onBlur: (() => void) | undefined;
    let onVisibilityChange: (() => void) | undefined;
    let onClick: ((e: PointerEvent) => void) | undefined;
    try {
      renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'low-power', preserveDrawingBuffer:true});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3;
      renderer.domElement.setAttribute('aria-label', '行銷辦公室 3D 場景；也可使用「帶我去」與文字互動完成任務');
      renderer.domElement.setAttribute('role', 'img');
      renderer.domElement.addEventListener('webglcontextlost', contextLost);
      container.append(renderer.domElement);
      const scene = new THREE.Scene(); scene.background = new THREE.Color('#263c47');
      office = buildOffice();
      // The office is static; avoid rebuilding the 2048px shadow map for every walk frame.
      // Keep the player receiving scene shadows, but do not leave a stale cast shadow behind.
      office.player.traverse(object => { object.castShadow = false; });
      scene.add(office.room);
      scene.add(new THREE.HemisphereLight('#e2ede7', '#50636e', 2.5));
      sun = new THREE.DirectionalLight('#fff0d0', 3.2); sun.position.set(-8,18,6); sun.castShadow = true;
      sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left = -17; sun.shadow.camera.right = 17;
      sun.shadow.camera.top = 17; sun.shadow.camera.bottom = -17; sun.shadow.normalBias = .04; scene.add(sun);
      const fill = new THREE.DirectionalLight('#90b4cb',1.1); fill.position.set(9,8,-5); scene.add(fill);
      const camera = new THREE.PerspectiveCamera(39,1,.1,120);
      const point = () => ({ x: office!.player.position.x, z: office!.player.position.z });

      function draw() {
        if (disposed || !renderer || !office) return;
        const targetPosition = target().position;
        office.objective.position.set(targetPosition.x,3.35,targetPosition.z+.2);
        renderer.render(scene,camera);
        if (!staticShadowsReady) {
          renderer.shadowMap.autoUpdate = false;
          staticShadowsReady = true;
        }
        const anchors: [HTMLSpanElement|null, THREE.Vector3][] = [
          [playerLabel.current,office.player.position.clone().add(new THREE.Vector3(0,2.4,0))],
          [targetLabel.current,new THREE.Vector3(targetPosition.x,2.55,targetPosition.z)],
        ];
        anchors.forEach(([element, position]) => {
          if (!element) return;
          const p = position.project(camera);
          element.style.left = `${(p.x+1)/2*container!.clientWidth}px`;
          element.style.top = `${(-p.y+1)/2*container!.clientHeight}px`;
        });
      }
      function wake() { if (!frame && !disposed && !live.current.paused && !document.hidden) frame = requestAnimationFrame(tick); }
      function tick(now: number) {
        frame = 0;
        if (disposed || !office || live.current.paused || document.hidden) { keys.clear(); notifyMoving(false); lastFrame = 0; return; }
        const dt = lastFrame ? Math.min((now-lastFrame)/1000,.12) : .016; lastFrame = now;
        let dx = 0, dz = 0;
        const before=point();
        if (keys.has('w')||keys.has('arrowup')) dz--;
        if (keys.has('s')||keys.has('arrowdown')) dz++;
        if (keys.has('a')||keys.has('arrowleft')) dx--;
        if (keys.has('d')||keys.has('arrowright')) dx++;
        if (dx || dz) {
          path = []; interactAtEnd = false;
          const length = Math.hypot(dx,dz); dx=dx/length*4*dt; dz=dz/length*4*dt;
          const moved = moveWithinOffice(point(),dx,dz);
          office.player.position.set(moved.x,0,moved.z);
          office.player.rotation.y = Math.atan2(dx,dz);
        } else if (path.length) {
          const p = point(), next = path[0], distance = Math.hypot(next.x-p.x,next.z-p.z);
          if (distance < .07) path.shift();
          else {
            const amount = Math.min(4*dt,distance);
            office.player.position.set(p.x+(next.x-p.x)/distance*amount,0,p.z+(next.z-p.z)/distance*amount);
            office.player.rotation.y = Math.atan2(next.x-p.x,next.z-p.z);
          }
        }
        const after=point();
        const moved=Math.hypot(after.x-before.x,after.z-before.z)>.002;
        const moving = moved || (path.length>0 && wasMoving);
        if (!reduced.matches && moving) office.player.position.y = Math.abs(Math.sin(now*.012))*.045;
        else office.player.position.y = 0;
        notifyMoving(moving); draw();
        if (!path.length && interactAtEnd) { interactAtEnd = false; live.current.onArrival?.(); talk(); }
        if (path.length || keys.size) wake(); else lastFrame = 0;
      }
      function walkTo(end: WalkPoint, interact: boolean): boolean {
        if (live.current.paused) return false;
        const planned = planWalk(point(),end);
        if (!planned) { setHint('這裡有桌椅，換個位置，或按「帶我去」。'); return false; }
        setHint(''); keys.clear(); path=planned; interactAtEnd=interact; wake();return true;
      }
      function stopWalking() {
        if (frame) cancelAnimationFrame(frame);
        frame=0;lastFrame=0;path=[];interactAtEnd=false;keys.clear();notifyMoving(false);draw();
      }
      function interact() {
        if (live.current.paused) return;
        stopWalking();talk();
      }
      control.current = {
        goToTarget: () => walkTo(target().approach,true), interact, stopWalking, wake,
        step: direction => { const d=directions[direction],p=point(); walkTo({x:p.x+d.x*.9,z:p.z+d.z*.9},false); },
        resetTarget: stopWalking,
      };
      onKeyDown = event => {
        if (live.current.paused || event.altKey || event.metaKey || event.ctrlKey || (event.target instanceof HTMLElement && event.target.closest('input,textarea,select,dialog,[contenteditable]'))) return;
        const key=event.key.toLowerCase();
        if (['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright'].includes(key)) {event.preventDefault();if(!keys.has(key))live.current.onMovementInput?.();keys.add(key);wake();}
        if (!event.repeat && key==='g') {event.preventDefault();live.current.onMovementInput?.();control.current?.goToTarget();}
        if (!event.repeat && key==='e') {event.preventDefault();stopWalking();live.current.onKeyboardOpen?.();talk();}
      };
      onKeyUp = event => keys.delete(event.key.toLowerCase());
      onBlur = () => {keys.clear();notifyMoving(false);};
      onVisibilityChange = () => {
        if (document.hidden) {
          if (frame) cancelAnimationFrame(frame);
          frame=0;lastFrame=0;keys.clear();notifyMoving(false);
          return;
        }
        lastFrame=0;
        if (path.length) wake();
        else draw();
      };
      onClick = event => {
        if (live.current.paused) return;
        const rect=renderer!.domElement.getBoundingClientRect();
        const ndc = new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
        const actorHit = raycastOfficeActor(scene, camera, ndc, office!.actors);
        const actorClick = classifyOfficeActorClick(actorHit, live.current.npcId ?? 'lead');
        if (actorClick === 'current') {
          setHint('');
          const approach = target().approach, p = point();
          if (Math.hypot(p.x-approach.x,p.z-approach.z) <= .65) {
            live.current.onWorldClick?.(true); stopWalking(); talk();
          } else live.current.onWorldClick?.(walkTo(approach,true));
          return;
        }
        if (actorClick === 'other') {
          stopWalking();
          setHint(`這不是目前任務人物，請先找${live.current.targetName ?? names[live.current.npcId ?? 'lead']}。`);
          live.current.onWorldClick?.(false);
          return;
        }
        const hit=new THREE.Vector3();
        const ray=new THREE.Raycaster();ray.setFromCamera(ndc,camera);
        if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),hit)) {
          live.current.onWorldClick?.(walkTo({x:hit.x,z:hit.z},false));
        } else live.current.onWorldClick?.(false);
      };
      window.addEventListener('keydown',onKeyDown);window.addEventListener('keyup',onKeyUp);window.addEventListener('blur',onBlur);
      document.addEventListener('visibilitychange',onVisibilityChange);
      renderer.domElement.addEventListener('pointerup',onClick);
      const resize = () => {
        if (disposed || !renderer) return;
        const width=container.clientWidth,height=container.clientHeight;if(!width||!height)return;
        camera.aspect=width/height;
        const distance=camera.aspect<.8?1.42:camera.aspect<1.15?1.12:.94;
        camera.position.set(13*distance,20*distance,24*distance);camera.lookAt(.3,.3,-.6);camera.updateProjectionMatrix();
        renderer.setSize(width,height);draw();
      };
      observer=new ResizeObserver(resize);observer.observe(container);resize();setStatus('ready');
    } catch { control.current=null;setStatus('failed'); }
    return () => {
      disposed=true;control.current=null;cancelAnimationFrame(frame);observer?.disconnect();
      if(onKeyDown)window.removeEventListener('keydown',onKeyDown);if(onKeyUp)window.removeEventListener('keyup',onKeyUp);if(onBlur)window.removeEventListener('blur',onBlur);
      if(onVisibilityChange)document.removeEventListener('visibilitychange',onVisibilityChange);
      office?.dispose();sun?.shadow.dispose();
      if(renderer){if(onClick)renderer.domElement.removeEventListener('pointerup',onClick);renderer.domElement.removeEventListener('webglcontextlost',contextLost);renderer.dispose();renderer.domElement.remove();}
    };
  }, [props.forceFallback]);

  useEffect(() => { control.current?.resetTarget(); }, [npcId]);
  useEffect(() => { if (!props.paused) talkLocked.current = false; control.current?.wake(); }, [props.paused]);
  const fallback=props.forceFallback||status==='failed';
  return <div className="md-scene" aria-busy={!fallback&&status==='loading'}>
    <div ref={host} className="md-scene-canvas" hidden={fallback}/>
    {!fallback&&status==='ready'&&<div className="md-scene-labels"><span ref={targetLabel} className="md-world-label">{props.targetName??names[npcId]}</span><span ref={playerLabel} className="md-world-label md-world-player">你｜行銷企劃</span></div>}
    {!fallback&&status==='loading'&&<div className="md-scene-status" role="status"><span className="md-loading-block"/><p>辦公室準備中</p></div>}
    {fallback&&<div className="md-scene-status md-scene-fallback"><span className="md-fallback-icon" aria-hidden="true">▦</span><h2>用文字繼續這一天</h2><p>3D 場景暫時無法顯示。<br/>一樣可以完成本章的對話、決策與回顧。</p><button className="md-primary" disabled={props.paused} onClick={talk}>繼續目前任務 →</button></div>}
    {hint&&<p className="md-walk-hint" role="status">{hint}</p>}
  </div>;
});
