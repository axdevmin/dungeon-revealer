import * as React from "react";
import * as THREE from "three";
import { useFrame, useThree } from "react-three-fiber";
import type { WeatherType, WeatherSettings } from "./weather-types";

export type { WeatherType, WeatherSettings };

type WeatherConfig = WeatherSettings;

const RAIN_COUNT = 1200;
const STORM_COUNT = 2500;
const SNOW_COUNT = 500;

// All weather materials carry this stencil test so they only render over the
// map area (where the invisible stencil mask in MapRenderer wrote ref=1).
const STENCIL_TEST = {
  stencilWrite: false as const,
  stencilRef: 1,
  stencilFunc: THREE.EqualStencilFunc,
} as const;

function windComponents(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { wx: Math.sin(rad), wy: -Math.cos(rad) };
}

// ─── RAIN ────────────────────────────────────────────────────────────────────
//
// Each drop is a short diagonal line segment (start → end).
// This makes rain look distinctly different from snow.

type LineState = {
  positions: Float32Array; // [x0,y0,z0, x1,y1,z1] per drop  (6 floats each)
  velocities: Float32Array; // [vx,vy] per drop                (2 floats each)
};

function spawnRainDrop(
  pos: Float32Array,
  vel: Float32Array,
  i: number,
  bounds: { w: number; h: number },
  windAngle: number,
  baseSpeed: number,
  scatterY = false
) {
  const { wx, wy } = windComponents(windAngle);
  const speed = baseSpeed * (0.7 + Math.random() * 0.6);
  const vx = wx * speed * 0.5 + (Math.random() - 0.5) * baseSpeed * 0.05;
  const vy = wy * speed - speed; // always falls down

  // streak length ≈ 1.5–2.5 % of viewport height
  const len = (0.015 + Math.random() * 0.01) * bounds.h;
  const norm = Math.sqrt(vx * vx + vy * vy) || 1;
  const dx = (vx / norm) * len;
  const dy = (vy / norm) * len;

  const x = (Math.random() - 0.5) * bounds.w * 1.3;
  const y = scatterY
    ? (Math.random() - 0.5) * bounds.h * 1.2
    : bounds.h * 0.52 + Math.random() * 0.06 * bounds.h;

  pos[i * 6 + 0] = x;
  pos[i * 6 + 1] = y;
  pos[i * 6 + 2] = 0;
  pos[i * 6 + 3] = x + dx;
  pos[i * 6 + 4] = y + dy;
  pos[i * 6 + 5] = 0;

  vel[i * 2 + 0] = vx;
  vel[i * 2 + 1] = vy;
}

function initLineState(
  count: number,
  bounds: { w: number; h: number },
  config: WeatherConfig,
  baseSpeed: number
): LineState {
  const positions = new Float32Array(count * 6);
  const velocities = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    spawnRainDrop(
      positions,
      velocities,
      i,
      bounds,
      config.windAngle,
      baseSpeed,
      true
    );
  }
  return { positions, velocities };
}

