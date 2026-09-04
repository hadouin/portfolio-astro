import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { BELT_H, C, type CameraSpot, type Conveyor, type FactoryPlan, type Part } from "./plan";

export interface FactorySceneHandle {
  goToSpot: (index: number) => void;
  spotCount: number;
  dispose: () => void;
}

export interface FactorySceneOptions {
  canvas: HTMLCanvasElement;
  plan: FactoryPlan;
  onSpotChange?: (spot: CameraSpot, index: number) => void;
}

const deg = THREE.MathUtils.degToRad;

function geometryFor(shape: Part["shape"], [w, h, d]: Part["size"]) {
  switch (shape) {
    case "cylinder":
      return new THREE.CylinderGeometry(w / 2, w / 2, h, 24);
    case "cone":
      return new THREE.ConeGeometry(w / 2, h, 24);
    case "sphere":
      return new THREE.SphereGeometry(w / 2, 20, 14);
    case "torus":
      return new THREE.TorusGeometry(w / 2, h, 12, 40);
    case "octa":
      return new THREE.OctahedronGeometry(w / 2, 0);
    default:
      return new THREE.BoxGeometry(w, h, d);
  }
}

function makePart(p: Part): THREE.Mesh {
  const geo = geometryFor(p.shape, p.size);
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
  const mesh = new THREE.Mesh(geo, mat);
  const [x, y, z] = p.position;
  const h = p.size[1];
  // Torus / octa are centred; boxes, cylinders, cones, spheres sit on `y`.
  const centreOffset = p.shape === "torus" || p.shape === "octa" ? 0 : h / 2;
  mesh.position.set(x, y + centreOffset, z);
  if (p.rotation) mesh.rotation.set(deg(p.rotation[0]), deg(p.rotation[1]), deg(p.rotation[2]));
  if (p.shape === "octa") mesh.scale.y = p.size[1] / p.size[0];
  mesh.castShadow = !glass;
  mesh.receiveShadow = !glass;
  if (glass) mesh.renderOrder = 10;
  if (p.id) mesh.name = p.id;
  return mesh;
}

function makeConveyor(c: Conveyor): THREE.Group {
  const g = new THREE.Group();
  const width = c.width ?? 3;
  const top = (c.base ?? 0) + BELT_H;
  const dx = c.to[0] - c.from[0];
  const dz = c.to[1] - c.from[1];
  const len = Math.hypot(dx, dz);
  const angle = Math.atan2(-dz, dx);

  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(len, 0.25, width),
    new THREE.MeshStandardMaterial({ color: C.belt, roughness: 0.9 }),
  );
  belt.position.y = top - 0.125;
  belt.castShadow = true;
  belt.receiveShadow = true;
  g.add(belt);

  // rails
  const railMat = new THREE.MeshStandardMaterial({ color: C.roller, metalness: 0.4, roughness: 0.5 });
  for (const s of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.35, 0.15), railMat);
    rail.position.set(0, top, (s * width) / 2);
    g.add(rail);
  }
  // rollers under the belt
  const rollerGeo = new THREE.CylinderGeometry(0.22, 0.22, width, 10);
  const step = 2;
  for (let x = -len / 2 + 1; x < len / 2; x += step) {
    const r = new THREE.Mesh(rollerGeo, railMat);
    r.rotation.x = Math.PI / 2;
    r.position.set(x, top - 0.5, 0);
    g.add(r);
  }
  // legs
  const legGeo = new THREE.BoxGeometry(0.2, top - 0.6, 0.2);
  for (let x = -len / 2 + 0.5; x <= len / 2 - 0.5; x += 4) {
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(legGeo, railMat);
      leg.position.set(x, (top - 0.6) / 2, (s * width) / 2 - s * 0.2);
      g.add(leg);
    }
  }

  g.position.set(c.from[0] + dx / 2, 0, c.from[1] + dz / 2);
  g.rotation.y = angle;
  g.name = c.id;
  return g;
}

/** Charcoal shard with a glowing gold core — the "idea". */
function makeIdea(): THREE.Group {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.9, 0),
    new THREE.MeshStandardMaterial({ color: C.charcoal, roughness: 0.4, metalness: 0.3, transparent: true, opacity: 0.55, depthWrite: false }),
  );
  shell.scale.y = 1.4;
  shell.castShadow = true;
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 12, 10),
    new THREE.MeshStandardMaterial({ color: C.accent, emissive: C.accent, emissiveIntensity: 1.1 }),
  );
  const glow = new THREE.PointLight(C.accent, 6, 8, 2);
  g.add(shell, core, glow);
  g.name = "idea";
  return g;
}

