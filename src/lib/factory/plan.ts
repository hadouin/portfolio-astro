/**
 * Factory world data — from the storyboard.
 *
 * Flow (left → right, +x):
 *   Ideas cloud → H machine (hopper + safety lever) → belt → Refine (open top) → belt →
 *   Splitter → 3 machining lanes → belts over the tower opening → shaft goes BELOW ground →
 *   underground delivery line + hangar + forklift.
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
export const LANE_END_Z = [-2.5, 0, 2.5] as const;

export const TOWER_X = 45;
export const TOWER_W = 9;
export const TOWER_D = 12;
export const TOWER_DEPTH = 44; // shaft goes from y=0 down to -TOWER_DEPTH
export const UNDER_Y = -TOWER_DEPTH; // underground floor level

export const HOPPER_POS: [number, number, number] = [-24, 7.6, 0];
export const H_EXIT_POS: [number, number, number] = [-20.4, 2.4, 0];
export const LEVER_PIVOT: [number, number, number] = [-24, 3.1, 3.3];
export const CRATE_START: [number, number, number] = [50.6, UNDER_Y + BELT_H, 0];
export const CRATE_END: [number, number, number] = [56.5, UNDER_Y + BELT_H, 0];
export const FORKLIFT_START = { position: [68, UNDER_Y, 3] as [number, number, number], heading: Math.PI };

// ─── dock / boat (underground level) ────────────────────────────────────────
export const DOCK_EDGE_Z = 18; // floor ends here, water beyond
export const WATER_Y = UNDER_Y - 1.4;
export const BOAT = { x: 70, z: 31, length: 26, width: 12, deckY: UNDER_Y + 1.5 };
export const RAMP = { x: BOAT.x, width: 10, zStart: DOCK_EDGE_Z - 2.5, zEnd: BOAT.z - BOAT.width / 2 + 0.6 };
/** Crates already loaded on the deck. */
export const DECK_CRATES: [number, number, number][] = [
  [63, BOAT.deckY, 29], [65.5, BOAT.deckY, 29], [63, BOAT.deckY, 33], [65.5, BOAT.deckY, 33], [76, BOAT.deckY, 33.5], [78.5, BOAT.deckY, 33.5],
];
export const DELIVERY_BELT = { x0: TOWER_X + TOWER_W / 2 + 0.2, x1: 57.5, halfW: 1.5, top: UNDER_Y + BELT_H };

export const IDEA_SEEDS: [number, number, number][] = [
  [-30, 3, -2], [-32, 4.5, 1.5], [-29, 5.5, 2], [-33, 2.5, -1], [-31, 6.5, -1.5], [-28, 2.2, 0.5],
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
  // feeds run over the tower opening and stop above the funnel
  { id: "c-feed-top", from: [34, LANES[0]], to: [43.5, LANE_END_Z[0]] },
  { id: "c-feed-mid", from: [34, LANES[1]], to: [43.5, LANE_END_Z[1]] },
  { id: "c-feed-bot", from: [34, LANES[2]], to: [43.5, LANE_END_Z[2]] },
  // underground delivery line from the shaft base
  { id: "c-delivery", from: [TOWER_X + TOWER_W / 2 + 0.2, 0], to: [57.5, 0], base: UNDER_Y },
];

// ─── parts ──────────────────────────────────────────────────────────────────
const parts: Part[] = [];
const add = (p: Part) => parts.push(p);

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

