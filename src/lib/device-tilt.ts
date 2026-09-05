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

export type DeviceTiltHandle = {
  /** Make the device's current attitude the new zero, effective on the next reading. */
  recenter: () => void;
  dispose: () => void;
};

type DeviceTiltOptions = {
  onTilt: (sample: TiltSample) => void;
  /** Dev-only readout hook: fires on every status change and every reading. */
  onDebug?: (debug: TiltDebug) => void;
  /** Element whose first tap arms the iOS permission prompt. */
  gestureTarget?: HTMLElement;
  /** Degrees of tilt that map to full deflection. */
  range?: number;
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
 * has no orientation sensor.
 */
export function initDeviceTilt(options: DeviceTiltOptions): DeviceTiltHandle | null {
  if (typeof window === "undefined") return null;

  const { onTilt, onDebug, gestureTarget, range = 26, smoothing = 0.22 } = options;

  const OrientationEvent = (window as any).DeviceOrientationEvent as
    | (typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> })
    | undefined;

  let baseline: TiltSample | null = null;
  let baselineAngle: number | null = null;
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

  const handleOrientation = (event: DeviceOrientationEvent) => {
    if (disposed) return;

    const { beta, gamma } = event;
    if (beta === null || gamma === null) return;
    if (!Number.isFinite(beta) || !Number.isFinite(gamma)) return;

    events += 1;

    // Rotate the raw pitch/roll pair into screen space so landscape feels like portrait.
    const screenAngle = screenAngleDegrees();
    const angle = screenAngle * (Math.PI / 180);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rawX = gamma * cos - beta * sin;
    const rawY = beta * cos + gamma * sin;

    // The neutral is captured once and only moves on an explicit recenter, so a
    // posture held steady keeps reading as tilted instead of quietly becoming level.
    // Turning the phone to landscape is the exception: the posture it was captured
    // in no longer exists, so the first reading in the new orientation replaces it.
    if (!baseline || screenAngle !== baselineAngle) {
      baseline = { x: rawX, y: rawY };
      baselineAngle = screenAngle;
      smoothed = null;
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

  return {
    recenter: () => {
      // Dropping both makes the next reading define the neutral outright, with no
      // smoothing tail from the posture being replaced.
      baseline = null;
      baselineAngle = null;
      smoothed = null;
    },
    dispose: () => {
      disposed = true;
      removeGestureListeners();
      window.removeEventListener("deviceorientation", handleOrientation);
    },
  };
}
