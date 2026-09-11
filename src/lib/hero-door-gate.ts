/**
 * Turns the hero into a factory shutter that gates the rest of the page.
 *
 * While the gate is closed the page cannot scroll: wheel/touch deltas feed a
 * drag accumulator instead. A partial drag lifts the hero just enough to peek
 * at the content underneath, and lets go back to closed if the user stops
 * short. Cross the threshold and the shutter settles back onto its sill, the
 * hydraulics blow off, and after a beat it rips upward on an accelerating ease
 * with a rumbling screen shake.
 *
 * Scrolling back up at the top of the page drops the shutter shut again.
 */

type State = "closed" | "dragging" | "opening" | "open" | "closing";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInQuad = (t: number) => t * t;
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** How far the shutter travels before it is fully clear of the viewport. */
const OPEN_Y = -104;

/**
 * Latching is deliberate, and it plays in three beats: the shutter first
 * settles back down into its seated position so the user can read that their
 * push registered, then the hydraulics blow off and the vapour is given time to
 * hang, and only then does the motor rip the slab upward.
 */
const VALIDATE_MS = 1000;
const HOLD_MS = 1100;
const LIFT_MS = 1500;
const CLOSE_MS = 560;
const SNAPBACK_MS = 420;
/** Time without input after which a short drag gives up and snaps shut. */
const IDLE_MS = 160;
/**
 * Re-fired while the screen is rattling. Shorter than one scramble pass, so the
 * name keeps churning for as long as the shake lasts instead of settling.
 */
const SCRAMBLE_EVERY_MS = 420;
/** Largest impulse the shake ever reaches, used to normalise it for the WebGL. */
const SHAKE_MAX = 22;