// Assembler tower: opening at ground level, shaft goes underground
add({ id: "tower-glass", station: "assembler", shape: "box", position: [TOWER_X, UNDER_Y, 0], size: [TOWER_W, TOWER_DEPTH, TOWER_D], color: "#9fc0e8", opacity: 0.14 });
[[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) =>
  add({ station: "assembler", shape: "box", position: [TOWER_X + (sx * TOWER_W) / 2, UNDER_Y, (sz * TOWER_D) / 2], size: [0.8, TOWER_DEPTH + 1.2, 0.8], color: C.charcoal }),
);
for (let y = UNDER_Y + 8; y < 0; y += 8) {
  for (const sz of [-1, 1]) add({ station: "assembler", shape: "box", position: [TOWER_X, y, (sz * TOWER_D) / 2], size: [TOWER_W + 0.6, 0.5, 0.6], color: C.machine });
  for (const sx of [-1, 1]) add({ station: "assembler", shape: "box", position: [TOWER_X + (sx * TOWER_W) / 2, y, 0], size: [0.6, 0.5, TOWER_D + 0.6], color: C.machine });
}
// crown at ground level + funnel hanging into the shaft
for (const sz of [-1, 1]) add({ station: "assembler", shape: "box", position: [TOWER_X, 0, (sz * (TOWER_D + 0.6)) / 2], size: [TOWER_W + 1.4, 1.2, 0.8], color: C.machine });
for (const sx of [-1, 1]) add({ station: "assembler", shape: "box", position: [TOWER_X + (sx * (TOWER_W + 0.6)) / 2, 0, 0], size: [0.8, 1.2, TOWER_D + 1.4], color: C.machine });
add({ station: "assembler", shape: "cone", position: [TOWER_X, -4.5, 0], size: [8, 4.5, 8], rotation: [180, 0, 0], color: C.machineLight, opacity: 0.85 });
add({ station: "assembler", shape: "sphere", position: [TOWER_X, 1.4, TOWER_D / 2 + 0.5], size: [0.9, 0.9, 0.9], color: C.red, emissive: C.red }); // beacon
// base block at the bottom with the exit mouth on +x
add({ station: "assembler", shape: "box", position: [TOWER_X, UNDER_Y, 0], size: [TOWER_W + 1, 3, TOWER_D + 1], color: C.machine });
add({ station: "assembler", shape: "box", position: [TOWER_X + TOWER_W / 2 + 0.35, UNDER_Y + 0.4, 0], size: [0.7, 2.8, 3.6], color: C.charcoal });
add({ station: "assembler", shape: "box", position: [TOWER_X + TOWER_W / 2 + 0.75, UNDER_Y + 3.4, 0], size: [0.3, 0.6, 3.8], color: C.accent, emissive: C.accent }); // exit light
[C.accent, C.blue, C.red].forEach((col, i) =>
  add({ station: "assembler", shape: "box", position: [TOWER_X - TOWER_W / 2 - 0.55, UNDER_Y + 2, 4 - i * 1.2], size: [0.1, 0.6, 0.6], color: col, emissive: col }),
);

