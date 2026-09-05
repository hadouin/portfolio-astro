/**
 * Factory world data — from the storyboard (boards 1 → 18).
 *
 * Flow (left → right, +x, one ground level — the boards never leave the hall):
 *   1  "IDEA" claw machine — drive the claw with buttons, grab an idea, it drops in the hopper
 *   2  H machine, hopper + safety lever, the idea pops back out
 *   3  belt, charcoal raw idea
 *   4  "your idea is already gold" (scratch the charcoal)
 *   5-6 refining press, open top, lights and switches
 *   7-10 splitter → "CHOOSE" → three lanes
 *   11 machining lanes (press, drill, shaper, stamp, robot)
 *   12-14 lanes converge into the ASSEMBLY machine
 *   15-16 the finished crate rolls out between two pillars, "PROJET" sign
 *   17-18 shipping bay: drive the transpalette, load the crate on the truck
 *
 * Units: metres. Y up. `position` = footprint centre; y = bottom of the part (torus/octa centred).
 */

export type Shape = "box" | "cylinder" | "cone" | "sphere" | "torus" | "octa";

export interface Part {
  id?: string;
  shape: Shape;
  position: [x: number, y: number, z: number];
  size: [w: number, h: number, d: number];
  rotation?: [x: number, y: number, z: number]; // degrees
  color?: string;
  emissive?: string;
  opacity?: number;
  station?: string;
}

export interface Conveyor {
  id: string;
  from: [number, number];
  to: [number, number];
  width?: number;
  /** Ground level the conveyor stands on. */
  base?: number;
}

export const C = {
  bg: "#000000",
  floor: "#161616",
  machine: "#3a3a38",
  machineLight: "#55554f",
  belt: "#26262a",
  roller: "#8a8a82",
  accent: "#F0C477",
  blue: "#8BA6F3",
  red: "#EE8D8D",
  charcoal: "#151515",
  white: "#e8e8e2",
  hazardYellow: "#f2c027",
};

export const BELT_H = 1.0;
export const LANES = [-9, 0, 9] as const;

// ─── assembly / delivery / shipping (all at ground level) ───────────────────
export const MERGE_X = 39.5; // the three lanes meet here
export const ASM = { x: 46, w: 10, d: 14, h: 7 };
export const ASM_IN_X = ASM.x - ASM.w / 2; // 41
export const ASM_OUT_X = ASM.x + ASM.w / 2; // 51
export const OUT_BELT = { x0: ASM_OUT_X, x1: 64, halfW: 1.5, top: BELT_H };
/** Framing pillars of the reveal shot (board 15). */
export const REVEAL_PILLARS: [number, number][] = [[52.5, 9], [66, 9]];

export const HOPPER_POS: [number, number, number] = [-24, 7.6, 0];
/** Claw-machine cabinet (board 1): a glass case full of ideas, next to the H machine. */
export const CAB = { x: -33, z: 0, w: 10, d: 8, baseH: 1.6, glassH: 5.8 };
/** Gantry claw: playable bounds inside the cabinet, heights, travel speeds. */
export const CLAW = {
  railY: 11,
  railZ: -5,
  idleY: 6.0,
  grabY: 4.0,
  carryY: 10.0,
  speed: 3.4,
  vSpeed: 4.5,
  catchRadius: 1.35,
  bounds: { x0: CAB.x - CAB.w / 2 + 1.3, x1: CAB.x + CAB.w / 2 - 1.3, z0: -2.3, z1: 2.3 },
};
export const H_EXIT_POS: [number, number, number] = [-20.4, 2.4, 0];
export const LEVER_PIVOT: [number, number, number] = [-24, 3.1, 3.3];
export const CRATE_START: [number, number, number] = [52.5, BELT_H, 0];
export const CRATE_END: [number, number, number] = [62.5, BELT_H, 0];
export const FORKLIFT_START = { position: [73, 0, 1] as [number, number, number], heading: Math.PI };

/** Shipping bay (boards 17-18): hall columns, hanging lamps, truck + loading ramp. */
export const BAY = { x0: 52, x1: 96, halfZ: 20, columnZ: 16, ceiling: 15 };
export const TRUCK = { x: 86, bedY: 1.3, length: 12, width: 7 };
export const RAMP = {
  z: 0,
  width: 6,
  xStart: TRUCK.x - TRUCK.length / 2 - 3.2,
  xEnd: TRUCK.x - TRUCK.length / 2 + 0.4,
};
/** Scenery crates already stacked in the bay. */
export const BAY_CRATES: [number, number, number][] = [
  [72, 0, -14], [74.5, 0, -14], [72, 0, -17], [80, 0, 15], [82.5, 0, 15],
];

