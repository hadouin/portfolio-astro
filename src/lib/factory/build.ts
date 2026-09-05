import * as THREE from "three";
import { BAY, BELT_H, C, LEVER_PIVOT, type Conveyor, type Part } from "./plan";

const deg = THREE.MathUtils.degToRad;

export function geometryFor(shape: Part["shape"], [w, h, d]: Part["size"]) {
  switch (shape) {
    case "cylinder": return new THREE.CylinderGeometry(w / 2, w / 2, h, 24);
    case "cone": return new THREE.ConeGeometry(w / 2, h, 24);
    case "sphere": return new THREE.SphereGeometry(w / 2, 20, 14);
    case "torus": return new THREE.TorusGeometry(w / 2, h, 12, 40);
    case "octa": return new THREE.OctahedronGeometry(w / 2, 0);
    default: return new THREE.BoxGeometry(w, h, d);
  }
}

export function makePart(p: Part): THREE.Mesh {
  const glass = p.opacity !== undefined && p.opacity < 1;
  const mat = new THREE.MeshStandardMaterial({
    color: p.color ?? C.machine,
    roughness: glass ? 0.2 : 0.7,
    metalness: 0.15,
    emissive: p.emissive ?? "#000000",
    emissiveIntensity: p.emissive ? 0.9 : 0,
    transparent: glass,
    opacity: glass ? p.opacity : 1,
    depthWrite: !glass,
  });
  const mesh = new THREE.Mesh(geometryFor(p.shape, p.size), mat);
  const [x, y, z] = p.position;
  const centred = p.shape === "torus" || p.shape === "octa";
  mesh.position.set(x, y + (centred ? 0 : p.size[1] / 2), z);
  if (p.rotation) mesh.rotation.set(deg(p.rotation[0]), deg(p.rotation[1]), deg(p.rotation[2]));
  if (p.shape === "octa") mesh.scale.y = p.size[1] / p.size[0];
  mesh.castShadow = !glass;
  mesh.receiveShadow = !glass;
  if (glass) mesh.renderOrder = 10;
  if (p.id) mesh.name = p.id;
  return mesh;
}

// ─── textures ───────────────────────────────────────────────────────────────
function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  draw(ctx, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export const makeBeltTexture = () =>
  canvasTexture(64, (ctx, s) => {
    ctx.fillStyle = C.belt;
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = "#3b3b40";
    ctx.fillRect(0, 0, 10, s);
    ctx.fillStyle = "#4a4a50";
    ctx.fillRect(2, 0, 3, s);
  });

export const makeHazardTexture = () =>
  canvasTexture(64, (ctx, s) => {
    ctx.fillStyle = C.hazardYellow;
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = "#111";
    for (let i = -s; i < s * 2; i += 24) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 12, 0);
      ctx.lineTo(i + 12 + s, s);
      ctx.lineTo(i + s, s);
      ctx.closePath();
      ctx.fill();
    }
  });

export const makeGridTexture = () =>
  canvasTexture(128, (ctx, s) => {
    ctx.fillStyle = C.floor;
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = "#2a2a2a";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, s - 2, s - 2);
  });

// ─── conveyors with a moving belt ───────────────────────────────────────────
export interface ConveyorBuild { group: THREE.Group; beltMap: THREE.Texture }

export function makeConveyor(c: Conveyor, beltTex: THREE.Texture): ConveyorBuild {
  const g = new THREE.Group();
  const width = c.width ?? 3;
  const base = c.base ?? 0;
  const top = base + BELT_H;
  const dx = c.to[0] - c.from[0];
  const dz = c.to[1] - c.from[1];
  const len = Math.hypot(dx, dz);
  const angle = Math.atan2(-dz, dx);

  const frame = new THREE.Mesh(new THREE.BoxGeometry(len, 0.3, width), new THREE.MeshStandardMaterial({ color: C.charcoal, roughness: 0.9 }));
  frame.position.y = top - 0.15;
  frame.castShadow = true;
  frame.receiveShadow = true;
  g.add(frame);

  const beltMap = beltTex.clone();
  beltMap.needsUpdate = true;
  beltMap.repeat.set(len / 1.5, 1);
  const belt = new THREE.Mesh(new THREE.PlaneGeometry(len, width - 0.3), new THREE.MeshStandardMaterial({ map: beltMap, roughness: 0.85 }));
  belt.rotation.x = -Math.PI / 2;
  belt.position.y = top + 0.01;
  belt.receiveShadow = true;
  g.add(belt);

  const railMat = new THREE.MeshStandardMaterial({ color: C.roller, metalness: 0.4, roughness: 0.5 });
  for (const s of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.35, 0.15), railMat);
    rail.position.set(0, top + 0.05, (s * width) / 2);
    g.add(rail);
  }
  const rollerGeo = new THREE.CylinderGeometry(0.22, 0.22, width, 10);
  for (let x = -len / 2 + 1; x < len / 2; x += 2) {
    const r = new THREE.Mesh(rollerGeo, railMat);
    r.rotation.x = Math.PI / 2;
    r.position.set(x, top - 0.5, 0);
    g.add(r);
  }
  const legGeo = new THREE.BoxGeometry(0.2, BELT_H - 0.6, 0.2);
  for (let x = -len / 2 + 0.5; x <= len / 2 - 0.5; x += 4) {
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(legGeo, railMat);
      leg.position.set(x, base + (BELT_H - 0.6) / 2, (s * width) / 2 - s * 0.2);
      g.add(leg);
    }
  }

  g.position.set(c.from[0] + dx / 2, 0, c.from[1] + dz / 2);
  g.rotation.y = angle;
  g.name = c.id;
  return { group: g, beltMap };
}

