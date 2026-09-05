import { initDeviceTilt, type DeviceTiltHandle, type TiltDebug } from "./device-tilt";

type Vec2 = [number, number];

export type HeroChromaticDebug = {
  /** Null until the tilt source reports; null forever on platforms without one. */
  tilt: TiltDebug | null;
  /** Whatever last moved the focus point. */
  source: "idle" | "mouse" | "touch" | "tilt";
  /** Focus point in container UV, origin bottom-left. */
  focus: Vec2;
  /** Rest position the bubble settles to when the device is held at its neutral attitude. */
  anchor: Vec2;
  velocity: Vec2;
  /** 0 = portrait untouched, 1 = full chromatic split. */
  intensity: number;
};

type HeroChromaticOptions = {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  imageSrc: string;
  edgeSrc: string;
  hero: HTMLElement;
  imageSize: Vec2;
  referenceImage?: HTMLImageElement | null;
  /** Dev-only readout hook; leave unset in production so nothing is sampled. */
  onDebug?: (debug: HeroChromaticDebug) => void;
};

const VERTEX_SHADER = `
  attribute vec2 aPosition;
  varying vec2 vUv;
  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const WAVE_FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uCurrent;
  uniform sampler2D uPrevious;
  uniform vec2 uTexel;
  uniform vec2 uMouse;
  uniform float uSplat;
  uniform float uRadius;

  void main() {
    vec2 uv = vUv;
    float hC = texture2D(uCurrent, uv).r;
    float hL = texture2D(uCurrent, uv - vec2(uTexel.x, 0.0)).r;
    float hR = texture2D(uCurrent, uv + vec2(uTexel.x, 0.0)).r;
    float hD = texture2D(uCurrent, uv - vec2(0.0, uTexel.y)).r;
    float hU = texture2D(uCurrent, uv + vec2(0.0, uTexel.y)).r;

    float vel = texture2D(uPrevious, uv).g;
    vel += (hL + hR + hD + hU - 4.0 * hC) * 0.48;
    vel *= 0.993;

    float h = hC + vel;
    h *= 0.995;

    float dist = length(uv - uMouse);
    h += exp(-dist * dist / (uRadius * uRadius + 1e-5)) * uSplat;

    gl_FragColor = vec4(h, vel, 0.0, 1.0);
  }
`;