/** Idea shards floating inside the claw-machine cabinet (octa groups are centred on y). */
export const IDEA_SEEDS: [number, number, number][] = [
  [-36.2, 2.5, -1.5], [-35, 2.5, 1.3], [-33.6, 2.5, -0.5], [-32.2, 2.5, 1.6], [-31.1, 2.5, -1.6], [-34.3, 2.5, -0.2],
];

// ─── conveyors ──────────────────────────────────────────────────────────────
export const CONVEYORS: Conveyor[] = [
  { id: "c-switch-refine", from: [-20, 0], to: [-11.2, 0] },
  { id: "c-refine-inside", from: [-11.2, 0], to: [-2.8, 0] },
  { id: "c-refine-split", from: [-2.8, 0], to: [4.4, 0] },
  { id: "c-split-top", from: [7.6, 0], to: [14, LANES[0]] },
  { id: "c-split-mid", from: [7.6, 0], to: [14, LANES[1]] },
  { id: "c-split-bot", from: [7.6, 0], to: [14, LANES[2]] },
  { id: "lane-top", from: [14, LANES[0]], to: [34, LANES[0]] },
  { id: "lane-mid", from: [14, LANES[1]], to: [34, LANES[1]] },
  { id: "lane-bot", from: [14, LANES[2]], to: [34, LANES[2]] },
  // the three lanes converge on the assembly machine (board 12)
  { id: "c-merge-top", from: [34, LANES[0]], to: [MERGE_X, 0] },
  { id: "c-merge-mid", from: [34, LANES[1]], to: [MERGE_X, 0] },
  { id: "c-merge-bot", from: [34, LANES[2]], to: [MERGE_X, 0] },
  { id: "c-asm-in", from: [MERGE_X, 0], to: [ASM_IN_X + 1.5, 0] },
  // finished crate rolls out of the assembly machine (boards 15-16)
  { id: "c-out", from: [OUT_BELT.x0, 0], to: [OUT_BELT.x1, 0] },
];

// ─── parts ──────────────────────────────────────────────────────────────────
const parts: Part[] = [];
const add = (p: Part) => parts.push(p);

// Claw-machine cabinet (board 1): base, glass case, marquee, control panel — the claw rig
// itself (bridge / trolley / cable / jaws) is dynamic, see makeClawRig in build.ts.
add({ station: "grab", shape: "box", position: [CAB.x, 0, CAB.z], size: [CAB.w, CAB.baseH, CAB.d], color: C.machine });
add({ station: "grab", shape: "box", position: [CAB.x, 0.55, CAB.z + CAB.d / 2 + 0.8], size: [6.6, 0.9, 1.7], rotation: [-14, 0, 0], color: C.charcoal }); // control panel
for (const [dx, dz] of [[-0.55, 0], [0.55, 0], [0, -0.35], [0, 0.35]])
  add({ station: "grab", shape: "box", position: [CAB.x - 1.8 + dx, 1.28, CAB.z + CAB.d / 2 + 0.75 + dz], size: [0.42, 0.16, 0.3], color: C.machineLight }); // d-pad
add({ id: "grab-btn", station: "grab", shape: "sphere", position: [CAB.x + 1.6, 1.15, CAB.z + CAB.d / 2 + 0.55], size: [0.85, 0.85, 0.85], color: C.red, emissive: C.red }); // GRAB dome
// glass case (solid back wall so the shards read against it)
add({ station: "grab", shape: "box", position: [CAB.x, CAB.baseH, CAB.z + CAB.d / 2], size: [CAB.w, CAB.glassH, 0.12], color: "#9fc0e8", opacity: 0.14 });
add({ station: "grab", shape: "box", position: [CAB.x - CAB.w / 2, CAB.baseH, CAB.z], size: [0.12, CAB.glassH, CAB.d], color: "#9fc0e8", opacity: 0.14 });
add({ station: "grab", shape: "box", position: [CAB.x + CAB.w / 2, CAB.baseH, CAB.z], size: [0.12, CAB.glassH, CAB.d], color: "#9fc0e8", opacity: 0.14 });
add({ station: "grab", shape: "box", position: [CAB.x, CAB.baseH, CAB.z - CAB.d / 2], size: [CAB.w, CAB.glassH, 0.25], color: "#111114" });
for (const sx of [-1, 1])
  for (const sz of [-1, 1])
    add({ station: "grab", shape: "box", position: [CAB.x + (sx * CAB.w) / 2, CAB.baseH, CAB.z + (sz * CAB.d) / 2], size: [0.45, CAB.glassH, 0.45], color: C.machineLight });
