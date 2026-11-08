import * as THREE from 'three';

// Original procedural scenery. This module contains no game or answer state.
export function buildOffice() {
  const room = new THREE.Group();
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const geometries: THREE.BufferGeometry[] = [];
  const textures: THREE.Texture[] = [];

  function material(color: string) {
    if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: .86 }));
    return materials.get(color)!;
  }
  function box(parent: THREE.Object3D, size: number[], at: number[], color: string) {
    const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, material(color));
    mesh.position.set(at[0], at[1], at[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function cylinder(parent: THREE.Object3D, radius: number, height: number, at: number[], color: string) {
    const geometry = new THREE.CylinderGeometry(radius, radius * .85, height, 8);
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, material(color));
    mesh.position.set(at[0], at[1], at[2]);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function sign(text: string, width: number, height: number, bg: string, fg: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 768; canvas.height = Math.round(768 * height / width);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = fg;
    ctx.font = `700 ${Math.round(canvas.height * .38)}px "PingFang TC", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2, canvas.width * .9);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    textures.push(texture);
    const geometry = new THREE.PlaneGeometry(width, height); geometries.push(geometry);
    const mat = new THREE.MeshBasicMaterial({ map: texture });
    const mesh = new THREE.Mesh(geometry, mat);
    room.add(mesh);
    return mesh;
  }
  function plant(x: number, z: number, scale = 1) {
    const group = new THREE.Group(); group.position.set(x, 0, z); group.scale.setScalar(scale);
    room.add(group);
    cylinder(group, .3, .55, [0, .28, 0], '#b19c87');
    box(group, [.12, .9, .12], [0, .95, 0], '#5a7155');
    [[0,1.5,0],[-.28,1.25,.03],[.24,1.15,.1],[.02,1.22,-.25]].forEach((at, i) => {
      const leaf = box(group, [.48, .48, .42], at, i % 2 ? '#647f64' : '#829a70');
      leaf.rotation.z = i % 2 ? .35 : -.25;
    });
  }
  function chair(x: number, z: number, angle = 0) {
    const g = new THREE.Group(); room.add(g); g.position.set(x,0,z); g.rotation.y = angle;
    box(g, [.72,.16,.66], [0,.65,0], '#45565c');
    box(g, [.72,.68,.12], [0,1.02,-.28], '#54666b');
    cylinder(g,.075,.5,[0,.3,0],'#3d4649');
    box(g,[.8,.08,.08],[0,.08,0],'#3d4649');
    box(g,[.08,.08,.7],[0,.08,0],'#3d4649');
  }
  function desk(x: number, z: number, accent: string, angle = 0) {
    const g = new THREE.Group(); room.add(g); g.position.set(x,0,z); g.rotation.y = angle;
    box(g,[3,.18,1.4],[0,1.18,0],'#d4d5cb');
    [-1.25,1.25].forEach(dx=>box(g,[.12,1.15,1.1],[dx,.57,0],'#77878a'));
    box(g,[1.15,.77,.09],[.1,1.92,-.3],'#293b44');
    box(g,[1.02,.63,.018],[.1,1.92,-.245],'#5c9a9c');
    box(g,[.13,.35,.12],[.1,1.42,-.29],'#47585c');
    box(g,[.55,.05,.4],[.1,1.3,-.18],'#47585c');
    box(g,[.9,.04,.31],[.1,1.3,.33],'#7a898a');
    box(g,[.15,.035,.22],[.83,1.3,.34],'#47585c');
    box(g,[.42,.04,.58],[-.98,1.3,.15],accent);
    box(g,[.34,.012,.48],[-.98,1.33,.15],'#e7e5d9');
    cylinder(g,.12,.25,[1.1,1.39,-.05],'#e3d2b4');
  }
  function person(x: number, z: number, shirt: string, hair: string, angle = 0) {
    const g = new THREE.Group(); room.add(g); g.position.set(x,0,z); g.rotation.y = angle;
    [-.15,.15].forEach(dx=>{
      box(g,[.22,.58,.24],[dx,.36,0],'#33424e');
      box(g,[.24,.16,.37],[dx,.1,.06],'#28343a');
    });
    box(g,[.64,.69,.37],[0,.98,0],shirt);
    [-.42,.42].forEach(dx=>{
      box(g,[.19,.5,.29],[dx,1.04,0],shirt);
      box(g,[.18,.21,.25],[dx,.7,.01],'#d9b59b');
    });
    box(g,[.23,.15,.23],[0,1.37,0],'#d9b59b');
    box(g,[.49,.48,.46],[0,1.65,.015],'#d9b59b');
    box(g,[.52,.15,.49],[0,1.94,-.015],hair);
    box(g,[.52,.3,.13],[0,1.75,-.2],hair);
    box(g,[.11,.25,.46],[-.22,1.8,-.015],hair);
    [-.1,.1].forEach(dx=>box(g,[.045,.055,.015],[dx,1.67,.255],'#394143'));
    box(g,[.11,.035,.018],[0,1.54,.255],'#a07b69');
    box(g,[.18,.25,.02],[.08,1.11,.2],'#e3e1d3');
    return g;
  }

  // Tile floor and two cutaway walls retain the reference game's readable geometry.
  box(room,[23,.35,18],[0,-.21,0],'#626f73');
  box(room,[22.7,.08,17.7],[0,.005,0],'#929e9e');
  for (let x=-11;x<=11;x+=1.5) box(room,[.025,.015,17.7],[x,.054,0],'#7f8e90');
  for (let z=-8.5;z<=8.5;z+=1.5) box(room,[22.7,.015,.025],[0,.055,z],'#7f8e90');
  box(room,[23,3.6,.22],[0,1.8,-8.9],'#9ba8a7');
  box(room,[.22,3.6,18],[-11.4,1.8,0],'#a9b2aa');
  box(room,[23,.13,.3],[0,.17,-8.72],'#586c71');
  box(room,[.3,.13,18],[-11.22,.17,0],'#586c71');
  for(let z=-7;z<7;z+=3.4) {
    box(room,[.08,2.15,2.7],[-11.24,2.15,z],'#637d86');
    box(room,[.025,1.95,2.5],[-11.185,2.15,z],'#b9d1cf');
    box(room,[.08,2.1,.06],[-11.12,2.15,z],'#728d91');
    box(room,[.08,.06,2.65],[-11.12,2.15,z],'#728d91');
  }

  // Quiet walkways separate workstations from the meeting area.
  box(room,[3.4,.018,14.6],[.4,.065,-.2],'#b8b7a7');
  [-1.37,2.17].forEach(x=>box(room,[.055,.022,14.6],[x,.08,-.2],'#ded2a0'));
  box(room,[7,.022,5.1],[6.3,.07,-4.7],'#7e9090');
  box(room,[6.6,.025,4.7],[6.3,.085,-4.7],'#7b8d8d');
  const floorTitle=sign('MARKETING  行銷部',6,.65,'#929e9e','#dce0d5');
  floorTitle.rotation.x=-Math.PI/2; floorTitle.position.set(-6,.08,6.8);

  // Brand wall and campaign board.
  const brand=sign('輕行  /  LIGHTLY',6.3,.8,'#314951','#e5e9db');
  brand.position.set(-5.9,2.55,-8.75);
  box(room,[4.8,2.3,.16],[6.2,2.2,-8.65],'#4a6268');
  box(room,[4.56,2.06,.06],[6.2,2.2,-8.54],'#d4dad0');
  const boardTitle=sign('新品活動 · 今日上線',4.1,.55,'#d4dad0','#3c565b');
  boardTitle.position.set(6.2,2.86,-8.49);
  for(let row=0;row<2;row++) for(let col=0;col<4;col++) {
    box(room,[.65,.4,.025],[4.75+col*.95,2.25-row*.6,-8.47],['#d5b27d','#a0b5a0','#c8a29b','#a7b9bb'][col]);
  }

  // Left-hand desk banks and designer's material rack.
  desk(-7,-5,'#a0acbf'); chair(-7,-3.65,Math.PI);
  desk(-3.5,-5,'#d69a7b'); chair(-3.5,-3.65,Math.PI);
  desk(-7,.8,'#b7ab95'); chair(-7,2.15,Math.PI);
  desk(-3.5,.8,'#739b8a'); chair(-3.5,2.15,Math.PI);
  box(room,[5.8,1.1,.16],[-5.3,1.8,-5.63],'#8f9e9c');
  for(let i=0;i<6;i++) box(room,[.25,.2,.04],[-7.3+i*.8,2,-5.52],['#c8b89a','#c6816b','#789f9a'][i%3]);
  box(room,[1.6,1.25,.7],[-9.8,.65,4.7],'#b6bdb4');
  for(let i=0;i<3;i++) {
    box(room,[1.48,.025,.73],[-9.8,.3+i*.4,4.7],'#7a8b8b');
    box(room,[.28,.025,.04],[-9.8,.47+i*.4,5.07],'#5e7073');
  }

  // Meeting table with laptops, a brief and a product sample.
  box(room,[5.5,.22,2.3],[6.2,1.18,-4.9],'#c8b89b');
  [[4.1,-5.65],[8.3,-5.65],[4.1,-4.15],[8.3,-4.15]].forEach(([x,z])=>box(room,[.16,1.1,.16],[x,.57,z],'#596b70'));
  [4.5,6.1,7.8].forEach(x=>{
    box(room,[.9,.035,.6],[x,1.32,-4.9],'#53656c');
    const screen=box(room,[.9,.55,.055],[x,1.58,-5.15],'#40565f'); screen.rotation.x=-.2;
    box(room,[.78,.4,.015],[x,1.58,-5.1],'#8ab3b2');
  });
  box(room,[.7,.03,.9],[5.3,1.33,-4.2],'#e7e4d5');
  box(room,[.6,.8,.3],[8.3,1.7,-4.45],'#c08765');
  box(room,[.3,.15,.1],[8.3,2.15,-4.45],'#695c4c');
  [4.3,6.3,8.3].forEach(x=>chair(x,-3.25,Math.PI));
  [4.3,6.3,8.3].forEach(x=>chair(x,-6.5));

  // Data corner and a compact coffee station.
  desk(6.1,2.2,'#90aaa1',Math.PI); chair(6.1,.85);
  box(room,[3.6,1.05,.9],[7.5,.57,6.8],'#aeb9b2');
  box(room,[3.8,.12,1.05],[7.5,1.15,6.8],'#d6d2bf');
  box(room,[.75,.7,.65],[8.35,1.55,6.8],'#3c5057');
  box(room,[.5,.32,.03],[8.35,1.55,7.14],'#778e8f');
  cylinder(room,.14,.24,[7.5,1.34,6.98],'#d1a27a');
  cylinder(room,.14,.24,[7.05,1.34,6.98],'#d8ddcc');
  const dataSign=sign('DATA  成效觀察',3.8,.52,'#3b555d','#dfdfca');
  dataSign.position.set(6.1,2.45,1.45);

  const actors = {
    lead: person(3.25,-3.7,'#8a9aab','#4c4544',-.2),
    designer: person(-6.9,-2.7,'#ad7e6b','#393e43',.55),
    media: person(-3.25,3.05,'#6c928c','#54483d',-.25),
    analyst: person(7.8,.25,'#8f89a1','#393d40',-1.4),
  };
  const player = person(.5,2.6,'#dfb751','#4b4441',-.5);
  plant(-9.75,-7.4,1.15); plant(9.9,-7.5,1.15); plant(10,5.8); plant(-9.5,7.4,.85);
  const objective=sign('！',.56,.73,'#e0b14d','#273f49');
  objective.position.set(3.25,3.35,-3.5);

  return {
    room,
    actors, player, objective,
    dispose() {
      geometries.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose());
      textures.forEach(t=>t.dispose());
      room.traverse(o=>{if(o instanceof THREE.Mesh && o.material instanceof THREE.MeshBasicMaterial) o.material.dispose();});
    },
  };
}