export function createFactoryScene({ canvas, plan, onSpotChange }: FactorySceneOptions): FactorySceneHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#1a1a19");
  scene.fog = new THREE.Fog("#1a1a19", 60, 160);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);

  // ── framing ──
  // The FOV is vertical, so a narrow (portrait) canvas crops the shot horizontally.
  // Widen the lens a little and pull the camera back along the same viewing angle, so
  // phones keep the desktop composition — same spots, same follow, just zoomed out.
  const BASE_FOV = 42;
  const NARROW_FOV = 52;
  const BASE_ASPECT = 16 / 9;
  let framingDist = 1;

  function framingFor(aspect: number) {
    const k = Math.max(1, BASE_ASPECT / aspect); // 1 on wide screens, ~3.9 on an upright phone
    const t = Math.min(1, (k - 1) / 2.5);
    return {
      fov: BASE_FOV + (NARROW_FOV - BASE_FOV) * t,
      dist: Math.min(2.6, 1 + (Math.sqrt(k) - 1) * 1.5),
      lift: 0.12 * t, // shift the subject up, clear of the caption block
    };
  }

  /** Push `pos` away from `target` by the framing distance, in place. */
  function pullBack(pos: THREE.Vector3, target: THREE.Vector3, scale = framingDist) {
    return pos.sub(target).multiplyScalar(scale).add(target);
  }

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enableZoom = false; // page scroll (Lenis) owns the wheel
  controls.enablePan = false;
  controls.maxPolarAngle = Math.PI / 2 - 0.03;
  controls.touches.ONE = THREE.TOUCH.ROTATE;
  controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;

  // ── lights ──
  scene.add(new THREE.HemisphereLight("#9aa4b8", "#2a2a28", 1.1));
  const key = new THREE.DirectionalLight("#fff1d6", 2.6);
  key.position.set(30, 50, 25);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0005;
  const sc = key.shadow.camera;
  sc.left = -70; sc.right = 70; sc.top = 40; sc.bottom = -40; sc.near = 1; sc.far = 160;
  scene.add(key);
  const rim = new THREE.DirectionalLight(C.blue, 0.9);
  rim.position.set(-30, 20, -40);
  scene.add(rim);
  // tower fill so the shaft interior reads
  const towerLight = new THREE.PointLight(C.blue, 40, 60, 1.6);
  towerLight.position.set(52, 30, 18);
  scene.add(towerLight);
  const towerLight2 = new THREE.PointLight(C.accent, 25, 50, 1.6);
  towerLight2.position.set(38, 44, -14);
  scene.add(towerLight2);

  // ── floor ──
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(plan.floor.width, plan.floor.depth),
    new THREE.MeshStandardMaterial({ color: plan.floor.color, roughness: 0.95 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.x = 15;
  floor.receiveShadow = true;
  scene.add(floor);
  const grid = new THREE.GridHelper(plan.floor.width, plan.floor.width / 2, "#3c3c3a", "#2a2a28");
  grid.position.set(15, 0.01, 0);
  scene.add(grid);

  // ── conveyors + parts ──
  for (const c of plan.conveyors) scene.add(makeConveyor(c));
  const named = new Map<string, THREE.Mesh>();
  for (const p of plan.parts) {
    const m = makePart(p);
    scene.add(m);
    if (p.id) named.set(p.id, m);
  }

  // ── animated idea ──
  const idea = makeIdea();
  scene.add(idea);
  // Timed segments → cumulative timeline.
  const segStart = new Map<string, number>();
  const segEnd = new Map<string, number>();
  const segments = (() => {
    let t0 = 0;
    let from = new THREE.Vector3(...plan.ideaStart);
    return plan.ideaPath.map((seg) => {
      const to = new THREE.Vector3(...seg.to);
      const out = { id: seg.id, from, to, t0, t1: t0 + seg.duration, ease: seg.ease ?? "linear" };
      segStart.set(seg.id, t0);
      segEnd.set(seg.id, out.t1);
      t0 = out.t1;
      from = to;
      return out;
    });
  })();
  const ideaCycle = segments[segments.length - 1].t1;
  let ideaTime = 0;
  let paused = false;
  const easeSeg = (k: number, e: string) =>
    e === "in" ? k * k * k : e === "out" ? 1 - Math.pow(1 - k, 3) : k;
  function ideaAt(time: number, out: THREE.Vector3) {
    const t = ((time % ideaCycle) + ideaCycle) % ideaCycle;
    const seg = segments.find((s) => t < s.t1) ?? segments[segments.length - 1];
    const k = Math.min(1, Math.max(0, (t - seg.t0) / (seg.t1 - seg.t0)));
    out.lerpVectors(seg.from, seg.to, easeSeg(k, seg.ease));
    return seg;
  }

  // ── camera spots ──
  let spotIndex = 0;
  const camFrom = new THREE.Vector3();
  const camTo = new THREE.Vector3();
  const tgtFrom = new THREE.Vector3();
  const tgtTo = new THREE.Vector3();
  let tween = 1; // 0..1
  const TWEEN_S = 1.4;
  let follow: { offset: THREE.Vector3; until: number } | null = null;
  const followCam = new THREE.Vector3();

  function goToSpot(i: number, instant = false) {
    spotIndex = ((i % plan.spots.length) + plan.spots.length) % plan.spots.length;
    const s = plan.spots[spotIndex];
    camFrom.copy(camera.position);
    tgtFrom.copy(controls.target);
    camTo.set(...s.position);
    tgtTo.set(...s.target);
    pullBack(camTo, tgtTo);
    tween = instant ? 1 : 0;
    if (instant) {
      camera.position.copy(camTo);
      controls.target.copy(tgtTo);
    }
    if (s.follow) {
      // Rewind the idea to the start of the followed segment so the shot plays from the top.
      ideaTime = (segStart.get(s.follow.fromSegment) ?? 0) - TWEEN_S * 0.6;
      follow = { offset: new THREE.Vector3(...s.follow.offset), until: segEnd.get(s.follow.toSegment) ?? ideaCycle };
    } else {
      follow = null;
    }
    onSpotChange?.(s, spotIndex);
  }
  goToSpot(0, true);

  // ── resize ──
  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    const aspect = w / h;
    const sized =
      canvas.width !== Math.floor(w * renderer.getPixelRatio()) ||
      canvas.height !== Math.floor(h * renderer.getPixelRatio());
    if (sized) renderer.setSize(w, h, false);

    const f = framingFor(aspect);
    if (!sized && aspect === camera.aspect && f.dist === framingDist) return;

    // Keep the shot that is playing: rescale every camera vector around its own target.
    const ratio = f.dist / framingDist;
    if (ratio !== 1) {
      pullBack(camera.position, controls.target, ratio);
      pullBack(camFrom, tgtFrom, ratio);
      pullBack(camTo, tgtTo, ratio);
    }
    framingDist = f.dist;

    camera.aspect = aspect;
    camera.fov = f.fov;
    if (f.lift > 0) camera.setViewOffset(w, h, 0, h * f.lift, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // Only render while on screen.
  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
  io.observe(canvas);

  // ── loop ──
  const clock = new THREE.Clock();
  const ease = (t: number) => 1 - Math.pow(1 - t, 3);
  const tmp = new THREE.Vector3();
  let raf = 0;

  function frame() {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.1);
    const t = clock.elapsedTime;
    if (!visible) return;

    // idea travelling along the path
    if (!paused) ideaTime += dt;
    ideaAt(ideaTime, tmp);
    idea.position.copy(tmp);
    idea.rotation.y = t * 1.5;
    idea.rotation.z = Math.sin(t * 2) * 0.15;

    // follow shot: camera rides with the idea, then holds where it stopped
    if (follow) {
      if (ideaTime >= follow.until) {
        follow = null;
      } else if (ideaTime >= 0) {
        followCam.copy(idea.position).addScaledVector(follow.offset, framingDist);
        camTo.copy(followCam);
        tgtTo.copy(idea.position);
      }
    }

    // camera tween
    if (tween < 1) {
      tween = Math.min(1, tween + dt / TWEEN_S);
      const k = ease(tween);
      camera.position.lerpVectors(camFrom, camTo, k);
      controls.target.lerpVectors(tgtFrom, tgtTo, k);
    } else if (follow) {
      const k = 1 - Math.pow(0.001, dt); // smooth chase
      camera.position.lerp(camTo, k);
      controls.target.lerp(tgtTo, k);
    }
    controls.update();

    // floating idea seeds bob
    for (let i = 0; i < 6; i++) {
      const m = named.get(`idea-${i}`);
      if (m) {
        m.position.y = plan.parts.find((p) => p.id === `idea-${i}`)!.position[1] + Math.sin(t * 1.2 + i) * 0.3;
        m.rotation.y = t * 0.6 + i;
      }
    }

    // forklift patrol
    const fk = ["forklift-body", "forklift-mast", "forklift-fork-l", "forklift-fork-r", "forklift-wheel-0", "forklift-wheel-1", "forklift-wheel-2", "forklift-wheel-3"];
    const wobble = Math.sin(t * 0.5) * 2.5;
    fk.forEach((id) => {
      const m = named.get(id);
      if (!m) return;
      const base = plan.parts.find((p) => p.id === id)!.position;
      m.position.x = base[0] + wobble;
    });

    renderer.render(scene, camera);
  }
  frame();

  if (import.meta.env.DEV) {
  (window as any).__factoryPause = (t?: number) => {
    paused = t !== undefined;
    if (t !== undefined) ideaTime = t;
  };
  (window as any).__factoryDebug = () => ({
    ideaTime,
    ideaCycle,
    follow: follow ? { until: follow.until } : null,
    tween,
    cam: camera.position.toArray(),
    target: controls.target.toArray(),
    idea: idea.position.toArray(),
    chuteStart: segStart.get("chute"),
    spotIndex,
  });
  }

  return {
    goToSpot,
    spotCount: plan.spots.length,
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      controls.dispose();
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