// Underground hangar around the delivery line
[[54, -10], [54, 12], [66, -10], [66, 12]].forEach(([x, z]) =>
  add({ station: "delivery", shape: "cylinder", position: [x, UNDER_Y, z], size: [0.6, 12, 0.6], color: C.roller }),
);
add({ station: "delivery", shape: "box", position: [60, UNDER_Y + 12, 1], size: [14, 0.5, 24], color: C.machineLight });
[0, 2.5, 5].forEach((y) => add({ station: "delivery", shape: "box", position: [55, UNDER_Y + y, -8.5], size: [5, 0.3, 1.5], color: C.machineLight }));
add({ station: "delivery", shape: "cylinder", position: [68, UNDER_Y, 13], size: [0.15, 8, 0.15], color: C.roller });
add({ station: "delivery", shape: "box", position: [69.2, UNDER_Y + 6.8, 13], size: [2.4, 1.2, 0.1], color: C.accent, emissive: C.accent });
// dock: water, boat hull with a pointed bow, cabin, funnel, mast, gangway ramp, bollards
add({ station: "dock", shape: "box", position: [65, WATER_Y - 0.2, 32], size: [80, 0.2, 30], color: "#1d3a5c", emissive: "#0b1c30", opacity: 0.85 });
add({ station: "dock", shape: "box", position: [65, UNDER_Y - 3, DOCK_EDGE_Z - 0.5], size: [80, 3, 1], color: C.charcoal }); // quay wall
[58, 66, 82].forEach((x) => add({ station: "dock", shape: "cylinder", position: [x, UNDER_Y, DOCK_EDGE_Z - 1.2], size: [0.6, 1.1, 0.6], color: C.charcoal }));
add({ id: "boat-hull", station: "dock", shape: "box", position: [BOAT.x, WATER_Y - 0.6, BOAT.z], size: [BOAT.length, BOAT.deckY - WATER_Y + 0.6, BOAT.width], color: "#7a2e2e" });
add({ station: "dock", shape: "box", position: [BOAT.x + BOAT.length / 2 + 1.2, WATER_Y - 0.6, BOAT.z], size: [BOAT.width * 0.71, BOAT.deckY - WATER_Y + 0.6, BOAT.width * 0.71], rotation: [0, 45, 0], color: "#7a2e2e" }); // bow
add({ station: "dock", shape: "box", position: [BOAT.x, BOAT.deckY - 0.3, BOAT.z], size: [BOAT.length, 0.3, BOAT.width], color: "#5a4632" }); // deck
add({ station: "dock", shape: "box", position: [BOAT.x, BOAT.deckY, BOAT.z + BOAT.width / 2 - 0.2], size: [BOAT.length, 1.0, 0.3], color: "#7a2e2e" }); // far gunwale
add({ station: "dock", shape: "box", position: [BOAT.x - BOAT.length / 2 + 0.2, BOAT.deckY, BOAT.z], size: [0.3, 1.0, BOAT.width], color: "#7a2e2e" }); // stern gunwale
add({ station: "dock", shape: "box", position: [BOAT.x - 9, BOAT.deckY, BOAT.z + 1], size: [5, 4, 7], color: C.white }); // cabin
add({ station: "dock", shape: "box", position: [BOAT.x - 9, BOAT.deckY + 2.2, BOAT.z + 4.55], size: [3.2, 1.2, 0.05], color: "#274b6e", emissive: "#274b6e" }); // window
add({ station: "dock", shape: "cylinder", position: [BOAT.x - 11.5, BOAT.deckY + 4, BOAT.z + 1], size: [1.4, 3, 1.4], color: C.red }); // funnel
add({ station: "dock", shape: "cylinder", position: [BOAT.x + 6, BOAT.deckY, BOAT.z + 4], size: [0.25, 9, 0.25], color: C.roller }); // mast
add({ station: "dock", shape: "box", position: [BOAT.x + 6.9, BOAT.deckY + 8, BOAT.z + 4], size: [1.8, 1.1, 0.06], color: C.accent, emissive: C.accent }); // flag
{
  const len = Math.hypot(RAMP.zEnd - RAMP.zStart, BOAT.deckY - UNDER_Y);
  const tilt = -Math.atan2(BOAT.deckY - UNDER_Y, RAMP.zEnd - RAMP.zStart) * (180 / Math.PI);
  add({ id: "ramp", station: "dock", shape: "box", position: [RAMP.x, (BOAT.deckY + UNDER_Y) / 2 - 0.15, (RAMP.zStart + RAMP.zEnd) / 2], size: [RAMP.width, 0.3, len], rotation: [tilt, 0, 0], color: C.machineLight });
  for (const sx of [-1, 1]) add({ station: "dock", shape: "box", position: [RAMP.x + (sx * RAMP.width) / 2, (BOAT.deckY + UNDER_Y) / 2 + 0.3, (RAMP.zStart + RAMP.zEnd) / 2], size: [0.2, 0.9, len], rotation: [tilt, 0, 0], color: C.hazardYellow });
}
add({ station: "dock", shape: "box", position: [BOAT.x, BOAT.deckY + 2.6, DOCK_EDGE_Z + 1.5], size: [7, 1.2, 0.15], color: C.white }); // "SHIP" sign
add({ station: "dock", shape: "cylinder", position: [BOAT.x - 4, UNDER_Y, DOCK_EDGE_Z + 1.4], size: [0.15, 5, 0.15], color: C.roller });
add({ station: "dock", shape: "cylinder", position: [BOAT.x + 4, UNDER_Y, DOCK_EDGE_Z + 1.4], size: [0.15, 5, 0.15], color: C.roller });

