import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

type IdeaMachineOptions = {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  status: HTMLElement | null;
};

type MachineController = {
  move: (dx: number, dz: number) => void;
  grab: () => void;
  dispose: () => void;
};

const TAU = Math.PI * 2;

function seededRandom(seed: number) {
  let value = seed % 2147483647;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function labelTexture(
  lines: string[],
  options: {
    background?: string;
    color?: string;
    accent?: string;
    align?: CanvasTextAlign;
    font?: string;
    stripes?: boolean;
    width?: number;
    height?: number;
  } = {},
) {
  const width = options.width ?? 1024;
  const height = options.height ?? 256;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d")!;
  context.fillStyle = options.background ?? "#e8ddc8";
  context.fillRect(0, 0, width, height);

  if (options.stripes) {
    ["#ef6b58", "#f3bd3d", "#728dd8"].forEach((color, index) => {
      context.save();
      context.translate(42 + index * 50, 27);
      context.transform(1, 0, -0.28, 1, 0, 0);
      context.fillStyle = color;
      context.fillRect(0, 0, 34, height - 54);
      context.restore();
    });
  }

  context.textAlign = options.align ?? "left";
  context.textBaseline = "middle";
  context.fillStyle = options.color ?? "#181716";
  context.font = options.font ?? "700 112px archia, sans-serif";
  const x = options.align === "center" ? width / 2 : options.stripes ? 230 : 48;
  const lineHeight = height / (lines.length + 0.25);
  lines.forEach((line, index) => {
    context.fillText(line, x, lineHeight * (index + 0.65));
  });

  if (options.accent) {
    context.fillStyle = options.accent;
    context.fillRect(width - 120, height - 30, 72, 7);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function panel(
  width: number,
  height: number,
  texture: THREE.Texture,
  position: [number, number, number],
  rotationX = 0,
) {
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.position.set(...position);
  mesh.rotation.x = rotationX;
  return mesh;
}

function roundedBox(
  size: [number, number, number],
  material: THREE.Material,
  position: [number, number, number],
  radius = 0.06,
) {
  const geometry = new RoundedBoxGeometry(size[0], size[1], size[2], 3, radius);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function tubeBetween(
  points: THREE.Vector3[],
  radius: number,
  material: THREE.Material,
  tubularSegments = 24,
) {
  const curve = new THREE.CatmullRomCurve3(points);
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, tubularSegments, radius, 8, false),
    material,
  );
  mesh.castShadow = true;
  return mesh;
}

function makeBulb(
  color: THREE.ColorRepresentation,
  glassMaterial: THREE.MeshPhysicalMaterial,
  metalMaterial: THREE.MeshStandardMaterial,
  glow = false,
) {
  const group = new THREE.Group();
  const tintedGlass = glassMaterial.clone();
  tintedGlass.color.set(color);
  tintedGlass.emissive = new THREE.Color(color);
  tintedGlass.emissiveIntensity = glow ? 1.5 : 0.1;
  tintedGlass.transmission = glow ? 0.35 : 0.72;

  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 24, 18), tintedGlass);
  bulb.scale.set(1, 1.12, 1);
  bulb.castShadow = !glow;
  group.add(bulb);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.16, 16), metalMaterial);
  neck.position.y = -0.27;
  group.add(neck);
  for (let index = 0; index < 3; index += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.018, 6, 18), metalMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.21 - index * 0.055;
    group.add(ring);
  }

  if (glow) {
    const filamentMaterial = new THREE.MeshBasicMaterial({ color: 0xffd86b });
    const filament = tubeBetween(
      [
        new THREE.Vector3(-0.06, -0.04, 0.2),
        new THREE.Vector3(-0.09, 0.05, 0.21),
        new THREE.Vector3(0, 0.11, 0.22),
        new THREE.Vector3(0.09, 0.05, 0.21),
        new THREE.Vector3(0.06, -0.04, 0.2),
      ],
      0.012,
      filamentMaterial,
      12,
    );
    group.add(filament);
    const light = new THREE.PointLight(0xffc95a, 1.1, 2.6, 2);
    group.add(light);
  }
  return group;
}

function addScrew(group: THREE.Group, x: number, y: number, z: number, metal: THREE.Material) {
  const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.025, 12), metal);
  screw.rotation.x = Math.PI / 2;
  screw.position.set(x, y, z);
  group.add(screw);
}