const COMPOSITE_FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uImage;
  uniform sampler2D uEdge;
  uniform sampler2D uWave;
  uniform vec2 uResolution;
  uniform vec2 uImageSize;
  uniform vec2 uObjectPosition;
  uniform vec2 uMouse;
  uniform vec2 uMouseVel;
  uniform vec2 uTilt;
  uniform float uTime;
  uniform float uStrength;
  uniform float uIntensity;

  vec2 coverUv(vec2 containerUv) {
    float containerAspect = uResolution.x / uResolution.y;
    float imageAspect = uImageSize.x / uImageSize.y;

    // Painted size in normalized container space (can exceed 1.0 on the cropped axis).
    vec2 paintedSize = vec2(1.0);
    if (containerAspect > imageAspect) {
      paintedSize.y = containerAspect / imageAspect;
    } else {
      paintedSize.x = imageAspect / containerAspect;
    }

    // uObjectPosition uses CSS semantics: x from left, y from top (both 0..1).
    vec2 originTopLeft = uObjectPosition * (vec2(1.0) - paintedSize);
    float containerYTop = 1.0 - containerUv.y;
    vec2 imageTopLeft = vec2(
      (containerUv.x - originTopLeft.x) / paintedSize.x,
      (containerYTop - originTopLeft.y) / paintedSize.y
    );

    // Texture upload uses UNPACK_FLIP_Y_WEBGL, so convert top-origin image coords to GL UV.
    return vec2(imageTopLeft.x, 1.0 - imageTopLeft.y);
  }

  void main() {
    vec2 uv = coverUv(vUv);
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }

    float containerAspect = uResolution.x / uResolution.y;
    float imageAspect = uImageSize.x / uImageSize.y;
    vec2 coverScale = vec2(1.0);
    if (containerAspect > imageAspect) {
      coverScale.y = imageAspect / containerAspect;
    } else {
      coverScale.x = containerAspect / imageAspect;
    }
    // coverScale is the visible fraction of the painted image (inverse zoom on cropped axis).

    float edge = texture2D(uEdge, uv).a;
    float wave = texture2D(uWave, vUv).r;

    vec2 texel = 1.0 / uResolution;
    vec2 grad = vec2(
      texture2D(uWave, vUv + vec2(texel.x, 0.0)).r - texture2D(uWave, vUv - vec2(texel.x, 0.0)).r,
      texture2D(uWave, vUv + vec2(0.0, texel.y)).r - texture2D(uWave, vUv - vec2(0.0, texel.y)).r
    );

    float mouseDist = length(vUv - uMouse);
    float mouseMask = smoothstep(0.42, 0.04, mouseDist);
    float drive = uIntensity;
    vec2 chromaDir = normalize(uMouseVel * 18.0 + (vUv - uMouse) * mouseMask + vec2(1e-4, 0.0));

    vec2 waveOffset = grad * vec2(0.13, 0.11) * (0.25 + edge * 2.4) * drive;
    float ripple = sin(mouseDist * 48.0 - uTime * 7.0) * wave * 0.016 * mouseMask * drive;
    waveOffset += chromaDir * ripple;
    waveOffset *= coverScale;

    float split = uStrength * drive * (0.005 + edge * 0.02) * (0.35 + mouseMask * 0.65);
    float velBoost = length(uMouseVel) * uStrength * drive * 0.11;

    // Relative tilt is the driver on mobile, not the motion of getting there:
    // these offsets are a pure function of the held angle. The picture shears
    // toward the low side (edge-weighted so contours lead) with the channels
    // split on top, and neither decays until the phone levels back out.
    float tiltMag = min(length(uTilt), 1.0);
    vec2 tiltWarp = uTilt * uStrength * (0.006 + edge * 0.028) * coverScale;
    vec2 tiltSplit = uTilt * uStrength * (0.006 + edge * 0.024) * coverScale;

    vec2 offsetR = waveOffset + chromaDir * (split + velBoost) * coverScale + tiltWarp + tiltSplit;
    vec2 offsetG = waveOffset + tiltWarp;
    vec2 offsetB = waveOffset + tiltWarp - chromaDir * (split + velBoost) * coverScale - tiltSplit;

    float r = texture2D(uImage, uv + offsetR).r;
    float g = texture2D(uImage, uv + offsetG).g;
    float b = texture2D(uImage, uv + offsetB).b;

    vec3 base = texture2D(uImage, uv).rgb;
    float mixAmount = clamp(
      mouseMask * 0.9 + abs(wave) * 14.0 + length(uMouseVel) * 30.0 + tiltMag * 2.2,
      0.0,
      1.0
    );
    vec3 color = mix(base, vec3(r, g, b), mixAmount * drive * (0.5 + edge * 0.5));

    gl_FragColor = vec4(color, 1.0);
  }
`;

/** How far full-scale tilt carries the bubble from its anchor, in container UV. */
const TILT_SPAN = 0.42;
/** Spring pulling the bubble to the tilt target, and the viscous drag on it. */
const BUBBLE_SPRING = 22;
const BUBBLE_DAMPING = 6.5;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn("[hero-chromatic]", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("[hero-chromatic]", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  return program;
}

function createTexture(
  gl: WebGLRenderingContext,
  width: number,
  height: number,
  options?: { linear?: boolean; clamp?: boolean },
) {
  const texture = gl.createTexture();
  if (!texture) return null;

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    options?.linear ? gl.LINEAR : gl.NEAREST,
  );
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MAG_FILTER,
    options?.linear ? gl.LINEAR : gl.NEAREST,
  );
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_WRAP_S,
    options?.clamp ? gl.CLAMP_TO_EDGE : gl.REPEAT,
  );
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_WRAP_T,
    options?.clamp ? gl.CLAMP_TO_EDGE : gl.REPEAT,
  );

  return texture;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load ${src}`));
    image.src = src;
  });
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function parseObjectPosition(value: string): Vec2 {
  const parts = value.trim().split(/\s+/);

  const parseAxis = (part: string, axis: "x" | "y") => {
    if (part.endsWith("%")) return clamp(parseFloat(part) / 100, 0, 1);
    if (part === "center") return 0.5;
    if (axis === "x") {
      if (part === "left") return 0;
      if (part === "right") return 1;
    } else {
      if (part === "top") return 0;
      if (part === "bottom") return 1;
    }
    return 0.5;
  };

  const x = parseAxis(parts[0] ?? "50%", "x");
  const y = parseAxis(parts[1] ?? parts[0] ?? "50%", "y");
  return [x, y];
}