// ─── floors ─────────────────────────────────────────────────────────────────
export function makeFloors(gridTex: THREE.Texture): THREE.Object3D[] {
  const mat = new THREE.MeshStandardMaterial({ map: gridTex, roughness: 0.95 });
  gridTex.repeat.set(0.25, 0.25);

  // one continuous hall floor: the storyboard never leaves ground level
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(190, 100), mat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(20, 0, 0);
  ground.receiveShadow = true;

  // back wall behind the line, so the hall reads as an interior
  const wallMat = new THREE.MeshStandardMaterial({ color: "#0d0d0d", roughness: 1 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(190, 22, 1), wallMat);
  back.position.set(20, 11, -34);
  const end = new THREE.Mesh(new THREE.BoxGeometry(1, 22, 68), wallMat);
  end.position.set(BAY.x1 + 6, 11, 0);
  return [ground, back, end];
}

// ─── mega switch: wall-mounted knife switch under a glass guard ─────────────
export interface LeverBuild { group: THREE.Group; handle: THREE.Group; hinge: THREE.Group; cover: THREE.Mesh; hit: THREE.Mesh }
// The yoke hinges at the bottom terminals: it rests tilted out of the wall, the throw
// swings it flat so the blades seat in the top jaws.
export const LEVER_REST = 0.85;
export const LEVER_ON = 0.05;
export const COVER_OPEN = -1.75;

/** Yellow "high voltage" triangle sticker, transparent around the shape. */
const makeHighVoltageTexture = () =>
  canvasTexture(128, (ctx, s) => {
    const tri = (inset: number) => {
      ctx.beginPath();
      ctx.moveTo(s / 2, inset);
      ctx.lineTo(s - inset, s - inset);
      ctx.lineTo(inset, s - inset);
      ctx.closePath();
    };
    ctx.fillStyle = "#111";
    tri(6);
    ctx.fill();
    ctx.fillStyle = C.hazardYellow;
    tri(18);
    ctx.fill();
    ctx.fillStyle = "#111"; // lightning bolt
    ctx.beginPath();
    ctx.moveTo(s * 0.56, s * 0.38);
    ctx.lineTo(s * 0.44, s * 0.62);
    ctx.lineTo(s * 0.52, s * 0.62);
    ctx.lineTo(s * 0.42, s * 0.84);
    ctx.lineTo(s * 0.6, s * 0.56);
    ctx.lineTo(s * 0.5, s * 0.56);
    ctx.lineTo(s * 0.62, s * 0.38);
    ctx.closePath();
    ctx.fill();
  });

/** The small "DANGER / HIGH VOLTAGE" plate riveted on the yoke. */
const makeDangerTexture = () =>
  canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = "#f2f2ee";
    ctx.fillRect(0, s * 0.28, s, s * 0.44);
    ctx.fillStyle = "#c62828";
    ctx.beginPath();
    ctx.ellipse(s / 2, s * 0.4, s * 0.3, s * 0.075, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${Math.round(s * 0.1)}px sans-serif`;
    ctx.fillText("DANGER", s / 2, s * 0.405);
    ctx.fillStyle = "#111";
    ctx.font = `bold ${Math.round(s * 0.1)}px sans-serif`;
    ctx.fillText("HIGH VOLTAGE", s / 2, s * 0.61);
  });

export function makeLever(hazardTex: THREE.Texture): LeverBuild {
  const g = new THREE.Group();
  g.position.set(...LEVER_PIVOT);
  const dark = new THREE.MeshStandardMaterial({ color: C.charcoal, roughness: 0.8 });
  const steel = new THREE.MeshStandardMaterial({ color: C.roller, metalness: 0.5, roughness: 0.4 });
  const hazard = new THREE.MeshStandardMaterial({ map: hazardTex, roughness: 0.6 });
  const bakelite = new THREE.MeshStandardMaterial({ color: "#6b452c", roughness: 0.55, metalness: 0.1 });
  const sticker = (map: THREE.Texture) =>
    new THREE.MeshStandardMaterial({ map, transparent: true, roughness: 0.5, side: THREE.DoubleSide });

  // brown bakelite back panel, held by two hazard-striped mounting rails
  const plate = new THREE.Mesh(new THREE.BoxGeometry(3.8, 5.4, 0.3), bakelite);
  plate.position.z = -0.15;
  plate.castShadow = true;
  g.add(plate);
  for (const y of [2.85, -2.85]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.28, 0.34), hazard);
    rail.position.set(0, y, -0.13);
    g.add(rail);
  }

  const BLADE_X = 1.2;
  const HINGE_Y = -2.05; // yoke pivot, low on the panel

  // terminals: hinge blocks at the bottom, jaw clips the blades snap into up top
  for (const sx of [-1, 1]) {
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.4), dark);
    base.position.set(sx * BLADE_X, HINGE_Y - 0.15, 0.2);
    g.add(base);
    const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.34, 16), steel);
    boss.rotation.x = Math.PI / 2;
    boss.position.set(sx * BLADE_X, HINGE_Y, 0.45);
    g.add(boss);
    for (const z of [0.14, 0.5]) {
      const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.75, 0.14), dark);
      jaw.position.set(sx * BLADE_X, 1.55, z);
      g.add(jaw);
    }
  }

  // hazard stickers on the panel
  const hvTex = makeHighVoltageTexture();
  for (const [y, size] of [[0.35, 1.0], [-1.35, 0.9]] as const) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(size, size), sticker(hvTex));
    s.position.set(0, y, 0.02);
    g.add(s);
  }

  // the yoke: two blades bridged by a lower bar and a red-gripped top bar
  const handle = new THREE.Group();
  handle.position.set(0, HINGE_Y, 0.32);
  const BLADE_LEN = 4.0;
  for (const sx of [-1, 1]) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.36, BLADE_LEN, 0.18), dark);
    blade.position.set(sx * BLADE_X, BLADE_LEN / 2, 0);
    blade.castShadow = true;
    handle.add(blade);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), dark);
    cap.position.set(sx * BLADE_X, BLADE_LEN, 0);
    handle.add(cap);
  }
  const crossbar = (y: number, d: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(2 * BLADE_X + 0.36, 0.36, d), dark);
    m.position.set(0, y, 0);
    m.castShadow = true;
    handle.add(m);
    return m;
  };
  crossbar(BLADE_LEN, 0.36);
  crossbar(1.5, 0.3);
  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.26, 1.9, 16),
    new THREE.MeshStandardMaterial({ color: "#d62b2b", roughness: 0.45 }),
  );
  grip.rotation.z = Math.PI / 2;
  grip.position.set(0.25, BLADE_LEN, 0);
  grip.castShadow = true;
  handle.add(grip);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), sticker(makeDangerTexture()));
  label.position.set(0.55, 1.5, 0.17);
  handle.add(label);
  handle.rotation.x = LEVER_REST;
  g.add(handle);

  // generous invisible hit target, riding the yoke so it stays under the grip
  const hit = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(0, BLADE_LEN - 0.4, 0.1);
  handle.add(hit);

  // glass guard hinged at the top edge, deep enough to clear the yoke at rest
  const hinge = new THREE.Group();
  hinge.position.set(0, 3.0, 0.05);
  const [W, H, D] = [4.4, 6.0, 3.9];
  const cover = new THREE.Mesh(
    new THREE.BoxGeometry(W, H, D),
    new THREE.MeshStandardMaterial({ color: "#9fc0e8", transparent: true, opacity: 0.22, roughness: 0.1, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide }),
  );
  cover.position.set(0, -H / 2, D / 2);
  cover.renderOrder = 10;
  hinge.add(cover);
  const edge = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), dark);
    m.position.set(x, y, z);
    hinge.add(m);
  };
  edge(W + 0.1, 0.12, 0.12, 0, 0, D);
  edge(W + 0.1, 0.12, 0.12, 0, -H, D);
  edge(0.12, H + 0.1, 0.12, W / 2, -H / 2, D);
  edge(0.12, H + 0.1, 0.12, -W / 2, -H / 2, D);
  edge(0.12, 0.12, D, W / 2, -H, D / 2);
  edge(0.12, 0.12, D, -W / 2, -H, D / 2);
  edge(W + 0.2, 0.16, 0.16, 0, 0, 0); // hinge rod
  g.add(hinge);

  return { group: g, handle, hinge, cover, hit };
}

// ─── playable claw rig (bridge on the gantry rail, trolley, cable, 4 jaws) ──
export interface ClawRig {
  group: THREE.Group;
  /** x/z = trolley position, headY = claw head centre, closed ∈ [0 open … 1 closed]. */
  update: (x: number, z: number, headY: number, closed: number) => void;
}

export function makeClawRig(railY: number, railZ: number): ClawRig {
  const g = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: C.roller, metalness: 0.5, roughness: 0.4 });
  const light = new THREE.MeshStandardMaterial({ color: C.machineLight, roughness: 0.6 });

  // bridge rides the rail (x), trolley rides the bridge (z)
  const bridgeLen = 9.5;
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, bridgeLen), light);
  const trolley = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 1.6), new THREE.MeshStandardMaterial({ color: C.machine, roughness: 0.7 }));
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 8), steel);
  bridge.castShadow = trolley.castShadow = true;
  g.add(bridge, trolley, cable);

  const head = new THREE.Group();
  const bell = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.5, 20), steel);
  bell.rotation.x = Math.PI;
  bell.castShadow = true;
  head.add(bell);
  const jaws: THREE.Group[] = [];
  for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const pivot = new THREE.Group();
    pivot.position.set(Math.cos(a) * 0.7, -0.55, Math.sin(a) * 0.7);
    pivot.rotation.y = -a; // local +x points outward
    const finger = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.5, 0.28), steel);
    finger.position.y = -0.7;
    finger.castShadow = true;
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.5, 0.26), steel);
    tip.position.set(-0.16, -1.5, 0);
    tip.rotation.z = 0.5;
    pivot.add(finger, tip);
    head.add(pivot);
    jaws.push(pivot);
  }
  g.add(head);

  const update = (x: number, z: number, headY: number, closed: number) => {
    bridge.position.set(x, railY - 0.55, railZ + bridgeLen / 2 - 0.5);
    trolley.position.set(x, railY - 1.1, z);
    head.position.set(x, headY, z);
    const len = Math.max(0.2, railY - 1.5 - headY);
    cable.position.set(x, headY + 0.7 + len / 2, z);
    cable.scale.y = len;
    for (const j of jaws) j.rotation.z = THREE.MathUtils.lerp(0.75, -0.12, closed);
  };
  update(0, 0, railY - 4, 0.35);
  return { group: g, update };
}

// ─── ideas ──────────────────────────────────────────────────────────────────
export interface IdeaBuild {
  group: THREE.Group;
  shell: THREE.Mesh;
  core: THREE.Mesh;
  light: THREE.PointLight;
  /** Present when scratchable. */
  scratch?: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; texture: THREE.CanvasTexture; ratio: () => number };
}

export function makeIdea(radius = 0.9, scratchable = false, withLight = true): IdeaBuild {
  const g = new THREE.Group();
  const shellMat = new THREE.MeshStandardMaterial({ color: C.charcoal, roughness: 0.45, metalness: 0.25 });
  let scratch: IdeaBuild["scratch"];
  if (scratchable) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 256, 256);
    const texture = new THREE.CanvasTexture(canvas);
    shellMat.alphaMap = texture;
    shellMat.transparent = true;
    shellMat.alphaTest = 0.5;
    shellMat.side = THREE.DoubleSide;
    const ratio = () => {
      const d = ctx.getImageData(0, 0, 256, 256).data;
      let dark = 0;
      let n = 0;
      for (let i = 0; i < d.length; i += 16) {
        n++;
        if (d[i + 1] < 128) dark++;
      }
      return dark / n;
    };
    scratch = { canvas, ctx, texture, ratio };
  }
  const shell = new THREE.Mesh(new THREE.OctahedronGeometry(radius, 0), shellMat);
  shell.scale.y = 1.4;
  shell.castShadow = true;
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(radius * 0.5, 1),
    new THREE.MeshStandardMaterial({ color: C.accent, emissive: C.accent, emissiveIntensity: 0.55, roughness: 0.35, metalness: 0.5 }),
  );
  core.scale.y = 1.35;
  const light = new THREE.PointLight(C.accent, withLight ? 5 : 0, 7, 2);
  g.add(shell, core, light);
  return { group: g, shell, core, light, scratch };
}

export function makeCrate(): THREE.Group {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshStandardMaterial({ color: C.accent, roughness: 0.8 }));
  box.position.y = 1;
  box.castShadow = true;
  box.receiveShadow = true;
  const tapeMat = new THREE.MeshStandardMaterial({ color: C.charcoal });
  const tape = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.3, 2.04), tapeMat);
  tape.position.y = 1.7;
  const tape2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.04, 2.04), tapeMat);
  tape2.position.y = 1;
  const label = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.02), new THREE.MeshStandardMaterial({ color: C.white }));
  label.position.set(0.45, 1.05, 1.02);
  g.add(box, tape, tape2, label);
  g.name = "crate";
  return g;
}