const RainSystem = React.memo(
  ({
    config,
    count,
    color,
    baseSpeed,
    opacity,
  }: {
    config: WeatherConfig;
    count: number;
    color: number;
    baseSpeed: number;
    opacity: number;
  }) => {
    const { viewport } = useThree();
    const geomRef = React.useRef<THREE.BufferGeometry>(null);
    const stateRef = React.useRef<LineState | null>(null);
    const bounds = { w: viewport.width, h: viewport.height };

    React.useEffect(() => {
      const state = initLineState(count, bounds, config, baseSpeed);
      stateRef.current = state;
      if (geomRef.current) {
        geomRef.current.setAttribute(
          "position",
          new THREE.BufferAttribute(state.positions, 3)
        );
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config.type, count]);

    useFrame(() => {
      const state = stateRef.current;
      if (!state || !geomRef.current) return;

      const { wx, wy } = windComponents(config.windAngle);
      const s = baseSpeed * config.intensity;

      for (let i = 0; i < count; i++) {
        const vx = wx * s * 0.5 + state.velocities[i * 2] * 0.05;
        const vy = wy * s - s;

        state.positions[i * 6 + 0] += vx;
        state.positions[i * 6 + 1] += vy;
        state.positions[i * 6 + 3] += vx;
        state.positions[i * 6 + 4] += vy;

        const px = state.positions[i * 6];
        const py = state.positions[i * 6 + 1];
        if (
          py < -bounds.h * 0.58 ||
          px < -bounds.w * 0.7 ||
          px > bounds.w * 0.7
        ) {
          spawnRainDrop(
            state.positions,
            state.velocities,
            i,
            bounds,
            config.windAngle,
            baseSpeed
          );
        }
      }

      (
        geomRef.current.attributes.position as THREE.BufferAttribute
      ).needsUpdate = true;
    });

    return (
      <lineSegments renderOrder={8}>
        <bufferGeometry ref={geomRef}>
          <bufferAttribute
            attachObject={["attributes", "position"]}
            array={stateRef.current?.positions ?? new Float32Array(count * 6)}
            count={count * 2}
            itemSize={3}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={opacity * config.intensity}
          depthWrite={false}
          {...STENCIL_TEST}
        />
      </lineSegments>
    );
  }
);

// ─── SNOW ────────────────────────────────────────────────────────────────────
//
// Round soft points with a gentle lateral wobble — clearly distinct from rain.

function spawnSnowFlake(
  pos: Float32Array,
  vel: Float32Array,
  i: number,
  bounds: { w: number; h: number },
  windAngle: number,
  scatterY = false
) {
  const { wx } = windComponents(windAngle);
  pos[i * 3 + 0] = (Math.random() - 0.5) * bounds.w * 1.1;
  pos[i * 3 + 1] = scatterY
    ? (Math.random() - 0.5) * bounds.h
    : bounds.h * 0.52 + Math.random() * 0.05 * bounds.h;
  pos[i * 3 + 2] = 0;

  vel[i * 2 + 0] = wx * 0.004 + (Math.random() - 0.5) * 0.002;
  vel[i * 2 + 1] = -(0.002 + Math.random() * 0.003); // fall speed
}

const SnowSystem = React.memo(({ config }: { config: WeatherConfig }) => {
  const { viewport } = useThree();
  const geomRef = React.useRef<THREE.BufferGeometry>(null);
  const pos = React.useRef(new Float32Array(SNOW_COUNT * 3));
  const vel = React.useRef(new Float32Array(SNOW_COUNT * 2));
  const bounds = { w: viewport.width, h: viewport.height };

  React.useEffect(() => {
    for (let i = 0; i < SNOW_COUNT; i++) {
      spawnSnowFlake(
        pos.current,
        vel.current,
        i,
        bounds,
        config.windAngle,
        true
      );
    }
    if (geomRef.current) {
      geomRef.current.setAttribute(
        "position",
        new THREE.BufferAttribute(pos.current, 3)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.type]);

  useFrame(() => {
    if (!geomRef.current) return;
    const p = pos.current;
    const v = vel.current;
    const { wx } = windComponents(config.windAngle);
    const speed = config.intensity;
    const t = Date.now() * 0.001;

    for (let i = 0; i < SNOW_COUNT; i++) {
      const wobble = Math.sin(t * 0.6 + i * 1.7) * 0.0006;
      p[i * 3 + 0] += (wx * 0.004 + wobble + v[i * 2]) * speed;
      p[i * 3 + 1] += v[i * 2 + 1] * speed;

      if (
        p[i * 3 + 1] < -bounds.h * 0.54 ||
        p[i * 3 + 0] < -bounds.w * 0.6 ||
        p[i * 3 + 0] > bounds.w * 0.6
      ) {
        spawnSnowFlake(p, v, i, bounds, config.windAngle);
      }
    }

    (geomRef.current.attributes.position as THREE.BufferAttribute).needsUpdate =
      true;
  });

  return (
    <points renderOrder={8}>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute
          attachObject={["attributes", "position"]}
          array={pos.current}
          count={SNOW_COUNT}
          itemSize={3}
          usage={THREE.DynamicDrawUsage}
        />
      </bufferGeometry>
      <pointsMaterial
        color={0xeaf4ff}
        size={3.5}
        sizeAttenuation={false}
        transparent
        opacity={0.8 * config.intensity}
        depthWrite={false}
        {...STENCIL_TEST}
      />
    </points>
  );
});

// ─── LIGHTNING ───────────────────────────────────────────────────────────────

const LightningOverlay = ({ intensity }: { intensity: number }) => {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  const flashRef = React.useRef(0);
  const timerRef = React.useRef(2 + Math.random() * 4);

  useFrame((_, delta) => {
    timerRef.current -= delta;
    if (timerRef.current <= 0) {
      flashRef.current = 0.5 + Math.random() * 0.5;
      timerRef.current = 2 + Math.random() * 5;
    }
    flashRef.current = Math.max(0, flashRef.current - delta * 5);
    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity =
        flashRef.current * intensity * 0.45;
    }
  });

  return (
    <mesh ref={meshRef} renderOrder={8}>
      <planeBufferGeometry
        attach="geometry"
        args={[viewport.width * 2, viewport.height * 2]}
      />
      <meshBasicMaterial
        attach="material"
        color={0xeeeeff}
        transparent
        opacity={0}
        depthWrite={false}
        {...STENCIL_TEST}
      />
    </mesh>
  );
};

// ─── SUN ─────────────────────────────────────────────────────────────────────

const SunOverlay = ({ intensity }: { intensity: number }) => {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity =
      (0.06 + 0.03 * Math.sin(clock.getElapsedTime() * 0.4)) * intensity;
  });

  return (
    <mesh ref={meshRef} renderOrder={8}>
      <planeBufferGeometry
        attach="geometry"
        args={[viewport.width * 2, viewport.height * 2]}
      />
      <meshBasicMaterial
        attach="material"
        color={0xffcc44}
        transparent
        opacity={0.07 * intensity}
        depthWrite={false}
        {...STENCIL_TEST}
      />
    </mesh>
  );
};

// ─── MAIN ────────────────────────────────────────────────────────────────────

type Props = { config: WeatherConfig };

export const WeatherSystem = React.memo(({ config }: Props) => {
  if (config.type === "none") return null;

  if (config.type === "sun") {
    return <SunOverlay intensity={config.intensity} />;
  }

  if (config.type === "snow") {
    return <SnowSystem config={config} />;
  }

  if (config.type === "rain") {
    return (
      <RainSystem
        config={config}
        count={RAIN_COUNT}
        color={0xaaccee}
        baseSpeed={0.022}
        opacity={0.55}
      />
    );
  }

  if (config.type === "storm") {
    return (
      <>
        <RainSystem
          config={config}
          count={STORM_COUNT}
          color={0x8899bb}
          baseSpeed={0.04}
          opacity={0.65}
        />
        <LightningOverlay intensity={config.intensity} />
      </>
    );
  }

  return null;
});
