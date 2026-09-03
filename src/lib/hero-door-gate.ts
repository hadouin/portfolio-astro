/**
 * Turns the hero into a factory shutter that gates the rest of the page.
 *
 * While the gate is closed the page cannot scroll: wheel/touch deltas feed a
 * drag accumulator instead. A partial drag lifts the hero just enough to peek
 * at the content underneath, and lets go back to closed if the user stops
 * short. Cross the threshold and the shutter dips, then rips upward on an
 * accelerating ease with hydraulic steam and a rumbling screen shake.
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
 * Latching is deliberate: the shutter first settles back down into its seated
 * position so the user can read that their push registered, holds while the
 * hydraulics blow off, and only then pulls up.
 */
const VALIDATE_MS = 1000;
const HOLD_MS = 300;
const LIFT_MS = 1500;
const CLOSE_MS = 560;
const SNAPBACK_MS = 420;
/** Time without input after which a short drag gives up and snaps shut. */
const IDLE_MS = 160;

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
  /** The drag only ever reveals a peek — the shutter is heavy. */
  const PEEK = 26;
  const shakeScale = coarse ? 0.55 : 1;

  let state: State = "closed";
  let gate = 0;
  let doorY = 0;
  let lastDoorY = 0;
  let impulse = 0;
  let raf = 0;
  let animating = false;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  let closeAccum = 0;
  let seqStart = 0;
  let seqFrom = 0;
  let vented = false;
  let lastWispAt = 0;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let touchStartY = 0;
  let touchBase = 0;

  // ---------------------------------------------------------------- steam

  function jet(
    xPct: number,
    yPct: number,
    scale: number,
    driftX: number,
    driftY: number,
    ms: number,
  ) {
    if (steam!.childElementCount > 120) return;
    const el = document.createElement("span");
    el.className = "hero-steam";
    el.style.setProperty("--x", `${xPct}%`);
    el.style.setProperty("--y", `${yPct}%`);
    el.style.setProperty("--s", String(scale));
    el.style.setProperty("--dx", `${driftX}px`);
    el.style.setProperty("--dy", `${driftY}px`);
    el.style.setProperty("--d", `${ms}ms`);
    el.addEventListener("animationend", () => el.remove(), { once: true });
    steam!.appendChild(el);
  }

  /**
   * One pressure release: steam punched horizontally out of the rails on both
   * sides, plus a gust at the lip that expands in place so it reads as venting
   * towards the viewer. Short and sharp — vapour, not drifting smoke.
   */
  function ventPulse(atPct: number, index: number) {
    const nozzles = coarse ? 3 : 5;
    const spread = 1 + index * 0.15;

    for (const dir of [1, -1]) {
      const x = dir === 1 ? -2 : 102;
      for (let i = 0; i < nozzles; i++) {
        // Stagger the nozzles up the rail so it reads as a full seam.
        const y = atPct - i * (coarse ? 11 : 13) - Math.random() * 6;
        for (let j = 0; j < 2; j++) {
          jet(
            x + dir * Math.random() * 10,
            y + (Math.random() - 0.5) * 5,
            (1.5 + Math.random() * 1.1) * spread,
            dir * (250 + Math.random() * 300),
            -4 - Math.random() * 22,
            260 + Math.random() * 170,
          );
        }
      }
    }

    for (let i = 0; i < (coarse ? 5 : 8); i++) {
      jet(
        8 + Math.random() * 84,
        atPct + (Math.random() - 0.35) * 9,
        (2.6 + Math.random() * 1.6) * spread,
        (Math.random() - 0.5) * 90,
        -3 - Math.random() * 18,
        300 + Math.random() * 200,
      );
    }

    impulse = Math.max(impulse, (index === 0 ? 22 : 13) * shakeScale);
  }

  /** Hydraulics letting go in a quick train of bursts rather than one cloud. */
  function ventBurst(atPct: number) {
    const pulses = coarse ? 2 : 3;
    for (let i = 0; i < pulses; i++) {
      if (i === 0) {
        ventPulse(atPct, 0);
        continue;
      }
      const t = setTimeout(
        () => {
          timers.delete(t);
          ventPulse(atPct, i);
        },
        i * 85 + Math.random() * 45,
      );
      timers.add(t);
    }
  }

  /** Residual steam torn off the lip while the shutter travels. */
  function edgeWisps(atPct: number, speed: number) {
    for (let i = 0; i < clamp(Math.round(speed * 2), 1, 4); i++) {
      jet(
        6 + Math.random() * 88,
        clamp(atPct + (Math.random() - 0.3) * 5, -6, 106),
        1 + Math.random() * 1.2,
        (Math.random() - 0.5) * 170,
        -8 - Math.random() * 30,
        280 + Math.random() * 200,
      );
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
      root.style.setProperty(
        "--shake-x",
        `${((Math.random() - 0.5) * amp).toFixed(2)}px`,
      );
      root.style.setProperty(
        "--shake-y",
        `${((Math.random() - 0.5) * amp * 1.35).toFixed(2)}px`,
      );
    } else {
      root.classList.remove("is-quaking");
      root.style.setProperty("--shake-x", "0px");
      root.style.setProperty("--shake-y", "0px");
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
        doorY = 0;
        if (!vented) {
          vented = true;
          // Just above the lip: at rest the lip is the bottom of the viewport,
          // so venting exactly on it would clip half of every jet.
          ventBurst(96);
          // Everything punches at once: steam, shake, and the name scrambling.
          hero!
            .querySelector(".hacker-effect")
            ?.dispatchEvent(new Event("hero:opening"));
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

    // The validation settle stays quiet — the rumble belongs to the lift.
    const lifting =
      state === "closing" ||
      (state === "opening" && elapsed >= VALIDATE_MS + HOLD_MS);
    const rumble = lifting ? Math.max(clamp(speed * 2.4, 0, 18), 3) : 0;
    quake(Math.max(impulse, rumble) * shakeScale);
    impulse *= 0.86;

    if (lifting && speed > 0.12 && now - lastWispAt > 70) {
      lastWispAt = now;
      edgeWisps(doorY + 100, speed);
    }

    paint();
    syncTheme();

    if (animating) raf = requestAnimationFrame(tick);
  }

  function startOpen(skipValidation = false) {
    if (state === "opening" || state === "open") return;
    // A snapback may be mid-tween; restart the clock cleanly.
    stopLoop();
    state = "opening";
    seqFrom = doorY;
    gate = 1;
    vented = false;
    startLoop();
    // Clicking the call to action is its own confirmation, so there is nothing
    // to validate — jump straight to the vent and the lift.
    if (skipValidation) seqStart -= VALIDATE_MS;
  }

  function finishOpen() {
    state = "open";
    impulse = 16 * shakeScale;
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
    hero!.classList.remove("is-open");
    lock();
    startLoop();
  }

  function finishClose() {
    state = "closed";
    gate = 0;
    closeAccum = 0;
    ventBurst(96);
    setTimeout(() => {
      if (state === "closed") {
        stopLoop();
        paint();
      }
    }, 460);
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

  const onClick = (e: MouseEvent) => {
    const el = e.target as HTMLElement | null;

    // The hero's call to action opens the shutter for real, animation and all.
    if (el?.closest?.("[data-door-open]")) {
      if (state === "open" || state === "opening") return;
      e.preventDefault();
      startOpen(true);
      return;
    }

    // Any other in-page jump has to get past the shutter first.
    if (state === "open" || state === "opening") return;
    const link = el?.closest?.("a[href]");
    if (link && link.getAttribute("href")?.includes("#")) openInstant();
  };

  const onScroll = () => {
    if (state !== "open" && window.scrollY !== 0) window.scrollTo(0, 0);
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("click", onClick, true);

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
    if (idleTimer) clearTimeout(idleTimer);
    timers.forEach(clearTimeout);
    timers.clear();
    stopLoop();
    hero.classList.remove("is-gated", "is-open", "is-armed");
    root.style.removeProperty("--reveal");
    unlock();
  };
}
