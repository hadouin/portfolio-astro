/**
 * Scroll-driven timeline. `p` ∈ [0, 1] is the scroll progress once the lever has been pulled.
 * Camera and idea/pieces are keyframed on p.
 */
import * as THREE from "three";
import { ASM, BELT_H, CRATE_END, CRATE_START, LANES, MERGE_X } from "./plan";

export type V3 = [number, number, number];
export interface CamKey { p: number; cam: V3; look: V3 }
export interface PosKey { p: number; pos: V3 }

const Y = BELT_H + 0.9;

/** Progress cannot pass these until the matching interaction is done. */
export const GATES = { scratch: 0.125 };

export const RANGES = {
  scratchZoom: [0.09, 0.14] as const,
  refine: [0.19, 0.31] as const,
  shatter: 0.34,
  splitter: [0.42, 0.56] as const,
  machining: [0.56, 0.76] as const,
  assemble: [0.78, 0.87] as const,
  crate: [0.88, 0.965] as const,
};

export function buildCameraKeys(forkliftEye: V3, forkliftLook: V3): CamKey[] {
  const keys: CamKey[] = [
    { p: 0.0, cam: [-18, 4.6, 13], look: [-18.5, 2.2, 0] },
    { p: 0.08, cam: [-12.5, 4.5, 9], look: [-14, 1.9, 0] },
    { p: 0.1, cam: [-13.2, 3.4, 4.6], look: [-14, 1.9, 0] },
    { p: 0.14, cam: [-13.2, 3.4, 4.6], look: [-14, 1.9, 0] },
    { p: 0.19, cam: [-13.5, 9, 7], look: [-11, 2.5, 0] },
    { p: 0.24, cam: [-9.5, 12, 3.5], look: [-8, 2, 0] },
    { p: 0.31, cam: [-4, 11, 4.5], look: [-5, 2, 0] },
    { p: 0.36, cam: [-1.5, 4.5, 8], look: [-1, 1.9, 0] },
    { p: 0.42, cam: [2, 4, 8], look: [4, 1.9, 0] },
    { p: 0.47, cam: [1, 10, 6], look: [7, 1.5, 0] },
    { p: 0.51, cam: [-1, 15.5, 0], look: [9, 1, 0] },
    { p: 0.57, cam: [6, 15.5, 0], look: [15, 1, 0] },
    { p: 0.63, cam: [16, 9, 22], look: [20, 1.5, 0] },
    { p: 0.72, cam: [30, 9, 22], look: [30, 1.5, 0] },
    { p: 0.76, cam: [33, 9.5, 25], look: [40, 2, 0] },
  ];
  // the lanes converge, the assembly machine works, then the crate rolls out (boards 12-17)
  keys.push(
    { p: 0.79, cam: [30, 12, 30], look: [42, 3, 0] },
    { p: 0.83, cam: [38, 9.5, 25], look: [ASM.x, 3.5, 0] },
    { p: 0.87, cam: [ASM.x, 14, 22], look: [ASM.x + 1, 3.5, 0] },
    { p: 0.9, cam: [53, 6.5, 18], look: [54, 2.4, 0] },
    { p: 0.94, cam: [59, 5, 23], look: [59, 2.2, 0] },
    { p: 0.97, cam: [64, 4.5, 16], look: [CRATE_END[0], 2, 0] },
    { p: 1.0, cam: forkliftEye, look: forkliftLook },
  );
  return keys;
}

/** Main idea (single charcoal shard) until it shatters. */
export const IDEA_KEYS: PosKey[] = [
  { p: 0.0, pos: [-19, Y, 0] },
  { p: 0.08, pos: [-14, Y, 0] },
  { p: 0.14, pos: [-14, Y, 0] },
  { p: 0.19, pos: [-11, Y, 0] },
  { p: 0.31, pos: [-3.5, Y, 0] },
  { p: RANGES.shatter, pos: [-2, Y, 0] },
];

/** Three pieces after the shatter, one per lane. */
export function pieceKeys(i: number): PosKey[] {
  const off = (i - 1) * 0.9;
  return [
    { p: RANGES.shatter, pos: [-2 + off, Y, 0] },
    { p: 0.42, pos: [4.4 + off, Y, 0] },
    { p: 0.5, pos: [7.6, Y, 0] },
    { p: 0.56, pos: [14, Y, LANES[i]] },
    { p: 0.72, pos: [34, Y, LANES[i]] },
    { p: RANGES.assemble[0], pos: [MERGE_X, Y, 0] },
    { p: RANGES.assemble[1], pos: [ASM.x - 2, Y, 0] },
  ];
}

export const CRATE_KEYS: PosKey[] = [
  { p: RANGES.crate[0], pos: CRATE_START },
  { p: 0.94, pos: [(CRATE_START[0] + CRATE_END[0]) / 2, CRATE_START[1], 0] },
  { p: RANGES.crate[1], pos: CRATE_END },
];

/** Linear sampling. Returns false when p is outside the keyed range. */
export function samplePos(keys: PosKey[], p: number, out: THREE.Vector3): boolean {
  if (p < keys[0].p || p > keys[keys.length - 1].p) return false;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (p <= b.p) {
      const t = b.p === a.p ? 1 : (p - a.p) / (b.p - a.p);
      out.set(
        a.pos[0] + (b.pos[0] - a.pos[0]) * t,
        a.pos[1] + (b.pos[1] - a.pos[1]) * t,
        a.pos[2] + (b.pos[2] - a.pos[2]) * t,
      );
      return true;
    }
  }
  out.set(...keys[keys.length - 1].pos);
  return true;
}

/** Smooth camera rail through the keys (centripetal Catmull-Rom, parameterised by key index). */
export class CameraRail {
  private cam: THREE.CatmullRomCurve3;
  private look: THREE.CatmullRomCurve3;
  private ps: number[];
  constructor(keys: CamKey[]) {
    this.cam = new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.cam)), false, "centripetal");
    this.look = new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.look)), false, "centripetal");
    this.ps = keys.map((k) => k.p);
  }
  private u(p: number) {
    const ps = this.ps;
    const n = ps.length;
    if (p <= ps[0]) return 0;
    if (p >= ps[n - 1]) return 1;
    let i = 0;
    while (i < n - 2 && p > ps[i + 1]) i++;
    const t = (p - ps[i]) / (ps[i + 1] - ps[i]);
    return (i + t) / (n - 1);
  }
  sample(p: number, cam: THREE.Vector3, look: THREE.Vector3) {
    const u = this.u(p);
    this.cam.getPoint(u, cam);
    this.look.getPoint(u, look);
  }
}

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