// top rim + "IDEA" marquee with racing stripes across the front
const RIM_Y = CAB.baseH + CAB.glassH;
add({ station: "grab", shape: "box", position: [CAB.x, RIM_Y, CAB.z - CAB.d / 2], size: [CAB.w + 0.5, 0.35, 0.5], color: C.machineLight });
for (const sx of [-1, 1])
  add({ station: "grab", shape: "box", position: [CAB.x + (sx * CAB.w) / 2, RIM_Y, CAB.z], size: [0.5, 0.35, CAB.d + 0.5], color: C.machineLight });
add({ station: "grab", shape: "box", position: [CAB.x, RIM_Y, CAB.z + CAB.d / 2 - 0.15], size: [CAB.w + 0.6, 1.8, 1.0], color: C.white });
[C.red, C.accent, C.blue].forEach((col, i) =>
  add({ station: "grab", shape: "box", position: [CAB.x - 3.6 + i * 0.65, RIM_Y + 0.3, CAB.z + CAB.d / 2 + 0.38], size: [0.3, 1.2, 0.08], rotation: [0, 0, -18], color: col, emissive: col }));
add({ id: "cab-light", station: "grab", shape: "box", position: [CAB.x, RIM_Y - 0.4, CAB.z + CAB.d / 2 - 0.9], size: [CAB.w - 1, 0.16, 0.16], color: C.white, emissive: C.white }); // strip light inside
// gantry rail behind the cabinet, spanning from the case to over the H hopper
add({ station: "grab", shape: "box", position: [-30.5, CLAW.railY, CLAW.railZ], size: [15, 0.55, 0.55], color: C.machineLight });
for (const x of [-38, -23])
  add({ station: "grab", shape: "box", position: [x, 0, CLAW.railZ], size: [0.7, CLAW.railY, 0.7], color: C.roller });

// H machine (ideas switch): body, hopper funnel on top, H plate, vents, exit mouth
add({ station: "switch", shape: "box", position: [-24, 0, 0], size: [7, 6, 6], color: C.machine });
add({ station: "switch", shape: "cone", position: [-24, 6, 0], size: [4.4, 2.4, 4.4], rotation: [180, 0, 0], color: C.machineLight }); // hopper
add({ id: "hopper-ring", station: "switch", shape: "torus", position: [-24, 8.4, 0], size: [4.4, 0.18, 4.4], rotation: [90, 0, 0], color: C.red, emissive: C.red });
add({ station: "switch", shape: "box", position: [-26.6, 0.35, 3.05], size: [1.5, 1.5, 0.1], color: C.white }); // H plate (lower left)
add({ station: "switch", shape: "box", position: [-21.5, 0.35, 3.05], size: [0.35, 1.6, 0.1], color: C.machineLight }); // vents (lower right)
add({ station: "switch", shape: "box", position: [-22.1, 0.35, 3.05], size: [0.35, 1.6, 0.1], color: C.machineLight });
add({ station: "switch", shape: "box", position: [-20.45, 1.2, 0], size: [0.1, 2.6, 2.6], color: C.charcoal }); // exit mouth
add({ id: "switch-light", station: "switch", shape: "sphere", position: [-26, 6.2, 2.2], size: [0.6, 0.6, 0.6], color: C.red, emissive: C.red });