export function initHeroDoorGate(): (() => void) | undefined {
  const hero = document.querySelector<HTMLElement>("[data-dark-hero]");
  const fx = document.querySelector<HTMLElement>("[data-door-fx]");
  const steam = document.querySelector<HTMLElement>("[data-door-steam]");
  if (!hero || !fx || !steam) return;

  const root = document.documentElement;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const coarse = window.matchMedia("(max-width: 767px)").matches;
  /** Wheel/touch pixels needed to drive the drag from shut to fully armed. */
  const DRAG = coarse ? 620 : 900;
  const THRESHOLD = 0.38;
  /** The drag only ever reveals a peek: the shutter is heavy. */
  const PEEK = 26;
  const shakeScale = coarse ? 0.55 : 1;
  /**
   * A jet's reach is vx / LATERAL_DRAG, so at full strength it carries ~100-180px
   * off the rail. That is a sliver of a desktop viewport but most of the way
   * across a phone, where the two seams would all but meet in the middle.
   */
  const jetScale = coarse ? 0.5 : 1;

  let state: State = "closed";
  let gate = 0;
  let doorY = 0;
  let lastDoorY = 0;
  let impulse = 0;
  let quaking = false;
  let lastScrambleAt = 0;
  let raf = 0;
  let animating = false;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  let closeAccum = 0;
  let seqStart = 0;
  let seqFrom = 0;
  let vented = false;
  let touchStartY = 0;
  let touchBase = 0;

  // ---------------------------------------------------------------- steam

  /**
   * The vapour is integrated rather than keyframed, so it actually accelerates.
   * A jet leaves the rail fast sideways; drag kills that lateral velocity in a
   * couple of hundred milliseconds, which is what keeps the steam pinned near
   * the edge. Buoyancy then takes over and the plume climbs faster and faster
   * while it expands and thins out.
   */
  const BUOYANCY = -210; // px/s², upward
  const LATERAL_DRAG = 5; // s⁻¹, sideways velocity decay
  const VERTICAL_DRAG = 0.9; // s⁻¹, the rise is barely damped
  const TURBULENCE = 16; // px/s of lateral wander

  interface Particle {
    el: HTMLElement;
    x: number;
    y: number;
    vx: number;
    vy: number;
    scale: number;
    growth: number;
    age: number;
    life: number;
    peak: number;
    phase: number;
  }

  const particles: Particle[] = [];
  let steamRaf = 0;
  let steamLast = 0;

  function draw(p: Particle, opacity: number) {
    p.el.style.opacity = opacity.toFixed(3);
    p.el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(
      1,
    )}px, 0) scale(${p.scale.toFixed(3)})`;
  }

  function stepSteam(now: number) {
    const dt = Math.min((now - steamLast) / 1000, 0.05);
    steamLast = now;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age += dt;
      const t = p.age / p.life;
      if (t >= 1) {
        p.el.remove();
        particles.splice(i, 1);
        continue;
      }

      // Buoyancy eases off as the vapour cools and mixes with the air.
      p.vy += BUOYANCY * (1 - 0.45 * t) * dt;
      p.vx *= Math.exp(-LATERAL_DRAG * dt);
      p.vy *= Math.exp(-VERTICAL_DRAG * dt);

      p.x += (p.vx + Math.sin(p.age * 3.1 + p.phase) * TURBULENCE) * dt;
      p.y += p.vy * dt;
      p.scale += p.growth * dt;

      // Thins out as it expands, on top of a short fade in.
      const fadeIn = Math.min(1, p.age / 0.09);
      draw(p, p.peak * fadeIn * Math.pow(1 - t, 1.7));
    }

    steamRaf = particles.length ? requestAnimationFrame(stepSteam) : 0;
  }

  function spawn(init: Omit<Particle, "el" | "age">) {
    if (particles.length > 140) return;
    const el = document.createElement("span");
    el.className = "hero-steam";
    const p: Particle = { ...init, el, age: 0 };
    draw(p, 0);
    steam!.appendChild(el);
    particles.push(p);
  }

  /**
   * The pressure release: one burst of steam punched horizontally out of the
   * rails on both sides of the screen. Fires once, between the shutter seating
   * itself and the lift, nothing vents from the bottom.
   */
  function ventBurst(atPct: number) {
    const nozzles = coarse ? 4 : 6;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const gap = (coarse ? 0.15 : 0.13) * h;

    for (const dir of [1, -1]) {
      const x0 = dir === 1 ? -8 : w + 8;
      for (let i = 0; i < nozzles; i++) {
        // Stagger the nozzles up the rail so it reads as a full seam.
        const y0 = (atPct / 100) * h - i * gap - Math.random() * 0.05 * h;
        for (let j = 0; j < 3; j++) {
          spawn({
            x: x0 + dir * Math.random() * 18,
            y: y0 + (Math.random() - 0.5) * 24,
            vx: dir * (480 + Math.random() * 420) * jetScale,
            vy: -(30 + Math.random() * 70),
            scale: 0.3 + Math.random() * 0.2,
            growth: 0.9 + Math.random() * 0.8,
            life: 1.5 + Math.random() * 0.9,
            peak: 0.55 + Math.random() * 0.35,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    }

    // A short hiss kick, not a rumble: it decays well inside the hold so the
    // wait before the lift reads as still.
    impulse = Math.max(impulse, 10);
    if (!steamRaf) {
      steamLast = performance.now();
      steamRaf = requestAnimationFrame(stepSteam);
    }
  }

  // ---------------------------------------------------------------- paint

  function paint() {
    hero!.style.setProperty("--door-y", doorY.toFixed(3));
    hero!.style.setProperty("--gate", gate.toFixed(4));
    // What the meter shows: progress towards the latch, not raw drag. Hits
    // 100% exactly as the shutter arms.
    hero!.style.setProperty("--arm", clamp(gate / THRESHOLD, 0, 1).toFixed(4));
    hero!.classList.toggle("is-armed", gate >= THRESHOLD);
    // The page sits right behind the shutter and rides up with it, so the reveal
    // always starts at the top of the content instead of a mid-section slice.
    // The 0.92 lag gives it a touch of depth against the door.
    root.style.setProperty(
      "--reveal",
      (Math.max(0, 100 + doorY) * 0.92).toFixed(3),
    );
  }

  /** The navbar runs light-on-dark for as long as the shutter covers it. */
  function syncTheme() {
    const dark = doorY > -85;
    if (document.body.classList.contains("hero-dark-active") !== dark) {
      document.body.classList.toggle("hero-dark-active", dark);
    }
  }

  function quake(amp: number) {
    if (amp > 0.05) {
      root.classList.add("is-quaking");
      const x = (Math.random() - 0.5) * amp;
      const y = (Math.random() - 0.5) * amp * 1.35;
      root.style.setProperty("--shake-x", `${x.toFixed(2)}px`);
      root.style.setProperty("--shake-y", `${y.toFixed(2)}px`);
      // The shutter only ever rattles downward. It sits flush on its sill, so
      // an upward jolt would crack a gap open under it and flash the page.
      root.style.setProperty("--shake-yd", `${Math.abs(y).toFixed(2)}px`);

      // The name churns for as long as the screen is moving.
      const now = performance.now();
      if (!quaking || now - lastScrambleAt > SCRAMBLE_EVERY_MS) {
        lastScrambleAt = now;
        hero!
          .querySelector(".hacker-effect")
          ?.dispatchEvent(new Event("hero:shake"));
      }

      // And the portrait's chromatic effect rattles with the frame.
      (window as any).__heroChromaticShake?.({
        x: x / SHAKE_MAX,
        y: y / SHAKE_MAX,
      });

      quaking = true;
    } else {
      if (quaking) (window as any).__heroChromaticShake?.(null);
      quaking = false;
      root.classList.remove("is-quaking");
      root.style.setProperty("--shake-x", "0px");
      root.style.setProperty("--shake-y", "0px");
      root.style.setProperty("--shake-yd", "0px");
    }
  }

  // ------------------------------------------------------------ sequences

  function startLoop() {
    if (animating) return;
    animating = true;
    seqStart = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function stopLoop() {
    animating = false;
    cancelAnimationFrame(raf);
    quake(0);
  }

  function tick(now: number) {
    const elapsed = now - seqStart;

    if (state === "opening") {
      if (elapsed < VALIDATE_MS) {
        // Validation: ease back down to seated so the commit is legible.
        doorY = seqFrom * (1 - easeInOutCubic(elapsed / VALIDATE_MS));
      } else if (elapsed < VALIDATE_MS + HOLD_MS) {
        // Seated. Vent on the first frame of the hold, then sit still while the
        // vapour hangs and the kick dies out.
        doorY = 0;
        if (!vented) {
          vented = true;
          // Anchor the bottom of the rail seam just inside the viewport.
          // The impulse this sets makes quake() fire on the same frame, which
          // is what kicks off the scramble: steam, shake and text together.
          ventBurst(96);
        }
      } else {
        const t = clamp((elapsed - VALIDATE_MS - HOLD_MS) / LIFT_MS, 0, 1);
        // Heavy motor: barely moves at first, whips clear at the end.
        doorY = OPEN_Y * Math.pow(t, 2.1);
        if (t >= 1) {
          doorY = OPEN_Y;
          finishOpen();
        }
      }
    } else if (state === "closing") {
      const t = clamp(elapsed / CLOSE_MS, 0, 1);
      doorY = seqFrom + (0 - seqFrom) * easeInQuad(t);
      if (t >= 1) {
        doorY = 0;
        finishClose();
        return;
      }
    } else if (state === "dragging") {
      // Snapback tween back to shut.
      const t = clamp(elapsed / SNAPBACK_MS, 0, 1);
      doorY = seqFrom * (1 - easeOutCubic(t));
      gate = clamp(gate * (1 - easeOutCubic(t)), 0, 1);
      if (t >= 1) {
        doorY = 0;
        gate = 0;
        state = "closed";
        stopLoop();
        paint();
        return;
      }
    }

    const speed = Math.abs(doorY - lastDoorY);
    lastDoorY = doorY;

    // The validation settle and closing sequence stay quiet: the rumble
    // belongs exclusively to the powered lift.
    const lifting =
      state === "opening" && elapsed >= VALIDATE_MS + HOLD_MS;
    const rumble = lifting ? Math.max(clamp(speed * 2.4, 0, 18), 3) : 0;
    quake(Math.max(impulse, rumble) * shakeScale);
    impulse *= 0.86;

    paint();
    syncTheme();

    if (animating) raf = requestAnimationFrame(tick);
  }

  function startOpen() {
    if (state === "opening" || state === "open") return;
    // A snapback may be mid-tween; restart the clock cleanly.
    stopLoop();
    state = "opening";
    seqFrom = doorY;
    gate = 1;
    // Nothing vents here: the slab is still held up at the peek height. The
    // burst waits until it has settled back onto its sill.
    vented = false;
    startLoop();
  }

  function finishOpen() {
    state = "open";
    impulse = 16;
    hero!.classList.add("is-open");
    closeAccum = 0;
    unlock();
    // Let the last impulse ring out, then park the loop.
    setTimeout(() => {
      if (state === "open") {
        stopLoop();
        paint();
      }
    }, 420);
  }

  function startClose() {
    if (state === "closing" || state === "closed") return;
    state = "closing";
    seqFrom = doorY;
    // Do not carry the lift's final impact into a later closing sequence.
    impulse = 0;
    hero!.classList.remove("is-open");
    lock();
    startLoop();
  }

  function finishClose() {
    state = "closed";
    gate = 0;
    closeAccum = 0;
    // Pressure is released before lifting, never when the shutter closes.
    stopLoop();
    paint();
    syncTheme();
  }

  function scheduleSnapback() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (state !== "dragging" && state !== "closed") return;
      if (gate >= THRESHOLD) return;
      state = "dragging";
      seqFrom = doorY;
      startLoop();
    }, IDLE_MS);
  }

  function drag(deltaPx: number) {
    if (state === "opening" || state === "closing") return;
    // A fresh input cancels an in-flight snapback.
    if (animating && state === "dragging") stopLoop();
    state = "dragging";
    gate = clamp(gate + deltaPx / DRAG, 0, 1);
    doorY = -PEEK * easeOutCubic(gate);
    paint();
    syncTheme();
    if (gate >= THRESHOLD) {
      if (idleTimer) clearTimeout(idleTimer);
      startOpen();
    } else {
      scheduleSnapback();
    }
  }

  // ------------------------------------------------------------ scroll lock

  const lenis = () => (window as any).lenis;

  function lock() {
    lenis()?.stop();
    window.scrollTo(0, 0);
  }

  function unlock() {
    lenis()?.start();
  }

  function openInstant() {
    state = "open";
    gate = 1;
    doorY = OPEN_Y;
    lastDoorY = OPEN_Y;
    hero!.classList.add("is-open");
    paint();
    syncTheme();
    unlock();
  }

  // --------------------------------------------------------------- events

  const onWheel = (e: WheelEvent) => {
    if (state === "open") {
      if (window.scrollY <= 0 && e.deltaY < 0) {
        closeAccum += -e.deltaY;
        if (closeAccum > 200) startClose();
      } else {
        closeAccum = 0;
      }
      return;
    }
    e.preventDefault();
    if (state === "opening" || state === "closing") return;
    drag(e.deltaY);
  };

  const onTouchStart = (e: TouchEvent) => {
    touchStartY = e.touches[0].clientY;
    touchBase = gate;
    if (state === "open") closeAccum = 0;
  };

  const onTouchMove = (e: TouchEvent) => {
    const delta = touchStartY - e.touches[0].clientY;
    if (state === "open") {
      if (window.scrollY <= 0 && delta < 0) {
        closeAccum = -delta;
        if (closeAccum > 90) startClose();
      }
      return;
    }
    e.preventDefault();
    if (state === "opening" || state === "closing") return;
    if (animating && state === "dragging") stopLoop();
    state = "dragging";
    gate = clamp(touchBase + delta / DRAG, 0, 1);
    doorY = -PEEK * easeOutCubic(gate);
    paint();
    syncTheme();
    if (gate >= THRESHOLD) startOpen();
  };

  const onTouchEnd = () => {
    if (state !== "dragging") return;
    if (gate >= THRESHOLD) startOpen();
    else {
      seqFrom = doorY;
      startLoop();
    }
  };

  const SCROLL_KEYS = new Set([
    "ArrowDown",
    "ArrowUp",
    "PageDown",
    "PageUp",
    " ",
    "Home",
    "End",
  ]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (state === "open" || state === "opening" || state === "closing") return;
    if (!SCROLL_KEYS.has(e.key)) return;
    e.preventDefault();
    if (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "Home") {
      drag(-DRAG * 0.3);
    } else if (e.key === "End") {
      startOpen();
    } else {
      drag(DRAG * 0.3);
    }
  };

  // Any in-page jump has to get past the shutter first.
  const onClick = (e: MouseEvent) => {
    if (state === "open" || state === "opening") return;
    const link = (e.target as HTMLElement | null)?.closest?.("a[href]");
    if (link && link.getAttribute("href")?.includes("#")) openInstant();
  };

  const onScroll = () => {
    if (state !== "open" && window.scrollY !== 0) window.scrollTo(0, 0);
  };

  // The first-load preloader owns the scroll while it is up and hands it back
  // with lenis.start() on exit. If the shutter is still shut, take it straight
  // back, otherwise the page would scroll freely behind a closed door.
  const onLoaderDone = () => {
    if (state !== "open") lock();
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("click", onClick, true);
  document.addEventListener("hadouin:loader-done", onLoaderDone);

  hero.classList.add("is-gated");

  // Deep links and restored scroll positions skip the gate entirely.
  if (location.hash || window.scrollY > 10) {
    openInstant();
  } else {
    lock();
    paint();
    syncTheme();
  }

  return () => {
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", onTouchEnd);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("scroll", onScroll);
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("hadouin:loader-done", onLoaderDone);
    if (idleTimer) clearTimeout(idleTimer);
    if (steamRaf) cancelAnimationFrame(steamRaf);
    steamRaf = 0;
    particles.forEach((p) => p.el.remove());
    particles.length = 0;
    stopLoop();
    hero.classList.remove("is-gated", "is-open", "is-armed");
    root.style.removeProperty("--reveal");
    unlock();
  };
}
