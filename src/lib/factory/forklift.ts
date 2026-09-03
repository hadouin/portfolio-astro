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

  place(position: [number, number, number], heading: number) {
    this.group.position.set(...position);
    this.heading = heading;
    this.group.rotation.y = heading;
  }

  forward(out: THREE.Vector3) {
    return out.set(Math.cos(this.heading), 0, -Math.sin(this.heading));
  }

  /** Driver's eye, in world space. */
  eye(out: THREE.Vector3) {
    out.set(-0.45, 3.05, 0);
    return this.group.localToWorld(out);
  }

  update(dt: number, active: boolean) {
    const k = this.keys;
    const throttle = active ? (k.has("ArrowUp") ? 1 : 0) - (k.has("ArrowDown") ? 1 : 0) : 0;
    const steerIn = active ? (k.has("ArrowLeft") ? 1 : 0) - (k.has("ArrowRight") ? 1 : 0) : 0;
    const liftIn = active ? (k.has("KeyW") ? 1 : 0) - (k.has("KeyS") ? 1 : 0) : 0;

    this.speed += throttle * 8 * dt;
    this.speed -= this.speed * 1.6 * dt; // drag
    this.speed = THREE.MathUtils.clamp(this.speed, -Forklift.MAX_SPEED * 0.6, Forklift.MAX_SPEED);
    if (Math.abs(this.speed) < 0.02 && throttle === 0) this.speed = 0;

    this.steer += (steerIn * 0.8 - this.steer) * Math.min(1, dt * 8);
    this.heading += this.steer * this.speed * 0.35 * dt;

    const f = this.forward(new THREE.Vector3());
    this.group.position.addScaledVector(f, this.speed * dt);
    this.group.rotation.y = this.heading;

    this.forkHeight = THREE.MathUtils.clamp(this.forkHeight + liftIn * 1.6 * dt, 0, Forklift.MAX_FORK);
    this.carriage.position.y = this.forkHeight;

    const spin = (this.speed * dt) / 0.5;
    for (const w of this.wheels) w.rotation.y -= spin;
    this.steeringWheel.rotation.z = -this.steer * 1.2;
  }

  /** Pick the crate when the forks slide under it; drop it when lowered to the ground. */
  handleCrate(crate: THREE.Object3D, scene: THREE.Scene, groundY: number) {
    const tmp = new THREE.Vector3();
    if (!this.carrying) {
      crate.getWorldPosition(tmp);
      const local = this.group.worldToLocal(tmp.clone());
      const forkY = this.forkHeight + 0.22;
      const crateBottom = tmp.y - this.group.position.y;
      const under = local.x > 1.9 && local.x < 4.1 && Math.abs(local.z) < 1.1;
      if (under && forkY > crateBottom - 0.05 && forkY < crateBottom + 0.5) {
        this.carrying = crate;
        this.carriage.add(crate);
        crate.position.set(3.0, 0.22, 0);
        crate.rotation.set(0, 0, 0);
      }
    } else if (this.forkHeight <= 0.01 && this.keys.has("KeyS")) {
      crate.getWorldPosition(tmp);
      this.carriage.remove(crate);
      scene.add(crate);
      crate.position.set(tmp.x, groundY, tmp.z);
      crate.rotation.y = this.heading;
      this.carrying = null;
    }
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