// Refine machine: open-top box so the camera can look inside
const RX = -7;
add({ station: "refine", shape: "box", position: [RX, 0, 0], size: [8.4, 0.6, 8.4], color: C.machine }); // floor
add({ station: "refine", shape: "box", position: [RX, 0, 4.2], size: [8.4, 7, 0.3], color: C.machine }); // front wall
add({ station: "refine", shape: "box", position: [RX, 0, -4.2], size: [8.4, 7, 0.3], color: C.machine }); // back wall
add({ station: "refine", shape: "box", position: [RX - 4.2, 3.2, 0], size: [0.3, 3.8, 8.4], color: C.machine }); // left wall (above the belt)
add({ station: "refine", shape: "box", position: [RX + 4.2, 3.2, 0], size: [0.3, 3.8, 8.4], color: C.machine }); // right wall
add({ station: "refine", shape: "box", position: [RX - 4.2, 0, 0], size: [0.3, 0.9, 8.4], color: C.machine });
add({ station: "refine", shape: "box", position: [RX + 4.2, 0, 0], size: [0.3, 0.9, 8.4], color: C.machine });
add({ station: "refine", shape: "torus", position: [RX, 3.5, 4.4], size: [3, 0.35, 3], color: C.accent, emissive: C.accent }); // cycle icon
add({ station: "refine", shape: "box", position: [RX + 2.8, 1.5, 4.4], size: [1.6, 2, 0.1], color: C.machineLight }); // switch panel
[C.accent, C.blue, C.red].forEach((col, i) =>
  add({ id: `refine-light-${i}`, station: "refine", shape: "sphere", position: [RX + 2.8, 5.8 - i * 0.9, 4.5], size: [0.5, 0.5, 0.5], color: col, emissive: col }),
);
// internals: two gears, a piston, a roller
add({ id: "gear-1", station: "refine", shape: "torus", position: [RX - 2, 4.6, -1.8], size: [2.4, 0.4, 2.4], rotation: [0, 0, 0], color: C.roller });
add({ id: "gear-2", station: "refine", shape: "torus", position: [RX + 1.2, 4.6, -1.8], size: [1.6, 0.35, 1.6], rotation: [0, 0, 0], color: C.roller });
add({ id: "piston", station: "refine", shape: "box", position: [RX, 4.2, 0], size: [2.2, 1.2, 2.2], color: C.accent, emissive: "#3a2a00" });
add({ station: "refine", shape: "cylinder", position: [RX, 5.4, 0], size: [0.5, 1.8, 0.5], color: C.roller });
add({ id: "refine-roller", station: "refine", shape: "cylinder", position: [RX + 2.6, 2.8, 1.6], size: [1.2, 3.4, 1.2], rotation: [90, 0, 0], color: C.machineLight });

// Splitter: box with three glowing chevrons
add({ station: "splitter", shape: "box", position: [6, 0, 0], size: [3.2, 5, 5], color: C.machine });
[-1.2, 0, 1.2].forEach((dz, i) =>
  add({ station: "splitter", shape: "box", position: [6, 3 - i * 1.2, dz], size: [3.4, 0.3, 0.3], rotation: [0, (i - 1) * 25, 0], color: C.blue, emissive: C.blue }),
);
// "CHOOSE" sign over the splitter (board 9)
add({ station: "splitter", shape: "box", position: [6, 7.4, -2.4], size: [6, 1.4, 0.2], color: C.white });
add({ station: "splitter", shape: "cylinder", position: [6, 5, -2.4], size: [0.25, 2.4, 0.25], color: C.roller });