function createMachine() {
  const group = new THREE.Group();
  group.rotation.y = -0.1;

  const cream = new THREE.MeshStandardMaterial({ color: 0xd9ceb8, metalness: 0.18, roughness: 0.48 });
  const creamLight = new THREE.MeshStandardMaterial({ color: 0xeee3cf, metalness: 0.12, roughness: 0.38 });
  const black = new THREE.MeshStandardMaterial({ color: 0x171716, metalness: 0.52, roughness: 0.42 });
  const charcoal = new THREE.MeshStandardMaterial({ color: 0x282724, metalness: 0.45, roughness: 0.58 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xa9a8a0, metalness: 0.92, roughness: 0.18 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xb98b45, metalness: 0.78, roughness: 0.28 });
  const red = new THREE.MeshPhysicalMaterial({ color: 0xe7483b, metalness: 0.18, roughness: 0.28, clearcoat: 1 });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xe7edf2,
    metalness: 0,
    roughness: 0.08,
    transmission: 0.9,
    thickness: 0.18,
    transparent: true,
    opacity: 0.31,
    side: THREE.DoubleSide,
  });
  const bulbGlass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.08,
    transmission: 0.75,
    thickness: 0.24,
    transparent: true,
    opacity: 0.88,
    clearcoat: 0.5,
  });

  // Lower cabinet and recessed face.
  group.add(roundedBox([5.6, 2.55, 2.65], black, [0, 1.45, 0], 0.15));
  group.add(roundedBox([5.32, 1.75, 0.12], charcoal, [0, 1.16, 1.345], 0.055));
  group.add(roundedBox([5.82, 0.15, 2.86], cream, [0, 0.18, 0], 0.04));
  [-2.65, 2.65].forEach((x) => {
    group.add(roundedBox([0.13, 2.36, 2.78], cream, [x, 1.45, 0], 0.04));
  });

  // Feet.
  [-2.42, 2.42].forEach((x) => {
    [-0.9, 0.9].forEach((z) => {
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.18, 24), black);
      foot.position.set(x, 0.02, z);
      foot.castShadow = true;
      group.add(foot);
    });
  });

  // Cabinet interior, glass and structural frame.
  group.add(roundedBox([4.95, 3.68, 0.12], black, [-0.18, 4.76, -1.12], 0.03));
  group.add(roundedBox([5.2, 0.18, 2.4], cream, [-0.05, 2.85, 0], 0.035));
  const uprights: Array<[number, number, number]> = [
    [-2.56, 4.78, 1.09], [2.46, 4.78, 1.09], [-2.56, 4.78, -1.09], [2.46, 4.78, -1.09],
  ];
  uprights.forEach((position) => group.add(roundedBox([0.18, 3.78, 0.18], cream, position, 0.035)));
  group.add(roundedBox([5.25, 0.2, 2.42], cream, [-0.05, 6.63, 0], 0.04));
  group.add(roundedBox([5.25, 0.8, 2.45], creamLight, [-0.05, 7.12, 0], 0.12));

  const marqueeTexture = labelTexture(["IDEA"], { stripes: true, accent: "#181716" });
  group.add(panel(4.95, 0.66, marqueeTexture, [-0.08, 7.15, 1.235]));
  const sideMottoTexture = labelTexture(["PULL", "IDEAS", "INTO REALITY"], {
    font: "700 48px archia, sans-serif",
    width: 420,
    height: 390,
  });
  group.add(panel(0.84, 0.65, sideMottoTexture, [1.92, 7.15, 1.242]));

  // Glass sheets are slightly inset so cream posts remain crisp.
  const frontGlass = new THREE.Mesh(new THREE.PlaneGeometry(4.85, 3.52), glass);
  frontGlass.position.set(-0.08, 4.73, 1.125);
  frontGlass.renderOrder = 4;
  group.add(frontGlass);
  const leftGlass = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 3.5), glass);
  leftGlass.rotation.y = Math.PI / 2;
  leftGlass.position.set(-2.48, 4.73, 0);
  leftGlass.renderOrder = 4;
  group.add(leftGlass);

  // Interior fluorescent tubes.
  [-1.42, 1.35].forEach((x) => {
    const lightBar = roundedBox(
      [1.7, 0.07, 0.08],
      new THREE.MeshBasicMaterial({ color: 0xffddb0 }),
      [x, 6.49, 0.93],
      0.025,
    );
    group.add(lightBar);
  });
  const interiorLight = new THREE.PointLight(0xffba67, 2.7, 7, 2);
  interiorLight.position.set(-0.25, 5.85, 0.5);
  group.add(interiorLight);

  // Bulb pile.
  const random = seededRandom(18);
  const colors = [0xf0bd42, 0xee6758, 0x738fd7, 0xe7ded0, 0xf5c85b];
  for (let index = 0; index < 31; index += 1) {
    const color = colors[index % colors.length];
    const bulb = makeBulb(color, bulbGlass, brass);
    const row = Math.floor(index / 10);
    const x = -2.02 + (index % 10) * 0.43 + (random() - 0.5) * 0.12;
    const y = 3.07 + row * 0.37 + random() * 0.1;
    const z = 0.32 + row * -0.35 + (random() - 0.5) * 0.22;
    bulb.position.set(x, y, z);
    bulb.rotation.z = (random() - 0.5) * 1.3;
    bulb.scale.setScalar(0.82 + random() * 0.22);
    group.add(bulb);
  }

  // Gantry rails and moving carriage.
  [-0.45, 0.22].forEach((z) => {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 4.55, 16), chrome);
    rail.rotation.z = Math.PI / 2;
    rail.position.set(-0.08, 6.25, z);
    group.add(rail);
  });
  const carriage = new THREE.Group();
  carriage.position.set(0.15, 6.2, 0.3);
  carriage.add(roundedBox([0.56, 0.35, 0.62], black, [0, 0, 0], 0.06));
  group.add(carriage);

  const clawLift = new THREE.Group();
  clawLift.position.y = -0.26;
  carriage.add(clawLift);
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.64, 12), black);
  cable.position.y = -0.31;
  clawLift.add(cable);
  for (let index = 0; index < 4; index += 1) {
    const telescope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08 + index * 0.015, 0.08 + index * 0.015, 0.17, 16),
      index % 2 ? black : chrome,
    );
    telescope.position.y = -0.63 - index * 0.14;
    clawLift.add(telescope);
  }
  const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.22, 18), chrome);
  wrist.position.y = -1.15;
  clawLift.add(wrist);

  const clawArms = new THREE.Group();
  clawArms.position.y = -1.15;
  clawLift.add(clawArms);
  for (let index = 0; index < 3; index += 1) {
    const angle = (index / 3) * TAU + Math.PI / 6;
    const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const arm = tubeBetween(
      [
        direction.clone().multiplyScalar(0.06),
        direction.clone().multiplyScalar(0.23).add(new THREE.Vector3(0, -0.22, 0)),
        direction.clone().multiplyScalar(0.35).add(new THREE.Vector3(0, -0.52, 0)),
        direction.clone().multiplyScalar(0.26).add(new THREE.Vector3(0, -0.7, 0)),
      ],
      0.036,
      chrome,
      18,
    );
    clawArms.add(arm);
  }
  const heroBulb = makeBulb(0xffc748, bulbGlass, brass, true);
  heroBulb.position.y = -1.83;
  heroBulb.scale.setScalar(0.9);
  clawLift.add(heroBulb);

  // Sloped control panel.
  const consoleGroup = new THREE.Group();
  consoleGroup.position.set(-0.35, 2.66, 1.35);
  consoleGroup.rotation.x = -0.3;
  group.add(consoleGroup);
  consoleGroup.add(roundedBox([4.78, 0.92, 0.18], charcoal, [0, 0, 0], 0.09));
  consoleGroup.add(roundedBox([1.62, 0.3, 0.04], black, [-0.72, 0.13, 0.12], 0.035));
  const displayTexture = labelTexture(["IDEA READY"], {
    background: "#10120f",
    color: "#d3e95b",
    align: "center",
    font: "700 70px monospace",
    width: 700,
    height: 160,
  });
  consoleGroup.add(panel(1.45, 0.23, displayTexture, [-0.72, 0.13, 0.117]));
  const grabButton = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.39, 0.16, 32), red);
  grabButton.rotation.x = Math.PI / 2;
  grabButton.position.set(1.28, -0.02, 0.2);
  grabButton.castShadow = true;
  consoleGroup.add(grabButton);
  const grabTexture = labelTexture(["GRAB"], {
    background: "#e7483b",
    color: "#fff7e9",
    align: "center",
    font: "700 74px archia, sans-serif",
    width: 400,
    height: 180,
  });
  consoleGroup.add(panel(0.52, 0.23, grabTexture, [1.28, -0.02, 0.292]));
  [[-1.78, -0.12], [-1.42, -0.12], [-1.6, 0.15], [-1.6, -0.38]].forEach(([x, y]) => {
    consoleGroup.add(roundedBox([0.28, 0.2, 0.1], black, [x, y, 0.16], 0.035));
  });

  // Front identity plate.
  const logoTexture = labelTexture(["H"], {
    stripes: true,
    background: "#1f1e1c",
    color: "#ebe4d6",
    font: "italic 700 250px archia, sans-serif",
    width: 1000,
    height: 320,
  });
  group.add(panel(4.76, 1.38, logoTexture, [-0.25, 1.12, 1.414]));
  [-2.44, 2.03].forEach((x) => {
    [0.54, 1.7].forEach((y) => addScrew(group, x, y, 1.44, brass));
  });

  // Hopper/chute and import handle.
  const hopper = new THREE.Group();
  hopper.position.set(2.25, 3.35, 1.25);
  group.add(hopper);
  const wallPositions: Array<{ size: [number, number, number]; position: [number, number, number]; rotation: [number, number, number] }> = [
    { size: [1.65, 0.09, 1.05], position: [0, -0.1, 0], rotation: [-0.66, 0, 0] },
    { size: [0.08, 0.95, 1.0], position: [-0.77, 0.12, 0], rotation: [0, 0, -0.24] },
    { size: [0.08, 0.95, 1.0], position: [0.77, 0.12, 0], rotation: [0, 0, 0.24] },
  ];
  wallPositions.forEach(({ size, position, rotation }) => {
    const wall = roundedBox(size, black, position, 0.035);
    wall.rotation.set(...rotation);
    hopper.add(wall);
  });
  hopper.add(roundedBox([1.84, 0.09, 1.28], cream, [0, 0.54, 0], 0.035));
  [-0.88, 0.88].forEach((x) => hopper.add(roundedBox([0.09, 0.98, 1.22], cream, [x, 0.08, 0], 0.03)));

  const handle = new THREE.Group();
  handle.position.set(2.82, 4.18, 1.21);
  group.add(handle);
  [-0.53, 0.53].forEach((x) => handle.add(roundedBox([0.16, 1.5, 0.18], black, [x, -0.65, 0], 0.07)));
  const redGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.05, 20), red);
  redGrip.rotation.z = Math.PI / 2;
  handle.add(redGrip);
  const importTexture = labelTexture(["IMPORT"], {
    background: "#1c1b19",
    color: "#eee2cf",
    align: "center",
    font: "700 80px archia, sans-serif",
    width: 500,
    height: 170,
  });
  group.add(panel(1.18, 0.36, importTexture, [2.8, 3.25, 1.415]));

  // A few deliberate nicks and patina dots make the procedural model less pristine.
  const patina = new THREE.InstancedMesh(
    new THREE.CircleGeometry(0.018, 8),
    new THREE.MeshBasicMaterial({ color: 0x574f42, transparent: true, opacity: 0.45 }),
    28,
  );
  const dummy = new THREE.Object3D();
  for (let index = 0; index < 28; index += 1) {
    dummy.position.set(-2.35 + random() * 4.7, 0.45 + random() * 2.1, 1.43);
    dummy.scale.setScalar(0.4 + random() * 1.1);
    dummy.updateMatrix();
    patina.setMatrixAt(index, dummy.matrix);
  }
  group.add(patina);

  return { group, carriage, clawLift, clawArms, heroBulb };
}

