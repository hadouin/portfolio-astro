import * as THREE from "three";
import type { Forklift } from "./forklift";

/** Height of whatever a crate or the forklift would rest on at (x, z), or null when blocked (water). */
export type SupportFn = (x: number, z: number) => number | null;

export interface Cargo {
  obj: THREE.Object3D;
  vel: THREE.Vector3;
  carried: boolean;
}

const HALF = 1.0; // crate half size
const FORK_X0 = 1.9;
const FORK_X1 = 4.3;

/**
 * Minimal crate physics: crates sit on their support, the forklift body pushes them,
 * the forks slide under them and lift, lowering sets them back down.
 */
export class CargoSystem {
  crates: Cargo[] = [];
  private tmp = new THREE.Vector3();
  private local = new THREE.Vector3();

  constructor(private scene: THREE.Scene, private supportAt: SupportFn, private groundY: number) {}

  add(obj: THREE.Object3D) {
    const c = { obj, vel: new THREE.Vector3(), carried: false };
    this.crates.push(c);
    return c;
  }

  /** World position of a crate's base centre. */
  worldPos(c: Cargo, out: THREE.Vector3) {
    return c.obj.getWorldPosition(out);
  }

  update(dt: number, fk: Forklift, liftInput: number) {
    const carried = this.crates.find((c) => c.carried) ?? null;
    const forkTop = fk.group.position.y + fk.forkHeight + 0.22;

    for (const c of this.crates) {
      if (c.carried) {
        // lowering onto something: release when the crate bottom meets its support
        if (liftInput < 0) {
          this.worldPos(c, this.tmp);
          const sup = this.supportAt(this.tmp.x, this.tmp.z);
          if (sup === null) continue; // nothing to set it on (water)
          const supY = this.groundY + sup;
          // the forks are 0.22 thick: release when the crate sits on its support or the forks bottom out
          if (this.tmp.y <= supY + 0.3 || fk.forkHeight <= 0.01) {
            fk.carriage.remove(c.obj);
            this.scene.add(c.obj);
            c.obj.position.set(this.tmp.x, supY, this.tmp.z);
            c.obj.rotation.set(0, fk.heading, 0);
            c.vel.set(0, 0, 0);
            c.carried = false;
          }
        }
        continue;
      }

      const pos = c.obj.position;
      // settle on support
      const sup = this.supportAt(pos.x, pos.z);
      const supY = this.groundY + (sup ?? 0);
      pos.y += (supY - pos.y) * Math.min(1, dt * 10);

      // forklift interaction, in the forklift's local frame
      this.local.copy(pos).setY(fk.group.position.y);
      fk.group.worldToLocal(this.local);
      const lx = this.local.x;
      const lz = this.local.z;
      const crateBottom = pos.y;
      const forksBelowCrate = forkTop < crateBottom + 0.12;
      const underForks = lx > FORK_X0 - 0.4 && lx < FORK_X1 && Math.abs(lz) < 1.1;

      if (!carried && underForks && !forksBelowCrate && forkTop < crateBottom + 0.5 && liftInput > 0) {
        // forks came up under it: pick up
        c.carried = true;
        fk.carriage.add(c.obj);
        c.obj.position.set(3.0, 0.22, 0);
        c.obj.rotation.set(0, 0, 0);
        c.vel.set(0, 0, 0);
        continue;
      }

      // body / carriage collision (expanded by the crate half size)
      const bodyX0 = -2.5 - HALF;
      const bodyX1 = (underForks && forksBelowCrate ? 1.7 : 1.9) + HALF; // forks slide under, the plate does not
      const bodyZ = 1.2 + HALF;
      if (lx > bodyX0 && lx < bodyX1 && Math.abs(lz) < bodyZ && forkTop < crateBottom + 2) {
        const pushX = lx > (bodyX0 + bodyX1) / 2 ? bodyX1 - lx : bodyX0 - lx;
        const pushZ = lz > 0 ? bodyZ - lz : -bodyZ - lz;
        if (Math.abs(pushX) < Math.abs(pushZ)) this.local.x += pushX;
        else this.local.z += pushZ;
        fk.group.localToWorld(this.local);
        const dx = this.local.x - pos.x;
        const dz = this.local.z - pos.z;
        pos.x = this.local.x;
        pos.z = this.local.z;
        c.vel.x = dx / Math.max(dt, 1 / 120) * 0.6;
        c.vel.z = dz / Math.max(dt, 1 / 120) * 0.6;
      }

      // slide + friction, stay off the water
      if (c.vel.lengthSq() > 1e-4) {
        const nx = pos.x + c.vel.x * dt;
        const nz = pos.z + c.vel.z * dt;
        if (this.supportAt(nx, nz) !== null) { pos.x = nx; pos.z = nz; } else c.vel.set(0, 0, 0);
        c.vel.multiplyScalar(Math.max(0, 1 - dt * 4));
      }
    }
  }
}