// Machining lanes
// Press (top lane): base + column + moving head over the belt
add({ station: "machining", shape: "box", position: [19, 0, LANES[0] - 4], size: [3, 1, 3], color: C.machine });
add({ station: "machining", shape: "cylinder", position: [19, 1, LANES[0] - 4], size: [0.6, 5, 0.6], color: C.roller });
add({ station: "machining", shape: "box", position: [19, 5.5, LANES[0] - 2], size: [2.5, 0.6, 5], color: C.machineLight }); // arm
add({ id: "press-head", station: "machining", shape: "box", position: [19, 3.6, LANES[0]], size: [2, 1.4, 2], color: C.accent, emissive: "#3a2a00" });
// Drill (top lane): gantry + spinning bit
add({ station: "machining", shape: "cylinder", position: [27, 0, LANES[0] - 3], size: [0.4, 6, 0.4], color: C.roller });
add({ station: "machining", shape: "box", position: [27, 5.2, LANES[0] - 1], size: [2, 0.8, 4.4], color: C.machineLight });
add({ id: "drill-bit", station: "machining", shape: "cone", position: [27, 3.2, LANES[0]], size: [0.9, 1.6, 0.9], rotation: [180, 0, 0], color: C.blue, emissive: C.blue });
// Shaper (mid lane): box + cone marker + swinging blade
add({ station: "machining", shape: "box", position: [20, 0, LANES[1] - 4], size: [3, 3, 3], color: C.machine });
add({ station: "machining", shape: "cone", position: [20, 3, LANES[1] - 4], size: [1.2, 1.5, 1.2], color: C.blue, emissive: C.blue });
add({ id: "shaper-blade", station: "machining", shape: "box", position: [20, 3.4, LANES[1] - 2.2], size: [0.4, 0.4, 4.2], color: C.roller });
// Code box (mid lane)
add({ station: "machining", shape: "box", position: [29, 0, LANES[1] + 4], size: [2.5, 3, 2.5], color: C.machine });
add({ id: "code-ring", station: "machining", shape: "torus", position: [29, 1.6, LANES[1] + 2.7], size: [0.9, 0.12, 0.9], color: C.white, emissive: C.white });
// Robot arm (bottom lane): base, column, rotating arm with gripper
add({ station: "machining", shape: "box", position: [18, 0, LANES[2] + 4], size: [2, 1, 2], color: C.machine });
add({ station: "machining", shape: "cylinder", position: [18, 1, LANES[2] + 4], size: [0.35, 3.5, 0.35], color: C.roller });
// Stamp (bottom lane): plate on pole
add({ station: "machining", shape: "cylinder", position: [25, 0, LANES[2] + 3], size: [0.3, 6, 0.3], color: C.roller });
add({ station: "machining", shape: "box", position: [25, 5.4, LANES[2] + 1.5], size: [1, 0.6, 3.5], color: C.machineLight });
add({ id: "stamp-head", station: "machining", shape: "box", position: [25, 3.6, LANES[2]], size: [2.5, 0.8, 2], color: C.red, emissive: "#3a1010" });
// Sign
add({ station: "machining", shape: "box", position: [31, 5, LANES[2] + 4], size: [5, 1.4, 0.2], color: C.white });
add({ station: "machining", shape: "cylinder", position: [31, 0, LANES[2] + 4], size: [0.2, 5, 0.2], color: C.roller });

// ─── assembly machine (boards 12-14) ────────────────────────────────────────
add({ station: "assembly", shape: "box", position: [ASM.x, 0, 0], size: [ASM.w, ASM.h, ASM.d], color: C.machine });
add({ station: "assembly", shape: "box", position: [ASM.x, ASM.h, 0], size: [ASM.w + 1.4, 1, ASM.d + 1.4], color: C.machineLight }); // roof slab
// roof vents (board 13)
for (let i = 0; i < 6; i++)
  add({ station: "assembly", shape: "box", position: [ASM.x - 3.2 + i * 1.3, ASM.h + 1, 0], size: [0.5, 0.4, ASM.d * 0.6], color: C.charcoal });
// in / out mouths
add({ station: "assembly", shape: "box", position: [ASM_IN_X - 0.05, 0.4, 0], size: [0.2, 3, 4.6], color: C.charcoal });
add({ station: "assembly", shape: "box", position: [ASM_OUT_X + 0.05, 0.4, 0], size: [0.2, 3.4, 4.6], color: C.charcoal });
add({ id: "asm-exit-light", station: "assembly", shape: "box", position: [ASM_OUT_X + 0.2, 3.9, 0], size: [0.2, 0.4, 4.8], color: C.accent, emissive: C.accent });
// front face: three lit windows + a long panel (board 14)
for (let i = 0; i < 3; i++)
  add({ id: `asm-window-${i}`, station: "assembly", shape: "box", position: [ASM.x - 3 + i * 3, 4.4, ASM.d / 2 + 0.06], size: [2.2, 1.6, 0.1], color: C.blue, emissive: C.blue });
add({ station: "assembly", shape: "box", position: [ASM.x, 2.2, ASM.d / 2 + 0.06], size: [8, 1.4, 0.1], color: C.machineLight });
add({ id: "asm-drum", station: "assembly", shape: "torus", position: [ASM.x - 2.6, 6.2, ASM.d / 2 + 0.2], size: [2.6, 0.3, 2.6], color: C.roller });
add({ id: "asm-piston", station: "assembly", shape: "box", position: [ASM.x + 2.4, ASM.h + 1, 0], size: [1.6, 2.2, 1.6], color: C.accent, emissive: "#3a2a00" });
// "ASSEMBLY" sign hanging off the right shoulder (board 12)
add({ station: "assembly", shape: "box", position: [ASM.x + 7.6, 7.4, -3], size: [7, 1.8, 0.25], color: C.white });
add({ station: "assembly", shape: "cylinder", position: [ASM.x + 5, 8.2, -3], size: [0.18, 1.6, 0.18], color: C.roller });
add({ station: "assembly", shape: "cylinder", position: [ASM.x + 10, 8.2, -3], size: [0.18, 1.6, 0.18], color: C.roller });
[C.accent, C.blue, C.red].forEach((col, i) =>
  add({ id: `asm-lamp-${i}`, station: "assembly", shape: "sphere", position: [ASM.x - 4.2, 5.4 - i * 1.1, ASM.d / 2 + 0.3], size: [0.5, 0.5, 0.5], color: col, emissive: col }),
);

