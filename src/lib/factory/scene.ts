import * as THREE from "three";
import {
  ASM, BAY, BAY_CRATES, C, CAB, CLAW, CONVEYORS, FORKLIFT_START, HOPPER_POS, H_EXIT_POS, IDEA_SEEDS,
  LANES, OUT_BELT, PARTS, RAMP, TRUCK,
} from "./plan";
import {
  COVER_OPEN, LEVER_ON, LEVER_REST, makeBeltTexture, makeClawRig, makeConveyor, makeCrate, makeFloors,
  makeGridTexture, makeHazardTexture, makeIdea, makeLever, makePart, type IdeaBuild,
} from "./build";
import { Forklift } from "./forklift";
import { CargoSystem } from "./cargo";
import { buildCameraKeys, CameraRail, CRATE_KEYS, GATES, IDEA_KEYS, pieceKeys, RANGES, samplePos, smoothstep } from "./timeline";

export type Phase = "grab" | "lever" | "popping" | "scroll" | "drive-fp" | "drive-tp";

export interface FactoryState {
  phase: Phase;
  progress: number;
  title: string;
  hint: string;
  /** True while the page scroll is held by the scene (interaction required). */
  held: boolean;
}

export interface FactorySceneOptions {
  canvas: HTMLCanvasElement;
  /** Tall scroll section. The scene sets its height; the canvas lives in a sticky child. */
  section: HTMLElement;
  onState?: (s: FactoryState) => void;
}

export interface FactorySceneHandle {
  dispose: () => void;
  skip: () => void;
  setKey: (code: string, down: boolean) => void;
}

/** Scroll distance (px) that drives the whole timeline once the lever is pulled. */
const SCROLL_LENGTH = 9000;
const ESCAPE_PX = 380;
// Front-on shots, like the storyboard: camera looks along -z, the belt runs left → right.
const GRAB_CAM = { cam: new THREE.Vector3(-30, 6.8, 20), look: new THREE.Vector3(-30, 4.6, 0) };
const LEVER_CAM = { cam: new THREE.Vector3(-24, 4.6, 14.5), look: new THREE.Vector3(-24, 3.4, 0) };
const POP_CAM = { cam: new THREE.Vector3(-21, 4.6, 15), look: new THREE.Vector3(-21, 2.6, 0) };

type Gesture = { deltaY: number; event: Event & { lenisStopPropagation?: boolean } };
type LenisLike = {
  stop: () => void;
  start: () => void;
  scrollTo: (t: number, o?: Record<string, unknown>) => void;
  on: (ev: string, cb: (...a: any[]) => void) => void;
  off: (ev: string, cb: (...a: any[]) => void) => void;
  isStopped: boolean;
};

/**
 * Thin adapter over the site's Lenis instance (falls back to native scrolling when Lenis is
 * absent, e.g. prefers-reduced-motion). Holding = `lenis.stop()`; gestures come from Lenis'
 * own `virtual-scroll` event so nothing fights its wheel/touch handling.
 */
function createScroller(onGesture: (g: Gesture) => void) {
  const lenis = (window as any).lenis as LenisLike | undefined;
  let held = false;
  if (lenis) {
    const cb = (g: Gesture) => onGesture(g);
    lenis.on("virtual-scroll", cb);
    return {
      lenis: true,
      get held() { return held; },
      hold(y?: number) {
        held = true;
        if (y !== undefined) lenis.scrollTo(y, { immediate: true, force: true });
        lenis.stop();
      },
      release() { held = false; lenis.start(); },
      /** Re-assert a hold if something (the first-load loader) restarted Lenis behind our back. */
      enforce() { if (held && !lenis.isStopped) lenis.stop(); },
      snapTo(y: number) { lenis.scrollTo(y, { immediate: true, force: true }); },
      scrollTo(y: number) { lenis.scrollTo(y, { duration: 1.1, force: true }); },
      dispose() { lenis.off("virtual-scroll", cb); if (held) lenis.start(); },
    };
  }
  const html = document.documentElement;
  const onWheel = (e: WheelEvent) => {
    onGesture({ deltaY: e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY, event: e });
    if (held && e.cancelable) e.preventDefault();
  };
  let touchY = 0;
  const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0].clientY; };
  const onTouchMove = (e: TouchEvent) => {
    const y = e.touches[0].clientY;
    onGesture({ deltaY: (touchY - y) * 2, event: e });
    touchY = y;
    if (held && e.cancelable) e.preventDefault();
  };
  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  return {
    lenis: false,
    get held() { return held; },
    hold(y?: number) { held = true; if (y !== undefined) window.scrollTo(0, y); html.classList.add("factory-locked"); },
    release() { held = false; html.classList.remove("factory-locked"); },
    enforce() { /* nothing can restart native holds */ },
    snapTo(y: number) { window.scrollTo(0, y); },
    scrollTo(y: number) { window.scrollTo({ top: y, behavior: "smooth" }); },
    dispose() {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      html.classList.remove("factory-locked");
    },
  };
}