export function initIdeaMachine3D({ container, canvas, status }: IdeaMachineOptions): MachineController | null {
  if (!container.isConnected || !canvas.isConnected) return null;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    container.dataset.webglFailed = "true";
    return null;
  }

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x1a1917, 13, 24);
  const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 80);
  camera.position.set(8.7, 5.4, 12.5);
  camera.lookAt(0, 3.7, 0);

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const { group: machine, carriage, clawLift, clawArms, heroBulb } = createMachine();
  machine.position.set(-0.15, -0.05, 0);
  scene.add(machine);

  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x24221f, roughness: 0.8, metalness: 0.05 });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(7.5, 80), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.08;
  floor.receiveShadow = true;
  scene.add(floor);

  scene.add(new THREE.HemisphereLight(0xfff1d9, 0x171513, 1.35));
  const key = new THREE.DirectionalLight(0xffe1b5, 4.2);
  key.position.set(-4, 9, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -7;
  key.shadow.camera.right = 7;
  key.shadow.camera.top = 9;
  key.shadow.camera.bottom = -2;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 25;
  key.shadow.normalBias = 0.035;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x7588d8, 2.2);
  rim.position.set(6, 5, -6);
  scene.add(rim);
  const fill = new THREE.PointLight(0xef7558, 1.1, 14, 2);
  fill.position.set(5, 2, 7);
  scene.add(fill);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.target.set(0, 3.65, 0);
  controls.minAzimuthAngle = -0.84;
  controls.maxAzimuthAngle = 0.84;
  controls.minPolarAngle = 1.05;
  controls.maxPolarAngle = 1.48;
  controls.update();

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let targetX = carriage.position.x;
  let targetZ = carriage.position.z;
  let grabStart = -1;
  let frame = 0;
  const clock = new THREE.Clock();
  const setStatus = (message: string) => {
    if (status) status.textContent = message;
  };

  const resize = () => {
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    const compact = width < 520;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = compact ? 38 : 32;
    camera.position.set(compact ? 8.7 : 9.3, compact ? 5.4 : 5.7, compact ? 12.5 : 15.4);
    camera.updateProjectionMatrix();
    controls.update();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  const move = (dx: number, dz: number) => {
    if (grabStart >= 0) return;
    targetX = THREE.MathUtils.clamp(targetX + dx, -1.55, 1.15);
    targetZ = THREE.MathUtils.clamp(targetZ + dz, -0.2, 0.72);
    setStatus("POSITIONING IDEA…");
  };

  const grab = () => {
    if (grabStart >= 0) return;
    grabStart = clock.getElapsedTime();
    setStatus("CAPTURING IDEA…");
  };

  const animate = () => {
    frame = requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();
    carriage.position.x = THREE.MathUtils.lerp(carriage.position.x, targetX, 0.06);
    carriage.position.z = THREE.MathUtils.lerp(carriage.position.z, targetZ, 0.06);

    if (grabStart >= 0 && !reduceMotion) {
      const progress = elapsed - grabStart;
      let drop = 0;
      if (progress < 0.85) drop = THREE.MathUtils.smootherstep(progress, 0, 0.85) * 1.48;
      else if (progress < 1.32) drop = 1.48;
      else if (progress < 2.25) drop = (1 - THREE.MathUtils.smootherstep(progress, 1.32, 2.25)) * 1.48;
      clawLift.position.y = -0.26 - drop;
      const close = THREE.MathUtils.smoothstep(progress, 0.72, 1.12);
      clawArms.scale.set(1 - close * 0.18, 1, 1 - close * 0.18);
      heroBulb.visible = progress < 0.85 || progress > 1.05;
      if (progress > 2.28) {
        grabStart = -1;
        clawLift.position.y = -0.26;
        clawArms.scale.set(1, 1, 1);
        heroBulb.visible = true;
        setStatus("IDEA CAPTURED ✓");
      }
    } else if (grabStart >= 0) {
      grabStart = -1;
      setStatus("IDEA CAPTURED ✓");
    }

    heroBulb.rotation.y = elapsed * 0.5;
    if (!reduceMotion) machine.rotation.y = -0.1 + Math.sin(elapsed * 0.28) * 0.012;
    controls.update();
    renderer.render(scene, camera);
  };
  animate();
  container.dataset.ready = "true";

  return {
    move,
    grab,
    dispose: () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if ("map" in material && material.map instanceof THREE.Texture) material.map.dispose();
          material.dispose();
        });
      });
      renderer.dispose();
    },
  };
}