// ─── reveal: framing pillars + "PROJET" sign (boards 15-16) ─────────────────
for (const [x, z] of REVEAL_PILLARS) {
  add({ station: "reveal", shape: "box", position: [x, 0, z], size: [1.3, 16, 1.3], color: C.machine });
  add({ station: "reveal", shape: "box", position: [x, 15.6, z], size: [2.1, 0.5, 2.1], color: C.machineLight });
}
add({ station: "reveal", shape: "box", position: [63, 4.4, -7.4], size: [12, 3.2, 0.3], color: C.white });
for (const x of [58, 68]) add({ station: "reveal", shape: "cylinder", position: [x, 0, -7.4], size: [0.22, 4.4, 0.22], color: C.roller });

// ─── shipping bay: columns, roof beams, hanging lamps (board 17) ────────────
for (const x of [62, 74, 86]) {
  for (const sz of [-1, 1])
    add({ station: "bay", shape: "box", position: [x, 0, sz * BAY.columnZ], size: [1.1, BAY.ceiling, 1.1], color: C.machine });
  add({ station: "bay", shape: "box", position: [x, BAY.ceiling, 0], size: [1.1, 0.7, BAY.columnZ * 2 + 1.1], color: C.machineLight });
}
add({ station: "bay", shape: "box", position: [74, BAY.ceiling - 1.4, 9], size: [30, 0.16, 0.16], color: C.roller }); // lamp cable
for (const x of [62, 68, 74, 80, 86])
  add({ id: `bay-lamp-${x}`, station: "bay", shape: "box", position: [x, BAY.ceiling - 2.2, 9], size: [2.6, 0.25, 0.9], color: C.white, emissive: C.white });

// ─── truck + loading ramp (boards 17-18) ────────────────────────────────────
add({ station: "ship", shape: "box", position: [TRUCK.x, TRUCK.bedY - 0.3, 0], size: [TRUCK.length, 0.3, TRUCK.width], color: C.machineLight }); // bed
add({ station: "ship", shape: "box", position: [TRUCK.x, 0.35, 0], size: [TRUCK.length - 1.5, 0.65, TRUCK.width - 1.4], color: C.charcoal }); // chassis
for (const sz of [-1, 1])
  add({ station: "ship", shape: "box", position: [TRUCK.x, TRUCK.bedY, (sz * TRUCK.width) / 2], size: [TRUCK.length, 2.4, 0.3], color: C.red });
add({ station: "ship", shape: "box", position: [TRUCK.x + TRUCK.length / 2, TRUCK.bedY, 0], size: [0.3, 3, TRUCK.width], color: C.red }); // headboard
add({ station: "ship", shape: "box", position: [TRUCK.x + TRUCK.length / 2 + 2, 0, 0], size: [3.6, 4.2, TRUCK.width - 0.6], color: C.white }); // cab
add({ station: "ship", shape: "box", position: [TRUCK.x + TRUCK.length / 2 + 3.85, 2.4, 0], size: [0.1, 1.2, 4.4], color: "#274b6e", emissive: "#274b6e" }); // windscreen
for (const x of [TRUCK.x - 4, TRUCK.x + 2, TRUCK.x + 7])
  for (const sz of [-1, 1])
    add({ station: "ship", shape: "cylinder", position: [x, 0.9, (sz * (TRUCK.width - 0.6)) / 2], size: [1.8, 0.6, 1.8], rotation: [90, 0, 0], color: C.charcoal });