function readObjectPosition(referenceImage?: HTMLImageElement | null): Vec2 {
  if (!referenceImage) return [0.5, 0.5];
  return parseObjectPosition(getComputedStyle(referenceImage).objectPosition);
}

export function initHeroChromaticWebGL(options: HeroChromaticOptions): (() => void) | null {
  const {
    container,
    canvas,
    imageSrc,
    edgeSrc,
    hero,
    imageSize,
    referenceImage = null,
    onDebug,
  } = options;
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
  });

  if (!gl) {
    console.warn("[hero-chromatic] WebGL unavailable");
    return null;
  }

  const waveProgram = createProgram(gl, VERTEX_SHADER, WAVE_FRAGMENT_SHADER);
  const compositeProgram = createProgram(gl, VERTEX_SHADER, COMPOSITE_FRAGMENT_SHADER);
  if (!waveProgram || !compositeProgram) return null;

  const quadBuffer = gl.createBuffer();
  if (!quadBuffer) return null;

  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );

  const waveLocations = {
    aPosition: gl.getAttribLocation(waveProgram, "aPosition"),
    uCurrent: gl.getUniformLocation(waveProgram, "uCurrent"),
    uPrevious: gl.getUniformLocation(waveProgram, "uPrevious"),
    uTexel: gl.getUniformLocation(waveProgram, "uTexel"),
    uMouse: gl.getUniformLocation(waveProgram, "uMouse"),
    uSplat: gl.getUniformLocation(waveProgram, "uSplat"),
    uRadius: gl.getUniformLocation(waveProgram, "uRadius"),
  };

  const compositeLocations = {
    aPosition: gl.getAttribLocation(compositeProgram, "aPosition"),
    uImage: gl.getUniformLocation(compositeProgram, "uImage"),
    uEdge: gl.getUniformLocation(compositeProgram, "uEdge"),
    uWave: gl.getUniformLocation(compositeProgram, "uWave"),
    uResolution: gl.getUniformLocation(compositeProgram, "uResolution"),
    uImageSize: gl.getUniformLocation(compositeProgram, "uImageSize"),
    uObjectPosition: gl.getUniformLocation(compositeProgram, "uObjectPosition"),
    uMouse: gl.getUniformLocation(compositeProgram, "uMouse"),
    uMouseVel: gl.getUniformLocation(compositeProgram, "uMouseVel"),
    uTilt: gl.getUniformLocation(compositeProgram, "uTilt"),
    uTime: gl.getUniformLocation(compositeProgram, "uTime"),
    uStrength: gl.getUniformLocation(compositeProgram, "uStrength"),
    uIntensity: gl.getUniformLocation(compositeProgram, "uIntensity"),
  };

  let width = 0;
  let height = 0;
  let simWidth = 0;
  let simHeight = 0;

  let waveA: WebGLTexture | null = null;
  let waveB: WebGLTexture | null = null;
  let waveRead = 0;
  let fboA: WebGLFramebuffer | null = null;
  let fboB: WebGLFramebuffer | null = null;

  let imageTexture: WebGLTexture | null = null;
  let edgeTexture: WebGLTexture | null = null;
  let ready = false;
  let disposed = false;
  let idleFrames = 0;
  const maxIdleFrames = 600;

  let animationFrame = 0;
  let lastFrameTime = 0;
  let time = 0;

  let mouseUv: Vec2 = [0.5, 0.5];
  let targetVel: Vec2 = [0, 0];
  let smoothVel: Vec2 = [0, 0];
  let pendingVel: Vec2 = [0, 0];
  let effectIntensity = 0;
  let recentMove = 0;
  let splatStrength = 0;
  let hasPointer = false;
  let pointerSeeded = false;
  let tiltActive = false;
  let onScreen = true;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let objectPosition: Vec2 = readObjectPosition(referenceImage);
  let tiltHandle: DeviceTiltHandle | null = null;
  let tiltOffset: Vec2 = [0, 0];
  let smoothTilt: Vec2 = [0, 0];
  let anchor: Vec2 = [0.5, 0.5];
  let bubblePos: Vec2 = [0.5, 0.5];
  let bubbleVel: Vec2 = [0, 0];
  let debugSource: HeroChromaticDebug["source"] = "idle";
  let tiltDebug: TiltDebug | null = null;
  let lastDebugTime = 0;

  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

  const syncObjectPosition = () => {
    objectPosition = readObjectPosition(referenceImage);
  };

  const bindQuad = (program: WebGLProgram, location: number) => {
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
  };

  const uploadImageTexture = (texture: WebGLTexture, source: HTMLImageElement) => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  };

  const ensureWaveBuffers = () => {
    if (waveA && waveB && fboA && fboB) return true;

    simWidth = Math.max(96, Math.round(width * 0.28));
    simHeight = Math.max(96, Math.round(height * 0.28));

    waveA = createTexture(gl, simWidth, simHeight);
    waveB = createTexture(gl, simWidth, simHeight);
    fboA = gl.createFramebuffer();
    fboB = gl.createFramebuffer();

    if (!waveA || !waveB || !fboA || !fboB) return false;

    gl.bindFramebuffer(gl.FRAMEBUFFER, fboA);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, waveA, 0);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fboB);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, waveB, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    waveRead = 0;
    return true;
  };

  const resize = () => {
    const rect = container.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return false;

    syncObjectPosition();

    const dpr = Math.min(window.devicePixelRatio || 1, coarsePointer ? 1.5 : 2);
    width = Math.max(1, Math.round(rect.width * dpr));
    height = Math.max(1, Math.round(rect.height * dpr));

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    for (const texture of [waveA, waveB]) {
      if (texture) gl.deleteTexture(texture);
    }
    for (const framebuffer of [fboA, fboB]) {
      if (framebuffer) gl.deleteFramebuffer(framebuffer);
    }

    waveA = null;
    waveB = null;
    fboA = null;
    fboB = null;

    return ensureWaveBuffers();
  };

  const bindFramebuffer = (framebuffer: WebGLFramebuffer, texture: WebGLTexture) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, simWidth, simHeight);
  };

  const stepWave = () => {
    if (!ensureWaveBuffers()) return;

    const readTexture = waveRead === 0 ? waveA : waveB;
    const writeTexture = waveRead === 0 ? waveB : waveA;
    const writeFbo = waveRead === 0 ? fboB : fboA;
    if (!readTexture || !writeTexture || !writeFbo) return;

    bindFramebuffer(writeFbo, writeTexture);
    bindQuad(waveProgram, waveLocations.aPosition);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, readTexture);
    gl.uniform1i(waveLocations.uCurrent, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, readTexture);
    gl.uniform1i(waveLocations.uPrevious, 1);

    gl.uniform2f(waveLocations.uTexel, 1 / simWidth, 1 / simHeight);
    gl.uniform2f(waveLocations.uMouse, mouseUv[0], mouseUv[1]);
    gl.uniform1f(waveLocations.uSplat, splatStrength);
    gl.uniform1f(waveLocations.uRadius, 0.08);
    splatStrength = 0;

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    waveRead = 1 - waveRead;
  };

  const renderComposite = () => {
    if (!imageTexture || width < 1 || height < 1) return;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    bindQuad(compositeProgram, compositeLocations.aPosition);

    const waveTexture = waveRead === 0 ? waveA : waveB;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, imageTexture);
    gl.uniform1i(compositeLocations.uImage, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, edgeTexture);
    gl.uniform1i(compositeLocations.uEdge, 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, waveTexture ?? waveA);
    gl.uniform1i(compositeLocations.uWave, 2);

    gl.uniform2f(compositeLocations.uResolution, width, height);
    gl.uniform2f(compositeLocations.uImageSize, imageSize[0], imageSize[1]);
    gl.uniform2f(compositeLocations.uObjectPosition, objectPosition[0], objectPosition[1]);
    gl.uniform2f(compositeLocations.uMouse, mouseUv[0], mouseUv[1]);
    gl.uniform2f(compositeLocations.uMouseVel, smoothVel[0], smoothVel[1]);
    gl.uniform2f(compositeLocations.uTilt, smoothTilt[0], smoothTilt[1]);
    gl.uniform1f(compositeLocations.uTime, time);
    gl.uniform1f(compositeLocations.uStrength, 1);
    gl.uniform1f(compositeLocations.uIntensity, effectIntensity);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const animate = (frameTime: number) => {
    if (disposed) return;

    // Tilt keeps the effect permanently "hovered", so idleFrames never trips on
    // mobile — park the loop whenever nobody can see it.
    if (!onScreen || document.hidden) {
      animationFrame = 0;
      lastFrameTime = 0;
      return;
    }

    const delta = lastFrameTime ? Math.min((frameTime - lastFrameTime) / 1000, 0.034) : 1 / 60;
    lastFrameTime = frameTime;
    time += delta;

    // A bubble level's bubble glides to the raised side and settles rather than
    // tracking the sensor rigidly. A finger on the glass overrides it outright.
    if (tiltActive && !pointerSeeded) {
      const step = Math.min(delta, 1 / 45);
      const target: Vec2 = [
        clamp(anchor[0] + tiltOffset[0] * TILT_SPAN, 0, 1),
        clamp(anchor[1] + tiltOffset[1] * TILT_SPAN, 0, 1),
      ];

      const moved: Vec2 = [0, 0];
      for (let axis = 0; axis < 2; axis++) {
        bubbleVel[axis] +=
          (BUBBLE_SPRING * (target[axis] - bubblePos[axis]) - BUBBLE_DAMPING * bubbleVel[axis]) *
          step;
        const drifted = bubblePos[axis] + bubbleVel[axis] * step;
        const next = clamp(drifted, 0, 1);
        // Stop dead at the edge of the portrait instead of building up pressure.
        if (next !== drifted) bubbleVel[axis] = 0;
        moved[axis] = next - bubblePos[axis];
        bubblePos[axis] = next;
      }

      mouseUv = [bubblePos[0], bubblePos[1]];
      if (Math.abs(moved[0]) > 1e-5 || Math.abs(moved[1]) > 1e-5) {
        energize(moved[0], moved[1], 1.6, 0);
      }
    }

    // Follow the held angle rather than decaying toward zero like the motion terms.
    const tiltEase = 1 - Math.exp(-6 * delta);
    smoothTilt[0] += ((tiltActive ? tiltOffset[0] : 0) - smoothTilt[0]) * tiltEase;
    smoothTilt[1] += ((tiltActive ? tiltOffset[1] : 0) - smoothTilt[1]) * tiltEase;

    const velDecay = Math.exp(-1.8 * delta);
    const inputMag = Math.hypot(pendingVel[0], pendingVel[1]);
    const velAttack = 1 - Math.exp(-9 * delta);
    const velRelease = 1 - Math.exp(-3.2 * delta);

    if (inputMag > 0.00015) {
      targetVel[0] += (pendingVel[0] - targetVel[0]) * velAttack;
      targetVel[1] += (pendingVel[1] - targetVel[1]) * velAttack;
    } else {
      targetVel[0] *= velDecay;
      targetVel[1] *= velDecay;
    }

    pendingVel[0] *= Math.exp(-6 * delta);
    pendingVel[1] *= Math.exp(-6 * delta);
    recentMove *= Math.exp(-4.5 * delta);

    const velEaseX =
      Math.abs(targetVel[0]) >= Math.abs(smoothVel[0]) ? velAttack : velRelease;
    const velEaseY =
      Math.abs(targetVel[1]) >= Math.abs(smoothVel[1]) ? velAttack : velRelease;
    smoothVel[0] += (targetVel[0] - smoothVel[0]) * velEaseX;
    smoothVel[1] += (targetVel[1] - smoothVel[1]) * velEaseY;

    const motionMag = Math.hypot(smoothVel[0], smoothVel[1]);
    const tiltMag = Math.min(Math.hypot(smoothTilt[0], smoothTilt[1]), 1);
    let intensityTarget = 0;
    if (hasPointer) {
      // The tilt term is generous so a held angle keeps the effect fully lit:
      // drive gates the mix, and a decaying drive would re-hide a steady tilt.
      intensityTarget = clamp(
        0.55 + Math.max(recentMove * 14, inputMag * 10, motionMag * 18, tiltMag * 0.9),
        0.55,
        1,
      );
    }
    const intensityAttack = 1 - Math.exp(-9 * delta);
    const intensityRelease = 1 - Math.exp(-3.0 * delta);
    const intensityEase =
      intensityTarget >= effectIntensity ? intensityAttack : intensityRelease;
    effectIntensity += (intensityTarget - effectIntensity) * intensityEase;

    stepWave();
    renderComposite();
    emitDebug();

    if (!ready) {
      ready = true;
      container.dataset.chromaticReady = "true";
    }

    const energy =
      effectIntensity +
      motionMag +
      Math.hypot(targetVel[0], targetVel[1]) +
      (hasPointer ? 0.001 : 0);

    if (energy > 0.0002) {
      idleFrames = 0;
    } else {
      idleFrames += 1;
    }

    if (idleFrames < maxIdleFrames) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      animationFrame = 0;
      lastFrameTime = 0;
      idleFrames = 0;
    }
  };

  const emitDebug = (force = false) => {
    if (!onDebug) return;
    const now = performance.now();
    if (!force && now - lastDebugTime < 60) return;
    lastDebugTime = now;
    onDebug({
      tilt: tiltDebug,
      source: debugSource,
      focus: [mouseUv[0], mouseUv[1]],
      anchor: [anchor[0], anchor[1]],
      velocity: [smoothVel[0], smoothVel[1]],
      intensity: effectIntensity,
    });
  };

  const startAnimation = () => {
    if (!animationFrame && onScreen && !document.hidden) {
      lastFrameTime = 0;
      animationFrame = requestAnimationFrame(animate);
    }
  };

  const energize = (deltaX: number, deltaY: number, gain: number, splatFloor: number) => {
    pendingVel[0] = clamp(pendingVel[0] * 0.35 + deltaX * gain, -0.14, 0.14);
    pendingVel[1] = clamp(pendingVel[1] * 0.35 + deltaY * gain, -0.14, 0.14);
    const moveMag = Math.hypot(deltaX, deltaY);
    recentMove = clamp(Math.max(recentMove, moveMag * 1.4), 0, 0.35);
    splatStrength += clamp(moveMag * 52, splatFloor, 0.45);
    startAnimation();
  };

  const updateMouseFromEvent = (event: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;

    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp(1 - (event.clientY - rect.top) / rect.height, 0, 1);
    mouseUv = [x, y];
    debugSource = event.pointerType === "touch" ? "touch" : "mouse";

    // Wherever the finger is becomes the bubble's new rest position, and the
    // attitude the device is held at right now becomes level.
    anchor = [x, y];
    bubblePos = [x, y];
    bubbleVel = [0, 0];
    tiltHandle?.recenter();

    if (!pointerSeeded) {
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      pointerSeeded = true;
      hasPointer = true;
      splatStrength += 0.22;
      recentMove = 0.08;
      startAnimation();
      return;
    }

    const deltaX = (event.clientX - lastPointerX) / rect.width;
    const deltaY = -(event.clientY - lastPointerY) / rect.height;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;

    energize(deltaX, deltaY, 1.35, 0.04);
  };

  const handlePointerMove = (event: PointerEvent) => {
    updateMouseFromEvent(event);
  };

  // A finger that lands without dragging should still light up the portrait.
  const handlePointerDown = (event: PointerEvent) => {
    updateMouseFromEvent(event);
  };

  // Touch has no hover: lifting (or losing the pointer to a scroll) ends the
  // contact, and the next one has to seed a fresh origin.
  const handlePointerRelease = () => {
    pointerSeeded = false;
    // The bubble stays where it was let go and tilts on from there; it springs
    // rather than snaps, so there is nothing to re-seed.
    bubbleVel = [0, 0];
    hasPointer = tiltActive;
    tiltHandle?.recenter();
    startAnimation();
  };

  // Phone tilt is the touch-device stand-in for the pointer. The sensor only sets
  // where the bubble is heading; the render loop does the gliding.
  const handleTilt = (sample: { x: number; y: number }) => {
    // The bubble rides to the raised edge: tipping the right side down sends it
    // left, and lifting the top pulls it up.
    tiltOffset = [-sample.x, sample.y];
    debugSource = "tilt";

    if (!tiltActive) {
      tiltActive = true;
      hasPointer = true;
      splatStrength += 0.22;
      recentMove = 0.08;
    }

    startAnimation();
  };

  const resizeObserver = new ResizeObserver(() => {
    if (resize()) {
      renderComposite();
      startAnimation();
    }
  });

  const initTextures = async () => {
    imageTexture = createTexture(gl, 1, 1, { linear: true, clamp: true });
    edgeTexture = createTexture(gl, 1, 1, { linear: true, clamp: true });
    if (!imageTexture || !edgeTexture) return;

    const portraitImage = await loadImage(imageSrc);
    uploadImageTexture(imageTexture, portraitImage);

    try {
      const edgeImage = await loadImage(edgeSrc);
      gl.bindTexture(gl.TEXTURE_2D, edgeTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, edgeImage);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    } catch (error) {
      console.warn("[hero-chromatic] Edge map unavailable, using fallback", error);
      gl.bindTexture(gl.TEXTURE_2D, edgeTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([255, 255, 255, 255]),
      );
    }

    if (!resize()) {
      await new Promise<void>((resolve) => {
        const waitForSize = () => {
          if (resize()) {
            resolve();
            return;
          }
          requestAnimationFrame(waitForSize);
        };
        waitForSize();
      });
    }

    renderComposite();
    ready = true;
    container.dataset.chromaticReady = "true";
    startAnimation();
  };

  const visibilityObserver = new IntersectionObserver(
    (entries) => {
      onScreen = entries.some((entry) => entry.isIntersecting);
      if (onScreen) startAnimation();
    },
    { threshold: 0 },
  );

  const handleDocumentVisibility = () => {
    if (!document.hidden) startAnimation();
  };

  resizeObserver.observe(container);
  visibilityObserver.observe(container);
  document.addEventListener("visibilitychange", handleDocumentVisibility);
  hero.addEventListener("pointerdown", handlePointerDown, { passive: true });
  hero.addEventListener("pointermove", handlePointerMove, { passive: true });
  hero.addEventListener("pointerup", handlePointerRelease, { passive: true });
  hero.addEventListener("pointercancel", handlePointerRelease, { passive: true });
  hero.addEventListener("pointerleave", handlePointerRelease, { passive: true });

  tiltHandle = initDeviceTilt({
    onTilt: handleTilt,
    gestureTarget: hero,
    onDebug: onDebug
      ? (debug) => {
          tiltDebug = debug;
          // The render loop parks when idle, so status changes have to push.
          emitDebug(debug.events === 0);
        }
      : undefined,
  });

  void initTextures().catch((error) => {
    console.warn("[hero-chromatic] Init failed", error);
    container.dataset.chromaticReady = "false";
  });

  return () => {
    disposed = true;
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    tiltHandle?.dispose();
    document.removeEventListener("visibilitychange", handleDocumentVisibility);
    hero.removeEventListener("pointerdown", handlePointerDown);
    hero.removeEventListener("pointermove", handlePointerMove);
    hero.removeEventListener("pointerup", handlePointerRelease);
    hero.removeEventListener("pointercancel", handlePointerRelease);
    hero.removeEventListener("pointerleave", handlePointerRelease);
    if (animationFrame) cancelAnimationFrame(animationFrame);
    delete container.dataset.chromaticReady;

    for (const texture of [waveA, waveB, imageTexture, edgeTexture]) {
      if (texture) gl.deleteTexture(texture);
    }
    for (const framebuffer of [fboA, fboB]) {
      if (framebuffer) gl.deleteFramebuffer(framebuffer);
    }
    gl.deleteBuffer(quadBuffer);
    gl.deleteProgram(waveProgram);
    gl.deleteProgram(compositeProgram);
  };
}
