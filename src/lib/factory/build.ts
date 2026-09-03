import * as THREE from "three";
import { BELT_H, C, LEVER_PIVOT, TOWER_D, TOWER_W, TOWER_X, UNDER_Y, type Conveyor, type Part } from "./plan";

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

  // ground with a hole for the shaft
  const shape = new THREE.Shape();
  shape.moveTo(-70, -45);
  shape.lineTo(90, -45);
  shape.lineTo(90, 45);
  shape.lineTo(-70, 45);
  shape.closePath();
  const hole = new THREE.Path();
  const hw = TOWER_W / 2 + 0.2;
  const hd = TOWER_D / 2 + 0.2;
  hole.moveTo(TOWER_X - hw, -hd);
  hole.lineTo(TOWER_X + hw, -hd);
  hole.lineTo(TOWER_X + hw, hd);
  hole.lineTo(TOWER_X - hw, hd);
  hole.closePath();
  shape.holes.push(hole);
  const ground = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;

  // underground floor
  const under = new THREE.Mesh(new THREE.PlaneGeometry(90, 70), mat);
  under.rotation.x = -Math.PI / 2;
  under.position.set(55, UNDER_Y, 0);
  under.receiveShadow = true;

  // underground back walls (so the cavern has an edge)
  const wallMat = new THREE.MeshStandardMaterial({ color: "#0d0d0d", roughness: 1 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(90, 14, 1), wallMat);
  back.position.set(55, UNDER_Y + 7, -35);
  const side = new THREE.Mesh(new THREE.BoxGeometry(1, 14, 70), wallMat);
  side.position.set(100, UNDER_Y + 7, 0);
  return [ground, under, back, side];
}

// ─── safety lever ───────────────────────────────────────────────────────────
export interface LeverBuild { group: THREE.Group; handle: THREE.Group; hit: THREE.Mesh }
export const LEVER_REST = -1.0;
export const LEVER_ON = 0.95;

export function makeLever(hazardTex: THREE.Texture): LeverBuild {
  const g = new THREE.Group();
  g.position.set(...LEVER_PIVOT);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.6, 0.2), new THREE.MeshStandardMaterial({ color: C.charcoal, roughness: 0.8 }));
  plate.position.z = -0.3;
  g.add(plate);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 0.22), new THREE.MeshStandardMaterial({ map: hazardTex }));
  stripe.position.set(0, -1.35, -0.3);
  g.add(stripe);
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.8, 16), new THREE.MeshStandardMaterial({ color: C.roller, metalness: 0.5, roughness: 0.4 }));
  axle.rotation.x = Math.PI / 2;
  g.add(axle);

  const handle = new THREE.Group();
  const hz = hazardTex.clone();
  hz.needsUpdate = true;
  hz.repeat.set(1, 3);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.34, 2.4, 0.34), new THREE.MeshStandardMaterial({ map: hz, roughness: 0.6 }));
  bar.position.y = 1.2;
  bar.castShadow = true;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), new THREE.MeshStandardMaterial({ color: C.red, roughness: 0.4 }));
  knob.position.y = 2.5;
  knob.castShadow = true;
  handle.add(bar, knob);
  handle.position.z = 0.3;
  handle.rotation.z = LEVER_REST;
  g.add(handle);

  // generous invisible hit target
  const hit = new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(0, 0.8, 0.3);
  g.add(hit);
  return { group: g, handle, hit };
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
    new THREE.OctahedronGeometry(radius * 0.72, 1),
    new THREE.MeshStandardMaterial({ color: C.accent, emissive: C.accent, emissiveIntensity: 1.2, roughness: 0.3, metalness: 0.6 }),
  );
  core.scale.y = 1.3;
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
