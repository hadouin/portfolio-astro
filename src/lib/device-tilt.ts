type TiltSample = {
  /** -1 (tilted left) .. 1 (tilted right), relative to the resting posture. */
  x: number;
  /** -1 (top tilted away) .. 1 (top tilted toward you), relative to the resting posture. */
  y: number;
};

type DeviceTiltOptions = {
  onTilt: (sample: TiltSample) => void;
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

function screenAngleRadians() {
  const angle = window.screen?.orientation?.angle ?? (window as any).orientation ?? 0;
  return (typeof angle === "number" ? angle : 0) * (Math.PI / 180);
}

/**
 * Streams phone tilt (pitch/roll) as screen-space coordinates, like a compass needle
 * that stays put while the device turns around it. Returns null when the platform
 * has no orientation sensor; returns a cleanup function otherwise.
 */
export function initDeviceTilt(options: DeviceTiltOptions): (() => void) | null {
  if (typeof window === "undefined") return null;

  const OrientationEvent = (window as any).DeviceOrientationEvent as
    | (typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> })
    | undefined;
  if (!OrientationEvent) return null;

  const {
    onTilt,
    gestureTarget,
    range = 26,
    recenterSeconds = 9,
    smoothing = 0.22,
  } = options;

  let disposed = false;
  let listening = false;
  let baseline: TiltSample | null = null;
  let smoothed: TiltSample | null = null;
  let lastTime = 0;

  const handleOrientation = (event: DeviceOrientationEvent) => {
    if (disposed) return;

    const { beta, gamma } = event;
    if (beta === null || gamma === null) return;
    if (!Number.isFinite(beta) || !Number.isFinite(gamma)) return;

    // Rotate the raw pitch/roll pair into screen space so landscape feels like portrait.
    const angle = screenAngleRadians();
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
  };

  const start = () => {
    if (listening || disposed) return;
    listening = true;
    window.addEventListener("deviceorientation", handleOrientation, { passive: true });
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
          if (state === "granted") start();
        })
        .catch(() => {});
    };

    removeGestureListeners = () => {
      target.removeEventListener("touchend", requestAccess);
      target.removeEventListener("click", requestAccess);
    };

    target.addEventListener("touchend", requestAccess, { passive: true });
    target.addEventListener("click", requestAccess);
  } else {
    start();
  }

  return () => {
    disposed = true;
    removeGestureListeners();
    window.removeEventListener("deviceorientation", handleOrientation);
  };
}
