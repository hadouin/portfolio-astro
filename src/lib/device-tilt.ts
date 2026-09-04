type TiltSample = {
  /** -1 (tilted left) .. 1 (tilted right), relative to the resting posture. */
  x: number;
  /** -1 (top tilted away) .. 1 (top tilted toward you), relative to the resting posture. */
  y: number;
};

export type TiltStatus =
  /** The platform exposes no orientation sensor at all. */
  | "unsupported"
  /** iOS: waiting for the tap that is allowed to raise the permission prompt. */
  | "awaiting-gesture"
  /** The user declined, or the prompt failed. */
  | "denied"
  /** Subscribed to the sensor; `events` says whether it is actually reporting. */
  | "listening";

export type TiltDebug = {
  status: TiltStatus;
  /** Readings received so far — stuck at 0 means subscribed but silent. */
  events: number;
  /** Raw sensor angles in degrees, before screen rotation and recentring. */
  raw: { alpha: number | null; beta: number | null; gamma: number | null };
  /** Screen rotation in degrees that the raw angles are corrected against. */
  screenAngle: number;
  /** The drifting neutral posture, in screen-space degrees. */
  neutral: { x: number; y: number } | null;
  /** The emitted sample, -1..1 per axis. */
  sample: TiltSample;
};

type DeviceTiltOptions = {
  onTilt: (sample: TiltSample) => void;
  /** Dev-only readout hook: fires on every status change and every reading. */
  onDebug?: (debug: TiltDebug) => void;
  /** Element whose first tap arms the iOS permission prompt. */
  gestureTarget?: HTMLElement;
  /** Degrees of tilt that map to full deflection. */
  range?: number;
  /** Time constant for drifting the neutral posture toward how the phone is actually held. */
  recenterSeconds?: number;
  /** 0..1 exponential smoothing applied per sample to tame sensor jitter. */
  smoothing?: number;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function screenAngleDegrees() {
  const angle = window.screen?.orientation?.angle ?? (window as any).orientation ?? 0;
  return typeof angle === "number" ? angle : 0;
}

/**
 * Streams phone tilt (pitch/roll) as screen-space coordinates, like a compass needle
 * that stays put while the device turns around it. Returns null when the platform
 * has no orientation sensor; returns a cleanup function otherwise.
 */
export function initDeviceTilt(options: DeviceTiltOptions): (() => void) | null {
  if (typeof window === "undefined") return null;

  const {
    onTilt,
    onDebug,
    gestureTarget,
    range = 26,
    recenterSeconds = 9,
    smoothing = 0.22,
  } = options;

  const OrientationEvent = (window as any).DeviceOrientationEvent as
    | (typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> })
    | undefined;

  let baseline: TiltSample | null = null;
  let smoothed: TiltSample | null = null;
  let events = 0;
  let status: TiltStatus = "unsupported";
  const report = (event?: DeviceOrientationEvent) =>
    onDebug?.({
      status,
      events,
      raw: {
        alpha: event?.alpha ?? null,
        beta: event?.beta ?? null,
        gamma: event?.gamma ?? null,
      },
      screenAngle: screenAngleDegrees(),
      neutral: baseline && { ...baseline },
      sample: smoothed ? { ...smoothed } : { x: 0, y: 0 },
    });

  if (!OrientationEvent) {
    report();
    return null;
  }

  let disposed = false;
  let listening = false;
  let lastTime = 0;

  const handleOrientation = (event: DeviceOrientationEvent) => {
    if (disposed) return;

    const { beta, gamma } = event;
    if (beta === null || gamma === null) return;
    if (!Number.isFinite(beta) || !Number.isFinite(gamma)) return;

    events += 1;

    // Rotate the raw pitch/roll pair into screen space so landscape feels like portrait.
    const angle = screenAngleDegrees() * (Math.PI / 180);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rawX = gamma * cos - beta * sin;
    const rawY = beta * cos + gamma * sin;

    const now = event.timeStamp || performance.now();
    const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.5) : 0;
    lastTime = now;

    if (!baseline) {
      baseline = { x: rawX, y: rawY };
    } else if (delta > 0) {
      // Whatever posture the phone settles into becomes the new centre.
      const ease = 1 - Math.exp(-delta / recenterSeconds);
      baseline.x += (rawX - baseline.x) * ease;
      baseline.y += (rawY - baseline.y) * ease;
    }

    const target = {
      x: clamp((rawX - baseline.x) / range, -1, 1),
      y: clamp((rawY - baseline.y) / range, -1, 1),
    };

    if (!smoothed) {
      smoothed = { ...target };
    } else {
      smoothed.x += (target.x - smoothed.x) * smoothing;
      smoothed.y += (target.y - smoothed.y) * smoothing;
    }

    onTilt({ x: smoothed.x, y: smoothed.y });
    report(event);
  };

  const start = () => {
    if (listening || disposed) return;
    listening = true;
    status = "listening";
    window.addEventListener("deviceorientation", handleOrientation, { passive: true });
    report();
  };

  let removeGestureListeners = () => {};

  if (typeof OrientationEvent.requestPermission === "function") {
    // iOS only hands out sensor data after an explicit grant, and the prompt
    // itself is only allowed from a user gesture.
    const target: HTMLElement | Window = gestureTarget ?? window;
    const requestAccess = (event: Event) => {
      // Never stack the system prompt on top of a tap that is navigating away.
      const origin = event.target;
      if (origin instanceof Element && origin.closest("a, button, input, textarea, select")) {
        return;
      }

      removeGestureListeners();
      OrientationEvent.requestPermission?.()
        .then((state) => {
          if (state === "granted") {
            start();
            return;
          }
          status = "denied";
          report();
        })
        .catch(() => {
          status = "denied";
          report();
        });
    };

    removeGestureListeners = () => {
      target.removeEventListener("touchend", requestAccess);
      target.removeEventListener("click", requestAccess);
    };

    target.addEventListener("touchend", requestAccess, { passive: true });
    target.addEventListener("click", requestAccess);
    status = "awaiting-gesture";
    report();
  } else {
    start();
  }

  return () => {
    disposed = true;
    removeGestureListeners();
    window.removeEventListener("deviceorientation", handleOrientation);
  };
}