export function createFactoryScene({ canvas, section, onState }: FactorySceneOptions): FactorySceneHandle {
  section.style.height = `calc(100svh + ${SCROLL_LENGTH}px)`;
  const bg = getComputedStyle(document.documentElement).getPropertyValue("--factory-bg").trim() || C.bg;

  // ── renderer / scene / camera ──
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);
  scene.fog = new THREE.Fog(bg, 70, 190);
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 400);
  camera.position.copy(GRAB_CAM.cam);
  camera.lookAt(GRAB_CAM.look);

  // ── lights ──
  scene.add(new THREE.HemisphereLight("#9aa4b8", "#141414", 1.0));
  const key = new THREE.DirectionalLight("#fff1d6", 2.4);
  key.position.set(30, 50, 25);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0005;
  Object.assign(key.shadow.camera, { left: -70, right: 70, top: 40, bottom: -40, near: 1, far: 160 });
  scene.add(key);
  const rim = new THREE.DirectionalLight(C.blue, 0.8);
  rim.position.set(-30, 20, -40);
  scene.add(rim);
  const front = new THREE.DirectionalLight("#ffffff", 0.7);
  front.position.set(-24, 12, 40);
  scene.add(front);
  // assembly + shipping bay pools of light
  const asmLight = new THREE.PointLight(C.blue, 45, 40, 1.6);
  asmLight.position.set(ASM.x, 9, 6);
  scene.add(asmLight);
  for (const x of [64, 76, 88]) {
    const l = new THREE.PointLight("#fff4e0", 60, 45, 1.5);
    l.position.set(x, BAY.ceiling - 3, 6);
    scene.add(l);
  }

  // ── static world ──
  const beltTex = makeBeltTexture();
  const hazardTex = makeHazardTexture();
  const gridTex = makeGridTexture();
  makeFloors(gridTex).forEach((o) => scene.add(o));
  const beltMaps: THREE.Texture[] = [];
  for (const c of CONVEYORS) {
    const b = makeConveyor(c, beltTex);
    scene.add(b.group);
    beltMaps.push(b.beltMap);
  }
  const named = new Map<string, THREE.Mesh>();
  const baseY = new Map<string, number>();
  for (const p of PARTS) {
    const m = makePart(p);
    scene.add(m);
    if (p.id) {
      named.set(p.id, m);
      baseY.set(p.id, m.position.y);
    }
  }
  const robot = new THREE.Group();
  robot.position.set(18, 4.5, LANES[2] + 4);
  {
    const steel = new THREE.MeshStandardMaterial({ color: C.roller, metalness: 0.4, roughness: 0.5 });
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 4.4), steel);
    arm.position.z = -2.2;
    const wrist = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.3), new THREE.MeshStandardMaterial({ color: C.accent, emissive: C.accent, emissiveIntensity: 0.8 }));
    wrist.position.set(0, -0.7, -4.2);
    arm.castShadow = wrist.castShadow = true;
    robot.add(arm, wrist);
  }
  scene.add(robot);

  const lever = makeLever(hazardTex);
  scene.add(lever.group);

  // playable claw over the cabinet + a warm pool of light inside the glass case
  const claw = makeClawRig(CLAW.railY, CLAW.railZ);
  scene.add(claw.group);
  const cabLight = new THREE.PointLight("#ffd9a0", 26, 18, 1.8);
  cabLight.position.set(CAB.x, 7, 1.5);
  scene.add(cabLight);

  // ── dynamic actors ──
  const seeds: IdeaBuild[] = IDEA_SEEDS.map((pos, i) => {
    const s = makeIdea(0.6, false, true);
    s.light.intensity = 1.6; // faint glow so the shards read through the glass
    s.group.position.set(...pos);
    s.group.userData.seedIndex = i;
    s.group.userData.home = new THREE.Vector3(...pos);
    scene.add(s.group);
    return s;
  });
  const idea = makeIdea(0.9, true, true);
  idea.group.visible = false;
  scene.add(idea.group);
  const pieces: IdeaBuild[] = [0, 1, 2].map(() => {
    const p = makeIdea(0.45, false, true);
    p.light.intensity = 2;
    p.group.visible = false;
    scene.add(p.group);
    return p;
  });
  const pieceKeySets = [0, 1, 2].map(pieceKeys);
  const crate = makeCrate();
  crate.visible = false;
  scene.add(crate);
  const forklift = new Forklift();
  forklift.place(FORKLIFT_START.position, FORKLIFT_START.heading);
  scene.add(forklift.group);

  // ── shipping bay terrain: hall floor, loading ramp, truck bed, walls ──
  const onBed = (x: number, z: number) =>
    x > TRUCK.x - TRUCK.length / 2 + 0.6 && x < TRUCK.x + TRUCK.length / 2 - 0.6 && Math.abs(z) < TRUCK.width / 2 - 0.7;
  const onRamp = (x: number, z: number) =>
    Math.abs(z - RAMP.z) < RAMP.width / 2 - 0.3 && x >= RAMP.xStart - 1.5 && x <= RAMP.xEnd + 0.5;
  const groundAt = (x: number, z: number): number | null => {
    if (onRamp(x, z)) return TRUCK.bedY * THREE.MathUtils.clamp((x - RAMP.xStart) / (RAMP.xEnd - RAMP.xStart), 0, 1);
    if (onBed(x, z)) return TRUCK.bedY;
    // truck body: sides, headboard and cab are solid (the bed and ramp are handled above)
    if (x > TRUCK.x - TRUCK.length / 2 - 0.6 && x < TRUCK.x + TRUCK.length / 2 + 5 && Math.abs(z) < TRUCK.width / 2 + 0.8) return null;
    if (x < BAY.x0 || x > BAY.x1 || Math.abs(z) > BAY.halfZ) return null; // hall walls / assembly machine
    return 0;
  };
  const supportAt = (x: number, z: number): number | null => {
    if (x > OUT_BELT.x0 - 0.5 && x < OUT_BELT.x1 + 0.5 && Math.abs(z) < OUT_BELT.halfW + 0.5) return OUT_BELT.top;
    if (Math.abs(x - (TRUCK.x - 2.5)) < 1.5 && Math.abs(z) < 1.5) return TRUCK.bedY + 0.37; // pallet on the bed
    return groundAt(x, z);
  };
  const cargo = new CargoSystem(scene, supportAt, 0);
  const mainCargo = cargo.add(crate);
  for (const pos of BAY_CRATES) {
    const c = makeCrate();
    c.position.set(...pos);
    c.rotation.y = (pos[0] * 7 + pos[2] * 3) % 0.6 - 0.3;
    scene.add(c);
    cargo.add(c);
  }

  const eye = forklift.eye(new THREE.Vector3());
  const eyeLook = eye.clone().add(forklift.forward(new THREE.Vector3()).multiplyScalar(10)).add(new THREE.Vector3(0, -2.2, 0));
  const rail = new CameraRail(buildCameraKeys(eye.toArray() as [number, number, number], eyeLook.toArray() as [number, number, number]));

  // ── state ──
  let phase: Phase = "grab";
  let progress = 0;
  let scratchDone = false;
  let coverOpen = false;
  let finished = false;
  let shipped = false;
  let armed = true;
  let escapeAcc = 0;
  let interacting = false;
  let phaseTime = 0;
  let releasedAt = 0;
  const camGoal = GRAB_CAM.cam.clone();
  const lookGoal = GRAB_CAM.look.clone();
  const lookCurrent = GRAB_CAM.look.clone();
  let camSnap = false;
  let lastState: FactoryState | null = null;

  // ── claw-machine mini-game (phase "grab") ──
  type ClawStep = "play" | "descend" | "close" | "raise" | "carry" | "release" | "home";
  let clawStep: ClawStep = "play";
  const clawPos = new THREE.Vector3(CAB.x, CLAW.idleY, 0); // x/z = trolley, y = head centre
  let clawJaw = 0.35; // 0 open … 1 closed
  let carried: IdeaBuild | null = null;
  let grabQueued = false;
  let misses = 0;
  const clawKeys = new Set<string>();
  const CLAW_MOVE = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

  const sectionTop = () => window.scrollY + section.getBoundingClientRect().top;
  const endY = () => sectionTop() + SCROLL_LENGTH;
  const gateY = () => sectionTop() + GATES.scratch * SCROLL_LENGTH;
  const rawProgress = () => THREE.MathUtils.clamp((window.scrollY - sectionTop()) / SCROLL_LENGTH, 0, 1);

  // ── scroll plumbing (built on Lenis) ──
  const scroller = createScroller(({ deltaY, event }) => {
    if (interacting) return;
    if (scroller.held) {
      if (phase === "grab") {
        // scrolling up at the very start lets the visitor leave
        escapeAcc = deltaY < 0 ? escapeAcc + deltaY : 0;
        if (escapeAcc < -ESCAPE_PX) releaseHold("up");
      } else if (phase === "drive-tp") {
        if (deltaY < 0) releaseHold("up");
        else if ((escapeAcc += deltaY) > ESCAPE_PX) releaseHold("down");
      }
      return;
    }
    // scratch gate: never let Lenis scroll past it until the shard is scratched
    if (phase === "scroll" && !scratchDone && deltaY > 0 && window.scrollY + deltaY >= gateY() - 1) {
      event.lenisStopPropagation = true;
      scroller.snapTo(gateY());
    }
  });

  function releaseHold(dir: "up" | "down") {
    if (!scroller.held) return;
    scroller.release();
    armed = false;
    releasedAt = performance.now();
    escapeAcc = 0;
    if (dir === "down") {
      finished = true;
      scroller.scrollTo(sectionTop() + section.offsetHeight);
    } else if (phase === "grab") {
      scroller.scrollTo(Math.max(0, sectionTop() - window.innerHeight * 0.7));
    }
    emit();
  }

  function setPhase(next: Phase) {
    phase = next;
    phaseTime = 0;
    escapeAcc = 0;
    if (next === "grab") { camGoal.copy(GRAB_CAM.cam); lookGoal.copy(GRAB_CAM.look); }
    if (next === "lever") { camGoal.copy(LEVER_CAM.cam); lookGoal.copy(LEVER_CAM.look); }
    if (next === "popping") { camGoal.copy(POP_CAM.cam); lookGoal.copy(POP_CAM.look); }
    canvas.style.cursor = "";
    emit();
  }

  function stateOf(): FactoryState {
    let title = "";
    let hint = "";
    const p = progress;
    switch (phase) {
      case "grab":
        title = "Claw machine";
        hint = clawStep === "carry" || clawStep === "release" || clawStep === "home"
          ? "Nice catch — into the hopper it goes"
          : clawStep === "play"
            ? (misses ? "Missed! Line up the claw and hit GRAB again" : "Arrows move the claw · GRAB to catch an idea")
            : "Grabbing…";
        break;
      case "lever": title = "Ideas switch"; hint = coverOpen ? "Throw the big lever" : "Lift the safety cover"; break;
      case "popping": title = "Ideas switch"; hint = ""; break;
      case "scroll":
        if (p < RANGES.scratchZoom[0]) { title = "Raw idea"; hint = "Scroll to follow your idea down the line"; }
        else if (p < RANGES.scratchZoom[1] + 0.02) { title = "Your idea is already gold"; hint = scratchDone ? "Keep scrolling" : "Scratch the charcoal to reveal the gold inside"; }
        else if (p < RANGES.shatter) { title = "Refinement"; hint = "Look inside the refiner"; }
        else if (p < RANGES.splitter[0]) { title = "Shattered"; hint = "One idea, many pieces"; }
        else if (p < RANGES.machining[0]) { title = "Splitter"; hint = "Choose a lane: three fields, three paths"; }
        else if (p < RANGES.machining[1]) { title = "Machining"; hint = "Every piece gets worked on"; }
        else if (p < RANGES.assemble[1]) { title = "Assembly"; hint = "The three lanes come back together"; }
        else if (p < 0.93) { title = "Out of the machine"; hint = "The finished crate rolls out"; }
        else { title = "Your project"; hint = "A fresh crate, version 1.0"; }
        break;
      case "drive-fp": title = "Drive to ship!"; hint = "Arrow keys: drive to the crate"; break;
      case "drive-tp":
        if (shipped) { title = "Shipped!"; hint = "Your project is loaded · scroll down to leave"; }
        else { title = "Playable transpalette"; hint = "↑ ↓ drive · ← → steer · W / S (or shift + ↑ ↓) raise and lower the forks · take the crate up the ramp onto the truck"; }
        break;
    }
    return { phase, progress, title, hint, held: scroller.held };
  }

  function emit() {
    const s = stateOf();
    if (
      !lastState || lastState.phase !== s.phase || lastState.title !== s.title || lastState.hint !== s.hint ||
      lastState.held !== s.held || Math.abs(lastState.progress - s.progress) > 0.003
    ) {
      lastState = s;
      onState?.(s);
    }
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (phase === "grab" && scroller.held) {
      if (CLAW_MOVE.includes(e.code)) { e.preventDefault(); clawKeys.add(e.code); return; }
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        if (clawStep === "play") grabQueued = true;
        return;
      }
    }
    const drive = phase === "drive-fp" || phase === "drive-tp";
    if (drive && scroller.held && Forklift.handles(e)) {
      e.preventDefault();
      for (const t of Forklift.tokens(e)) forklift.keys.add(t);
    }
  };
  const onKeyUp = (e: KeyboardEvent) => {
    clawKeys.delete(e.code);
    for (const t of Forklift.tokens(e)) forklift.keys.delete(t);
  };
  // a key held while the tab loses focus never fires keyup: the claw or forks would stay stuck moving
  const onBlur = () => { forklift.keys.clear(); clawKeys.clear(); };
  const onLoaderDone = () => scroller.enforce();
  const onScroll = () => {
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    document.body.classList.toggle("factory-active", rect.top < vh * 0.5 && rect.bottom > vh * 0.5);
    if (scroller.held) { scroller.enforce(); return; }
    // entering from above while the machine still needs an idea: hold at the top of the section
    if (phase === "grab" && !finished) {
      if (rect.top > 40) armed = true;
      if (armed && performance.now() - releasedAt > 1200 && rect.top <= 0 && rect.top > -vh) scroller.hold(sectionTop());
    }
  };
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("hadouin:loader-done", onLoaderDone);

  // ── pointer interactions ──
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  let scratching = false;
  let strokes = 0;
  let inserting: { seed: IdeaBuild; from: THREE.Vector3; t: number } | null = null;
  let leverT = -1;
  let coverT = -1;

  function updatePointer(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
  }
  const inScratchWindow = () => phase === "scroll" && !scratchDone && progress >= RANGES.scratchZoom[0] - 0.01;

  function paintScratch(uv: THREE.Vector2) {
    const s = idea.scratch!;
    s.ctx.fillStyle = "#000";
    s.ctx.beginPath();
    s.ctx.arc(uv.x * 256, (1 - uv.y) * 256, 20, 0, Math.PI * 2);
    s.ctx.fill();
    s.texture.needsUpdate = true;
    if (++strokes % 5 === 0 && s.ratio() > 0.38) {
      scratchDone = true;
      scratching = false;
      canvas.style.cursor = "";
      emit();
    }
  }

  const grabBtn = named.get("grab-btn");
  const onPointerDown = (e: PointerEvent) => {
    updatePointer(e);
    if (phase === "grab") {
      // the big red dome on the cabinet works like the on-screen GRAB button
      if (clawStep === "play" && grabBtn && raycaster.intersectObject(grabBtn, false).length) grabQueued = true;
    } else if (phase === "lever") {
      if (!coverOpen && coverT < 0 && raycaster.intersectObject(lever.cover, false).length) {
        coverT = 0;
      } else if (coverOpen && leverT < 0 && raycaster.intersectObject(lever.hit, false).length) {
        leverT = 0;
      }
      canvas.style.cursor = "";
    } else if (inScratchWindow()) {
      const hit = raycaster.intersectObject(idea.shell, false)[0];
      if (hit?.uv) {
        scratching = true;
        interacting = true;
        canvas.setPointerCapture(e.pointerId);
        paintScratch(hit.uv);
      }
    }
  };
  const onPointerMove = (e: PointerEvent) => {
    updatePointer(e);
    if (scratching) {
      const hit = raycaster.intersectObject(idea.shell, false)[0];
      if (hit?.uv) paintScratch(hit.uv);
      return;
    }
    let cursor = "";
    if (phase === "grab" && clawStep === "play" && grabBtn && raycaster.intersectObject(grabBtn, false).length) cursor = "pointer";
    else if (phase === "lever" && !coverOpen && coverT < 0 && raycaster.intersectObject(lever.cover, false).length) cursor = "pointer";
    else if (phase === "lever" && coverOpen && leverT < 0 && raycaster.intersectObject(lever.hit, false).length) cursor = "pointer";
    else if (inScratchWindow() && raycaster.intersectObject(idea.shell, false).length) cursor = "crosshair";
    canvas.style.cursor = cursor;
  };
  const onPointerUp = (e: PointerEvent) => {
    scratching = false;
    interacting = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch { /* not captured */ }
  };
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  // ── resize / visibility ──
  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    const pr = renderer.getPixelRatio();
    if (canvas.width !== Math.floor(w * pr) || canvas.height !== Math.floor(h * pr)) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      // pull the grab camera back on narrow viewports so cabinet + hopper both stay in frame
      const z = Math.max(20, 8.5 / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect));
      GRAB_CAM.cam.set(-30, 6.8 + (z - 20) * 0.08, z);
      if (phase === "grab") camGoal.copy(GRAB_CAM.cam);
    }
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
  io.observe(canvas);
  onScroll();

  // ── per-frame ──
  const clock = new THREE.Clock();
  const pieceAct = new THREE.Vector3();
  const hopper = new THREE.Vector3(...HOPPER_POS);
  const hExit = new THREE.Vector3(...H_EXIT_POS);
  const ideaStart = new THREE.Vector3(...IDEA_KEYS[0].pos);
  const chaseCam = new THREE.Vector3();
  const chaseLook = new THREE.Vector3();
  let raf = 0;

  function animateMachines(t: number, dt: number) {
    const p = progress;
    const act = phase === "scroll" ? smoothstep(RANGES.machining[0] - 0.03, RANGES.machining[0] + 0.02, p) * (1 - smoothstep(RANGES.machining[1], RANGES.machining[1] + 0.03, p)) : 0;
    const bob = (f: number, ph = 0) => 0.5 + 0.5 * Math.sin(t * f + ph);
    const set = (id: string, fn: (m: THREE.Mesh, base: number) => void) => { const m = named.get(id); if (m) fn(m, baseY.get(id)!); };
    set("press-head", (m, b) => { m.position.y = b - act * bob(4) * 1.3; });
    set("drill-bit", (m, b) => { m.rotation.y += dt * 24 * act; m.position.y = b - act * bob(3, 1) * 0.7; });
    set("shaper-blade", (m) => { m.rotation.y = Math.sin(t * 3) * 0.7 * act; });
    set("code-ring", (m) => { m.rotation.z += dt * 2.5 * act; });
    set("stamp-head", (m, b) => { m.position.y = b - act * bob(4, 2) * 1.1; });
    robot.rotation.y = Math.sin(t * 2) * 0.6 * act;
    robot.rotation.x = Math.max(0, Math.sin(t * 4)) * 0.25 * act;

    const ref = phase === "scroll" ? smoothstep(RANGES.refine[0] - 0.02, RANGES.refine[0] + 0.02, p) * (1 - smoothstep(RANGES.refine[1], RANGES.refine[1] + 0.03, p)) : 0;
    set("gear-1", (m) => { m.rotation.z += dt * (0.4 + 3 * ref); });
    set("gear-2", (m) => { m.rotation.z -= dt * (0.6 + 4.5 * ref); });
    set("piston", (m, b) => { m.position.y = b - ref * bob(6) * 1.2; });
    set("refine-roller", (m) => { m.rotation.x += dt * (0.5 + 4 * ref); });
    for (let i = 0; i < 3; i++) set(`refine-light-${i}`, (m) => {
      (m.material as THREE.MeshStandardMaterial).emissiveIntensity = ref > 0.1 ? (Math.sin(t * 8 + i * 2) > 0 ? 1.8 : 0.15) : 0.9;
    });
    const asm = phase === "scroll" ? smoothstep(RANGES.assemble[0] - 0.03, RANGES.assemble[0] + 0.02, p) * (1 - smoothstep(RANGES.crate[0], RANGES.crate[0] + 0.03, p)) : 0;
    set("asm-piston", (m, b) => { m.position.y = b + asm * bob(5) * 1.2; });
    set("asm-drum", (m) => { m.rotation.z += dt * (0.3 + 3.5 * asm); });
    for (let i = 0; i < 3; i++) set(`asm-window-${i}`, (m) => {
      (m.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.35 + asm * (0.6 + 0.9 * bob(5, i * 1.4));
    });
    for (let i = 0; i < 3; i++) set(`asm-lamp-${i}`, (m) => {
      (m.material as THREE.MeshStandardMaterial).emissiveIntensity = asm > 0.1 ? (Math.sin(t * 7 + i * 2) > 0 ? 1.8 : 0.15) : 0.7;
    });

    // claw-machine marquee strip + GRAB dome pulse while the game is live (board 1)
    const grab = phase === "grab" ? 1 : 0;
    set("cab-light", (m) => {
      (m.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5 + (0.5 + 0.6 * bob(2.2)) * grab;
    });
    set("grab-btn", (m) => {
      (m.material as THREE.MeshStandardMaterial).emissiveIntensity = grab && clawStep === "play" ? 0.6 + 0.8 * bob(3) : 0.25;
    });

    set("hopper-ring", (m) => {
      (m.material as THREE.MeshStandardMaterial).emissiveIntensity = phase === "grab" ? 0.6 + 0.6 * Math.sin(t * 4) : 0.4;
    });
    set("switch-light", (m) => {
      const mat = m.material as THREE.MeshStandardMaterial;
      if (phase === "lever") { mat.color.set(C.accent); mat.emissive.set(C.accent); mat.emissiveIntensity = 0.6 + 0.8 * bob(6); }
      else if (phase !== "grab") { mat.color.set("#7ee2a0"); mat.emissive.set("#7ee2a0"); mat.emissiveIntensity = 1.2; }
    });
  }

  /**
   * Claw mini-game: arrows steer the trolley, GRAB runs drop → close → raise; a successful
   * catch auto-carries the shard over the H hopper and drops it in (the `inserting` animation
   * then swallows it and flips the phase to "lever").
   */
  function updateClaw(dt: number) {
    const move = (cur: number, to: number, v: number) => cur + THREE.MathUtils.clamp(to - cur, -v * dt, v * dt);
    const jawTo = (to: number) => { clawJaw = move(clawJaw, to, 2.5); };
    switch (clawStep) {
      case "play": {
        jawTo(0.35);
        const mx = (clawKeys.has("ArrowRight") ? 1 : 0) - (clawKeys.has("ArrowLeft") ? 1 : 0);
        const mz = (clawKeys.has("ArrowDown") ? 1 : 0) - (clawKeys.has("ArrowUp") ? 1 : 0);
        clawPos.x = THREE.MathUtils.clamp(clawPos.x + mx * CLAW.speed * dt, CLAW.bounds.x0, CLAW.bounds.x1);
        clawPos.z = THREE.MathUtils.clamp(clawPos.z + mz * CLAW.speed * dt, CLAW.bounds.z0, CLAW.bounds.z1);
        clawPos.y = move(clawPos.y, CLAW.idleY, CLAW.vSpeed);
        if (grabQueued && phase === "grab") { clawStep = "descend"; emit(); }
        grabQueued = false;
        break;
      }
      case "descend":
        jawTo(0);
        clawPos.y = move(clawPos.y, CLAW.grabY, CLAW.vSpeed);
        if (clawPos.y === CLAW.grabY) clawStep = "close";
        break;
      case "close":
        jawTo(1);
        if (clawJaw >= 1) {
          carried = seeds.find((s) =>
            s.group.visible && Math.hypot(s.group.position.x - clawPos.x, s.group.position.z - clawPos.z) < CLAW.catchRadius) ?? null;
          if (!carried) misses++;
          clawStep = "raise";
          emit();
        }
        break;
      case "raise":
        clawPos.y = move(clawPos.y, CLAW.carryY, CLAW.vSpeed);
        if (clawPos.y === CLAW.carryY) clawStep = carried ? "carry" : "play";
        break;
      case "carry":
        clawPos.x = move(clawPos.x, HOPPER_POS[0], CLAW.speed);
        clawPos.z = move(clawPos.z, HOPPER_POS[2], CLAW.speed);
        if (clawPos.x === HOPPER_POS[0] && clawPos.z === HOPPER_POS[2]) clawStep = "release";
        break;
      case "release":
        jawTo(0);
        if (clawJaw <= 0 && carried) {
          inserting = { seed: carried, from: carried.group.position.clone(), t: 0 };
          carried = null;
          clawStep = "home";
        }
        break;
      case "home":
        jawTo(0.35);
        clawPos.x = move(clawPos.x, CAB.x, CLAW.speed);
        clawPos.z = move(clawPos.z, 0, CLAW.speed);
        if (clawPos.x === CAB.x && clawPos.z === 0) clawPos.y = move(clawPos.y, CLAW.idleY, CLAW.vSpeed);
        break;
    }
    if (carried) {
      carried.group.position.set(clawPos.x, clawPos.y - 1.4, clawPos.z);
      carried.group.rotation.y += dt;
    }
    claw.update(clawPos.x, clawPos.z, clawPos.y, clawJaw);
    // the camera pans gently with the claw so the hand-off to the hopper stays in frame
    if (phase === "grab") lookGoal.x = THREE.MathUtils.lerp(GRAB_CAM.look.x, clawPos.x, 0.45);
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    if (!visible) return;
    phaseTime += dt;
    scroller.enforce();

    for (const m of beltMaps) m.offset.x -= dt * 0.7;

    seeds.forEach((s, i) => {
      if (s === carried || s === inserting?.seed || !s.group.visible) return;
      const home = s.group.userData.home as THREE.Vector3;
      s.group.position.set(home.x, home.y + Math.sin(t * 1.2 + i) * 0.25, home.z);
      s.group.rotation.y = t * 0.6 + i;
    });
    updateClaw(dt);

    if (inserting) {
      inserting.t += dt / 0.9;
      const k = Math.min(1, inserting.t);
      inserting.seed.group.position.lerpVectors(inserting.from, hopper, Math.min(1, k * 1.6));
      if (k > 0.55) inserting.seed.group.position.y = hopper.y - (k - 0.55) * 8;
      inserting.seed.group.scale.setScalar(1 - k * k * 0.6);
      if (k >= 1) {
        inserting.seed.group.visible = false;
        inserting = null;
        setPhase("lever");
      }
    }

    // cover lifts, then the lever throws, then the idea pops out
    if (coverT >= 0) {
      coverT += dt / 0.6;
      const k = Math.min(1, coverT);
      lever.hinge.rotation.x = COVER_OPEN * (1 - Math.pow(1 - k, 3));
      if (k >= 1) { coverOpen = true; coverT = -1; emit(); }
    }
    if (leverT >= 0) {
      leverT += dt / 0.55;
      const k = Math.min(1, leverT);
      lever.handle.rotation.z = THREE.MathUtils.lerp(LEVER_REST, LEVER_ON, 1 - Math.pow(1 - k, 3));
      if (k >= 1 && phase === "lever") { setPhase("popping"); leverT = -1; }
    }
    if (phase === "popping") {
      const k = Math.min(1, phaseTime / 1.1);
      idea.group.visible = true;
      idea.group.position.lerpVectors(hExit, ideaStart, k);
      idea.group.position.y += Math.sin(k * Math.PI) * 1.2;
      idea.group.scale.setScalar(0.4 + 0.6 * Math.min(1, k * 2));
      lookGoal.copy(idea.group.position);
      if (k >= 1) {
        setPhase("scroll");
        scroller.release(); // from here the page scroll drives the timeline
        armed = false;
      }
    }

    if (phase === "scroll") {
      const raw = rawProgress();
      // safety net for native touch momentum that Lenis cannot intercept
      if (!scratchDone && window.scrollY > gateY() + 2) scroller.snapTo(gateY());
      progress += (Math.min(raw, scratchDone ? 1 : GATES.scratch) - progress) * (1 - Math.pow(0.0005, dt));
      const p = progress;
      rail.sample(p, camGoal, lookGoal);
      const showIdea = samplePos(IDEA_KEYS, p, tmp);
      idea.group.visible = showIdea;
      if (showIdea) {
        idea.group.position.copy(tmp);
        idea.group.scale.setScalar(1);
        idea.group.rotation.y = p >= RANGES.scratchZoom[0] && p <= RANGES.scratchZoom[1] ? 0.4 : t * 1.2;
      }
      pieces.forEach((pc, i) => {
        const on = samplePos(pieceKeySets[i], p, pieceAct);
        pc.group.visible = on;
        if (on) {
          pc.group.position.copy(pieceAct);
          pc.group.rotation.y = t * 2 + i;
          if (p > RANGES.assemble[0]) pc.group.rotation.x = t * 3;
        }
      });
      const crateOn = samplePos(CRATE_KEYS, p, tmp);
      crate.visible = crateOn || p >= RANGES.crate[1];
      if (crateOn) {
        crate.position.copy(tmp);
        crate.scale.setScalar(Math.max(0.001, smoothstep(RANGES.crate[0], RANGES.crate[0] + 0.012, p)));
      }
      if (raw >= 0.999 && p >= 0.995 && !finished) {
        crate.scale.setScalar(1);
        crate.position.set(...CRATE_KEYS[CRATE_KEYS.length - 1].pos);
        setPhase("drive-fp");
        scroller.hold(endY()); // stay pinned while driving
      }
    }

    if (phase === "drive-fp" || phase === "drive-tp") {
      // released and scrolled back up: rewind into the timeline
      if (!scroller.held && rawProgress() < 0.98) {
        setPhase("scroll");
      } else {
        forklift.update(dt, scroller.held, groundAt);
        cargo.update(dt, forklift, forklift.liftInput);
        if (!shipped && !mainCargo.carried && onBed(crate.position.x, crate.position.z)) { shipped = true; emit(); }
        forklift.eye(tmp);
        forklift.forward(tmp2);
        if (phase === "drive-fp") {
          camGoal.copy(tmp);
          lookGoal.copy(tmp).addScaledVector(tmp2, 10).add(new THREE.Vector3(0, -2.2, 0));
          camSnap = phaseTime > 1.2;
          if (phaseTime > 0.5 && forklift.group.position.distanceTo(crate.getWorldPosition(new THREE.Vector3())) < 9) {
            camSnap = false;
            setPhase("drive-tp");
          }
        } else {
          chaseCam.copy(forklift.group.position).addScaledVector(tmp2, -13).add(new THREE.Vector3(0, 7, 0));
          chaseLook.copy(forklift.group.position).add(new THREE.Vector3(0, 1.5, 0));
          camGoal.copy(chaseCam);
          lookGoal.copy(chaseLook);
        }
      }
    }

    animateMachines(t, dt);

    const k = camSnap ? 1 : 1 - Math.pow(0.002, dt);
    camera.position.lerp(camGoal, k);
    lookCurrent.lerp(lookGoal, k);
    camera.lookAt(lookCurrent);

    emit();
    renderer.render(scene, camera);
  }
  frame();

  if ((import.meta as any).env?.DEV) {
    const project = (v: THREE.Vector3) => {
      const r = canvas.getBoundingClientRect();
      const n = v.clone().project(camera);
      return { x: r.left + ((n.x + 1) / 2) * r.width, y: r.top + ((1 - n.y) / 2) * r.height };
    };
    (window as any).__factory = {
      state: () => ({ phase, progress, raw: rawProgress(), scratchDone, coverOpen, held: scroller.held, lenis: scroller.lenis, shipped, clawStep, claw: clawPos.toArray(), misses, cam: camera.position.toArray(), forklift: forklift.group.position.toArray(), heading: forklift.heading, fork: forklift.forkHeight, carried: mainCargo.carried, crate: crate.getWorldPosition(new THREE.Vector3()).toArray() }),
      seed: (i: number) => project(seeds[i].group.position),
      hopper: () => project(hopper),
      grab: () => { if (clawStep === "play") grabQueued = true; },
      cover: () => project(lever.cover.getWorldPosition(new THREE.Vector3())),
      lever: () => project(lever.hit.getWorldPosition(new THREE.Vector3())),
      idea: () => project(idea.group.position),
      gateY, endY, sectionTop,
      scratch: (v: boolean) => { scratchDone = v; },
    };
  }

  return {
    skip() {
      finished = true;
      if (scroller.held) scroller.release();
      scroller.scrollTo(sectionTop() + section.offsetHeight);
      emit();
    },
    setKey(code, down) {
      if (phase === "grab") {
        if (code === "Space") { if (down && clawStep === "play") grabQueued = true; return; }
        if (down) clawKeys.add(code); else clawKeys.delete(code);
        return;
      }
      if (down) forklift.keys.add(code); else forklift.keys.delete(code);
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      scroller.dispose();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("hadouin:loader-done", onLoaderDone);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      document.body.classList.remove("factory-active");
      section.style.height = "";
      forklift.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
        }
      });
      renderer.dispose();
    },
  };
}
