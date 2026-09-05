import * as THREE from "three";
import { C } from "./plan";

/** Simple kinematic forklift. Local frame: +x forward, +y up. */
export class Forklift {
  group = new THREE.Group();
  carriage = new THREE.Group();
  wheels: THREE.Mesh[] = [];
  steeringWheel: THREE.Mesh;
  heading = 0;
  speed = 0;
  steer = 0;
  forkHeight = 0;
  carrying: THREE.Object3D | null = null;
  keys = new Set<string>();

  static MAX_SPEED = 7;
  static MAX_FORK = 3.2;

  constructor() {
    const g = this.group;
    const body = new THREE.MeshStandardMaterial({ color: C.accent, roughness: 0.6 });
    const dark = new THREE.MeshStandardMaterial({ color: C.charcoal, roughness: 0.8 });
    const steel = new THREE.MeshStandardMaterial({ color: C.roller, metalness: 0.5, roughness: 0.45 });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.2, 2), body);
    chassis.position.set(0, 1.1, 0);
    const counter = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.5, 1.8), body);
    counter.position.set(-1.7, 1.15, 0);
    const floorPlate = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 1.9), dark);
    floorPlate.position.set(0, 1.75, 0);
    g.add(chassis, counter, floorPlate);

    const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
    for (const [x, z] of [[1.0, 1.1], [1.0, -1.1], [-1.1, 1.1], [-1.1, -1.1]]) {
      const w = new THREE.Mesh(wheelGeo, dark);
      w.rotation.x = Math.PI / 2;
      w.position.set(x, 0.5, z);
      w.castShadow = true;
      g.add(w);
      this.wheels.push(w);
    }

    // mast
    for (const z of [-0.6, 0.6]) {
      const up = new THREE.Mesh(new THREE.BoxGeometry(0.18, 4.4, 0.18), steel);
      up.position.set(1.65, 2.5, z);
      g.add(up);
    }
    for (const y of [4.6, 2.6]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 1.4), steel);
      bar.position.set(1.65, y, 0);
      g.add(bar);
    }
    // carriage + forks (moves with forkHeight)
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.0, 1.5), dark);
    plate.position.set(1.85, 0.6, 0);
    this.carriage.add(plate);
    for (const z of [-0.5, 0.5]) {
      const fork = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.26), steel);
      fork.position.set(3.0, 0.16, z);
      fork.castShadow = true;
      this.carriage.add(fork);
    }
    g.add(this.carriage);

    // overhead guard
    for (const [x, z] of [[0.9, 0.9], [0.9, -0.9], [-1.2, 0.9], [-1.2, -0.9]]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.6, 0.12), dark);
      post.position.set(x, 3.0, z);
      g.add(post);
    }
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 2.0), dark);
    roof.position.set(-0.15, 4.3, 0);
    g.add(roof);

    // seat + dashboard + steering wheel (the cockpit)
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 0.9), dark);
    seat.position.set(-0.7, 2.0, 0);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.0, 0.9), dark);
    back.position.set(-1.1, 2.7, 0);
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 1.5), dark);
    dash.position.set(0.7, 2.4, 0);
    const gauge = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.22, 0.5), new THREE.MeshStandardMaterial({ color: C.blue, emissive: C.blue, emissiveIntensity: 0.8 }));
    gauge.position.set(0.34, 2.5, -0.2);
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8), steel);
    column.position.set(0.3, 2.85, 0);
    column.rotation.z = 0.7;
    this.steeringWheel = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.05, 10, 28), dark);
    this.steeringWheel.position.set(0.05, 3.2, 0);
    this.steeringWheel.rotation.y = Math.PI / 2;
    this.steeringWheel.rotation.x = 0.7;
    g.add(seat, back, dash, gauge, column, this.steeringWheel);

    // headlights
    for (const z of [-0.8, 0.8]) {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.4), new THREE.MeshStandardMaterial({ color: C.white, emissive: C.white, emissiveIntensity: 1 }));
      lamp.position.set(1.45, 1.4, z);
      g.add(lamp);
    }
    const head = new THREE.SpotLight("#fff2d0", 30, 30, 0.6, 0.5, 1.2);
    head.position.set(1.4, 1.6, 0);
    head.target.position.set(12, 0, 0);
    g.add(head, head.target);

    g.traverse((o) => { if (o instanceof THREE.Mesh) o.castShadow = true; });
  }

  baseY = 0;

  place(position: [number, number, number], heading: number) {
    this.group.position.set(...position);
    this.baseY = position[1];
    this.heading = heading;
    this.group.rotation.y = heading;
  }

  forward(out: THREE.Vector3) {
    return out.set(Math.cos(this.heading), 0, -Math.sin(this.heading));
  }

  /** Driver's eye, in world space. */
  eye(out: THREE.Vector3) {
    out.set(-0.8, 3.75, 0);
    return this.group.localToWorld(out);
  }

  /** Lift input this frame: +1 raising, -1 lowering. */
  liftInput = 0;

  static LIFT_UP = ["KeyW", "PageUp"];
  static LIFT_DOWN = ["KeyS", "PageDown"];
  static DRIVE = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight"];

  /**
   * Tokens for a key event. `code` is a physical position, so on AZERTY the key printed W is
   * `KeyZ` and `KeyQ` is the key printed A — matching the printed letter too keeps W / S working
   * on any layout, and stops unrelated keys from moving the forks.
   */
  static tokens(e: KeyboardEvent): string[] {
    const out = [e.code];
    if (e.key.length === 1 && /[a-z]/i.test(e.key)) out.push(`Key${e.key.toUpperCase()}`);
    return out;
  }

  /** True when the event maps to one of the forklift controls. */
  static handles(e: KeyboardEvent): boolean {
    const bound = [...Forklift.DRIVE, ...Forklift.LIFT_UP, ...Forklift.LIFT_DOWN];
    return Forklift.tokens(e).some((t) => bound.includes(t));
  }

  update(dt: number, active: boolean, groundAt?: (x: number, z: number) => number | null) {
    const k = this.keys;
    const shift = k.has("ShiftLeft") || k.has("ShiftRight");
    const liftUp = Forklift.LIFT_UP.some((c) => k.has(c)) || (shift && k.has("ArrowUp"));
    const liftDown = Forklift.LIFT_DOWN.some((c) => k.has(c)) || (shift && k.has("ArrowDown"));
    const throttle = active && !shift ? (k.has("ArrowUp") ? 1 : 0) - (k.has("ArrowDown") ? 1 : 0) : 0;
    const steerIn = active ? (k.has("ArrowLeft") ? 1 : 0) - (k.has("ArrowRight") ? 1 : 0) : 0;
    const liftIn = active ? (liftUp ? 1 : 0) - (liftDown ? 1 : 0) : 0;
    this.liftInput = liftIn;

    this.speed += throttle * 8 * dt;
    this.speed -= this.speed * 1.6 * dt; // drag
    this.speed = THREE.MathUtils.clamp(this.speed, -Forklift.MAX_SPEED * 0.6, Forklift.MAX_SPEED);
    if (Math.abs(this.speed) < 0.02 && throttle === 0) this.speed = 0;

    this.steer += (steerIn * 0.8 - this.steer) * Math.min(1, dt * 8);
    this.heading += this.steer * this.speed * 0.35 * dt;

    const f = this.forward(new THREE.Vector3());
    const prev = this.group.position.clone();
    this.group.position.addScaledVector(f, this.speed * dt);
    if (groundAt) {
      let g = groundAt(this.group.position.x, this.group.position.z);
      if (g === null) {
        // blocked (hall walls, truck body): slide along the obstacle, else stay put
        const nx = this.group.position.x;
        const nz = this.group.position.z;
        if (groundAt(nx, prev.z) !== null) { this.group.position.z = prev.z; g = groundAt(nx, prev.z); }
        else if (groundAt(prev.x, nz) !== null) { this.group.position.x = prev.x; g = groundAt(prev.x, nz); }
        else { this.group.position.copy(prev); this.speed = 0; }
      }
      if (g !== null) {
        const targetY = this.baseY + g;
        this.group.position.y += (targetY - this.group.position.y) * Math.min(1, dt * 12);
      }
    }
    this.group.rotation.y = this.heading;

    this.forkHeight = THREE.MathUtils.clamp(this.forkHeight + liftIn * 1.6 * dt, 0, Forklift.MAX_FORK);
    this.carriage.position.y = this.forkHeight;

    const spin = (this.speed * dt) / 0.5;
    for (const w of this.wheels) w.rotation.y -= spin;
    this.steeringWheel.rotation.z = -this.steer * 1.2;
  }

  dispose() {
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
      }
    });
  }
}