// underground ceiling lights
[[52, -6], [52, 8], [62, -6], [62, 8]].forEach(([x, z], i) =>
  add({ id: `under-lamp-${i}`, station: "delivery", shape: "box", position: [x, UNDER_Y + 11.4, z], size: [3, 0.2, 0.6], color: C.white, emissive: C.white }),
);

export const PARTS = parts;

// ─── scene plan (camera spots + animated idea path) ─────────────────────────
export interface CameraSpot {
  position: [number, number, number];
  target: [number, number, number];
  title: string;
  note?: string;
  follow?: {
    fromSegment: string;
    toSegment: string;
    offset: [number, number, number];
  };
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
  // simplified forklift meshes (scene nudges them on x)
  { id: "forklift-body", shape: "box", position: [67, UNDER_Y + 1.1, 9], size: [2.8, 1.2, 2], color: C.accent },
  { id: "forklift-mast", shape: "box", position: [68.65, UNDER_Y + 2.5, 9], size: [0.18, 4.4, 0.18], color: C.roller },
  { id: "forklift-fork-l", shape: "box", position: [70, UNDER_Y + 0.16, 8.5], size: [2.2, 0.12, 0.26], color: C.roller },
  { id: "forklift-fork-r", shape: "box", position: [70, UNDER_Y + 0.16, 9.5], size: [2.2, 0.12, 0.26], color: C.roller },
  ...([0, 1, 2, 3] as const).map((i) => ({
    id: `forklift-wheel-${i}`,
    shape: "cylinder" as const,
    position: [67 + (i < 2 ? 1 : -1.1), UNDER_Y + 0.5, 9 + (i % 2 ? 1.1 : -1.1)],
    size: [1, 0.4, 1] as [number, number, number],
    rotation: [90, 0, 0] as [number, number, number],
    color: C.charcoal,
  })),
];

export const FACTORY_PLAN: FactoryPlan = {
  floor: { width: 160, depth: 90, color: C.floor },
  conveyors: CONVEYORS,
  parts: sceneParts,
  ideaStart: [-19, IDEA_Y, 0],
  ideaPath: [
    { id: "switch", to: [-14, IDEA_Y, 0], duration: 3 },
    { id: "refine", to: [-7, IDEA_Y, 0], duration: 4, ease: "in" },
    { id: "splitter", to: [6, IDEA_Y, 0], duration: 3 },
    { id: "lanes", to: [34, IDEA_Y, 0], duration: 5 },
    { id: "feeds", to: [43.5, IDEA_Y, 0], duration: 3 },
    { id: "chute", to: [TOWER_X, -3, 0], duration: 4, ease: "in" },
    { id: "shaft", to: [TOWER_X, UNDER_Y + 2, 0], duration: 3, ease: "out" },
    { id: "delivery", to: [CRATE_START[0], CRATE_START[1], 0], duration: 4 },
  ],
  spots: [
    { position: [-17, 4.5, 9], target: [-19, 1.9, 0], title: "Ideas Switch", note: "Raw ideas enter the hopper." },
    { position: [-9.5, 12, 3.5], target: [-8, 2, 0], title: "Refine", note: "Open-top machine — look inside." },
    { position: [2, 4, 8], target: [4, 1.9, 0], title: "Splitter", note: "One stream becomes three lanes." },
    { position: [16, 9, 22], target: [20, 1.5, 0], title: "Machining", note: "Press, drill, shaper, stamp." },
    {
      position: [69, 10, 18],
      target: [TOWER_X, 0, 0],
      title: "Assembler Tower",
      note: "Parts fall through the shaft.",
      follow: { fromSegment: "chute", toSegment: "shaft", offset: [8, 6, 10] },
    },
    { position: [56, UNDER_Y + 4, 10], target: [50, UNDER_Y + 1.5, 0], title: "Underground Delivery", note: "Crate rolls out on the belt." },
    { position: [64, UNDER_Y + 3, 14], target: [67, UNDER_Y + 1.5, 9], title: "Forklift", note: "Pick up and carry the crate." },
  ],
};