// pallet on the bed — where the crate goes
add({ id: "pallet", station: "ship", shape: "box", position: [TRUCK.x - 2.5, TRUCK.bedY, 0], size: [3, 0.25, 3], color: "#5a4632" });
for (const dz of [-1, 0, 1])
  add({ station: "ship", shape: "box", position: [TRUCK.x - 2.5, TRUCK.bedY + 0.25, dz * 1.1], size: [3, 0.12, 0.5], color: "#6b543c" });
// loading ramp
{
  const len = Math.hypot(RAMP.xEnd - RAMP.xStart, TRUCK.bedY);
  const tilt = Math.atan2(TRUCK.bedY, RAMP.xEnd - RAMP.xStart) * (180 / Math.PI);
  add({ id: "ramp", station: "ship", shape: "box", position: [(RAMP.xStart + RAMP.xEnd) / 2, TRUCK.bedY / 2 - 0.15, RAMP.z], size: [len, 0.3, RAMP.width], rotation: [0, 0, tilt], color: C.machineLight });
  for (const sz of [-1, 1])
    add({ station: "ship", shape: "box", position: [(RAMP.xStart + RAMP.xEnd) / 2, TRUCK.bedY / 2 + 0.3, RAMP.z + (sz * RAMP.width) / 2], size: [len, 0.5, 0.2], rotation: [0, 0, tilt], color: C.hazardYellow });
}
// "DRIVE TO SHIP!" sign next to the ramp
add({ station: "ship", shape: "box", position: [78, 5.4, -8], size: [8, 1.6, 0.25], color: C.white });
add({ station: "ship", shape: "cylinder", position: [78, 0, -8], size: [0.22, 5.4, 0.22], color: C.roller });

export const PARTS = parts;

// ─── scene plan (camera spots + animated idea path) ─────────────────────────
export interface CameraSpot {
  position: [number, number, number];
  target: [number, number, number];
  title: string;
  note?: string;
}

export interface IdeaSegment {
  id: string;
  to: [number, number, number];
  duration: number;
  ease?: "linear" | "in" | "out";
}

export interface FactoryPlan {
  floor: { width: number; depth: number; color: string };
  conveyors: Conveyor[];
  parts: Part[];
  ideaStart: [number, number, number];
  ideaPath: IdeaSegment[];
  spots: CameraSpot[];
}

const IDEA_Y = BELT_H + 0.9;

const sceneParts: Part[] = [
  ...parts,
  ...IDEA_SEEDS.map((position, i) => ({
    id: `idea-${i}`,
    shape: "octa" as const,
    position,
    size: [0.7, 1.1, 0.7] as [number, number, number],
    color: C.charcoal,
    emissive: C.accent,
  })),
];

export const FACTORY_PLAN: FactoryPlan = {
  floor: { width: 190, depth: 100, color: C.floor },
  conveyors: CONVEYORS,
  parts: sceneParts,
  ideaStart: [-19, IDEA_Y, 0],
  ideaPath: [
    { id: "switch", to: [-14, IDEA_Y, 0], duration: 3 },
    { id: "refine", to: [-7, IDEA_Y, 0], duration: 4, ease: "in" },
    { id: "splitter", to: [6, IDEA_Y, 0], duration: 3 },
    { id: "lanes", to: [34, IDEA_Y, 0], duration: 5 },
    { id: "merge", to: [MERGE_X, IDEA_Y, 0], duration: 2 },
    { id: "assembly", to: [ASM.x, IDEA_Y, 0], duration: 3, ease: "in" },
    { id: "delivery", to: [CRATE_END[0], CRATE_END[1], 0], duration: 4 },
  ],
  spots: [
    { position: [-17, 4.5, 9], target: [-19, 1.9, 0], title: "Ideas Switch", note: "Raw ideas enter the hopper." },
    { position: [-9.5, 12, 3.5], target: [-8, 2, 0], title: "Refine", note: "Open-top machine — look inside." },
    { position: [2, 4, 8], target: [4, 1.9, 0], title: "Splitter", note: "One stream becomes three lanes." },
    { position: [16, 9, 22], target: [20, 1.5, 0], title: "Machining", note: "Press, drill, shaper, stamp." },
    { position: [40, 7, 17], target: [ASM.x, 3, 0], title: "Assembly", note: "The three lanes come back together." },
    { position: [56, 4.5, 13], target: [59, 2, 0], title: "Project", note: "The finished crate rolls out." },
    { position: [72, 5, 14], target: [78, 1.5, 0], title: "Drive to ship", note: "Load the crate onto the truck." },
  ],
};
