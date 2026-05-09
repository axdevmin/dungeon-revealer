import * as React from "react";
import * as THREE from "three";
import { useFrame, useThree } from "react-three-fiber";
import type { WeatherType, WeatherSettings } from "./weather-types";

export type { WeatherType, WeatherSettings };

type WeatherConfig = WeatherSettings;

const RAIN_COUNT = 1200;
const STORM_COUNT = 2500;
const SNOW_COUNT = 500;

type WeatherDimensions = { width: number; height: number };

function windComponents(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { wx: Math.sin(rad), wy: -Math.cos(rad) };
}

// ─── RAIN ────────────────────────────────────────────────────────────────────

type LineState = {
  positions: Float32Array;
  velocities: Float32Array;
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
  const vy = wy * speed - speed;

  const len = (0.015 + Math.random() * 0.01) * bounds.h;
  const norm = Math.sqrt(vx * vx + vy * vy) || 1;
  const dx = (vx / norm) * len;
  const dy = (vy / norm) * len;

  const x = (Math.random() - 0.5) * bounds.w;
  const y = scatterY ? (Math.random() - 0.5) * bounds.h : bounds.h * 0.5;

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
    dimensions,
    clippingPlanes,
  }: {
    config: WeatherConfig;
    count: number;
    color: number;
    baseSpeed: number;
    opacity: number;
    dimensions: WeatherDimensions;
    clippingPlanes: THREE.Plane[];
  }) => {
    const geomRef = React.useRef<THREE.BufferGeometry>(null);
    const stateRef = React.useRef<LineState | null>(null);
    const bounds = { w: dimensions.width, h: dimensions.height };

    React.useEffect(() => {
      const state = initLineState(count, bounds, config, baseSpeed);
      stateRef.current = state;
      if (geomRef.current) {
        geomRef.current.setAttribute(
          "position",
          new THREE.BufferAttribute(state.positions, 3)
        );
      }
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
          py < -bounds.h * 0.5 ||
          px < -bounds.w * 0.5 ||
          px > bounds.w * 0.5
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
          depthTest={false}
          clippingPlanes={clippingPlanes}
        />
      </lineSegments>
    );
  }
);

// ─── SNOW ────────────────────────────────────────────────────────────────────

function spawnSnowFlake(
  pos: Float32Array,
  vel: Float32Array,
  i: number,
  bounds: { w: number; h: number },
  windAngle: number,
  scatterY = false
) {
  const { wx } = windComponents(windAngle);
  pos[i * 3 + 0] = (Math.random() - 0.5) * bounds.w;
  pos[i * 3 + 1] = scatterY ? (Math.random() - 0.5) * bounds.h : bounds.h * 0.5;
  pos[i * 3 + 2] = 0;

  vel[i * 2 + 0] = wx * 0.004 + (Math.random() - 0.5) * 0.002;
  vel[i * 2 + 1] = -(0.002 + Math.random() * 0.003);
}

const SnowSystem = React.memo(
  ({
    config,
    dimensions,
    clippingPlanes,
  }: {
    config: WeatherConfig;
    dimensions: WeatherDimensions;
    clippingPlanes: THREE.Plane[];
  }) => {
    const geomRef = React.useRef<THREE.BufferGeometry>(null);
    const pos = React.useRef(new Float32Array(SNOW_COUNT * 3));
    const vel = React.useRef(new Float32Array(SNOW_COUNT * 2));
    const bounds = { w: dimensions.width, h: dimensions.height };

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
          p[i * 3 + 1] < -bounds.h * 0.5 ||
          p[i * 3 + 0] < -bounds.w * 0.5 ||
          p[i * 3 + 0] > bounds.w * 0.5
        ) {
          spawnSnowFlake(p, v, i, bounds, config.windAngle);
        }
      }

      (
        geomRef.current.attributes.position as THREE.BufferAttribute
      ).needsUpdate = true;
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
          depthTest={false}
          clippingPlanes={clippingPlanes}
        />
      </points>
    );
  }
);

// ─── WIND ────────────────────────────────────────────────────────────────────

const WIND_BURST_COUNT = 300;

function spawnWindGust(
  pos: Float32Array,
  vel: Float32Array,
  i: number,
  bounds: { w: number; h: number },
  windAngle: number,
  gusts: number
) {
  const { wx, wy } = windComponents(windAngle);
  const speed = 0.02 + Math.random() * 0.01;
  const gustIntensity = 0.5 + 0.5 * Math.sin(gusts * 0.3 + i * 0.1);

  const vx = wx * speed * gustIntensity;
  const vy = wy * speed * gustIntensity * 0.3 + (Math.random() - 0.5) * 0.002;

  const len = (0.02 + Math.random() * 0.015) * bounds.h;
  const norm = Math.sqrt(vx * vx + vy * vy) || 1;
  const dx = (vx / norm) * len;
  const dy = (vy / norm) * len;

  const x = (Math.random() - 0.5) * bounds.w;
  const y = (Math.random() - 0.5) * bounds.h;

  pos[i * 6 + 0] = x;
  pos[i * 6 + 1] = y;
  pos[i * 6 + 2] = 0;
  pos[i * 6 + 3] = x + dx;
  pos[i * 6 + 4] = y + dy;
  pos[i * 6 + 5] = 0;

  vel[i * 2 + 0] = vx;
  vel[i * 2 + 1] = vy;
}

const WindSystem = React.memo(
  ({
    config,
    dimensions,
    clippingPlanes,
  }: {
    config: WeatherConfig;
    dimensions: WeatherDimensions;
    clippingPlanes: THREE.Plane[];
  }) => {
    const geomRef = React.useRef<THREE.BufferGeometry>(null);
    const posRef = React.useRef(new Float32Array(WIND_BURST_COUNT * 6));
    const velRef = React.useRef(new Float32Array(WIND_BURST_COUNT * 2));
    const bounds = { w: dimensions.width, h: dimensions.height };

    React.useEffect(() => {
      const t = Date.now() * 0.001;
      for (let i = 0; i < WIND_BURST_COUNT; i++) {
        spawnWindGust(
          posRef.current,
          velRef.current,
          i,
          bounds,
          config.windAngle,
          t
        );
      }
      if (geomRef.current) {
        geomRef.current.setAttribute(
          "position",
          new THREE.BufferAttribute(posRef.current, 3)
        );
      }
    }, [config.type]);

    useFrame(() => {
      if (!geomRef.current) return;
      const p = posRef.current;
      const v = velRef.current;
      const { wx } = windComponents(config.windAngle);
      const t = Date.now() * 0.001;
      const gustFactor = 0.5 + 0.5 * Math.sin(t * 0.7);
      const speed = config.intensity * gustFactor;

      for (let i = 0; i < WIND_BURST_COUNT; i++) {
        p[i * 6 + 0] += v[i * 2] * speed;
        p[i * 6 + 1] += v[i * 2 + 1] * speed;
        p[i * 6 + 3] += v[i * 2] * speed;
        p[i * 6 + 4] += v[i * 2 + 1] * speed;

        const px = p[i * 6];
        const py = p[i * 6 + 1];
        if (
          py < -bounds.h * 0.6 ||
          py > bounds.h * 0.6 ||
          px < -bounds.w * 0.6 ||
          px > bounds.w * 0.6
        ) {
          spawnWindGust(p, v, i, bounds, config.windAngle, t);
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
            array={posRef.current}
            count={WIND_BURST_COUNT * 2}
            itemSize={3}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={0xccccdd}
          transparent
          opacity={0.4 * config.intensity}
          depthWrite={false}
          depthTest={false}
          clippingPlanes={clippingPlanes}
        />
      </lineSegments>
    );
  }
);

// ─── LIGHTNING ───────────────────────────────────────────────────────────────

const LightningOverlay = ({
  intensity,
  dimensions,
}: {
  intensity: number;
  dimensions: WeatherDimensions;
}) => {
  const meshRef = React.useRef<THREE.Mesh>(null);
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
        args={[dimensions.width, dimensions.height]}
      />
      <meshBasicMaterial
        attach="material"
        color={0xeeeeff}
        transparent
        opacity={0}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
};

// ─── SUN ─────────────────────────────────────────────────────────────────────

const SunOverlay = ({
  intensity,
  dimensions,
}: {
  intensity: number;
  dimensions: WeatherDimensions;
}) => {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const haloRef = React.useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const time = clock.getElapsedTime();
    const basePulse = 0.08 + 0.05 * Math.sin(time * 0.4);
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity =
      basePulse * intensity;

    if (haloRef.current) {
      const haloPulse = 0.04 + 0.03 * Math.sin(time * 0.3 + 0.5);
      (haloRef.current.material as THREE.MeshBasicMaterial).opacity =
        haloPulse * intensity;
    }
  });

  return (
    <>
      <mesh ref={meshRef} renderOrder={8}>
        <planeBufferGeometry
          attach="geometry"
          args={[dimensions.width, dimensions.height]}
        />
        <meshBasicMaterial
          attach="material"
          color={0xffdd66}
          transparent
          opacity={0.07 * intensity}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      <mesh ref={haloRef} renderOrder={7}>
        <planeBufferGeometry
          attach="geometry"
          args={[dimensions.width * 1.3, dimensions.height * 1.3]}
        />
        <meshBasicMaterial
          attach="material"
          color={0xffffaa}
          transparent
          opacity={0.03 * intensity}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
    </>
  );
};

// ─── MOON ────────────────────────────────────────────────────────────────────

const MoonOverlay = ({
  intensity,
  dimensions,
}: {
  intensity: number;
  dimensions: WeatherDimensions;
}) => {
  const meshRef = React.useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity =
      0.25 * intensity;
  });

  return (
    <mesh ref={meshRef} renderOrder={8}>
      <planeBufferGeometry
        attach="geometry"
        args={[dimensions.width, dimensions.height]}
      />
      <meshBasicMaterial
        attach="material"
        color={0x3366cc}
        transparent
        opacity={0.25 * intensity}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
};

// ─── MAIN ────────────────────────────────────────────────────────────────────

type Props = {
  config: WeatherConfig;
  dimensions: WeatherDimensions;
};

const WeatherSystemInner = ({ config, dimensions }: Props) => {
  const { gl } = useThree();

  React.useEffect(() => {
    gl.localClippingEnabled = true;
  }, [gl]);

  const clippingPlanes = React.useMemo(
    () => [
      new THREE.Plane(new THREE.Vector3(1, 0, 0), dimensions.width / 2),
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), dimensions.width / 2),
      new THREE.Plane(new THREE.Vector3(0, 1, 0), dimensions.height / 2),
      new THREE.Plane(new THREE.Vector3(0, -1, 0), dimensions.height / 2),
    ],
    [dimensions.width, dimensions.height]
  );

  if (config.type === "sun") {
    return <SunOverlay intensity={config.intensity} dimensions={dimensions} />;
  }

  if (config.type === "moon") {
    return <MoonOverlay intensity={config.intensity} dimensions={dimensions} />;
  }

  if (config.type === "wind") {
    return (
      <WindSystem
        config={config}
        dimensions={dimensions}
        clippingPlanes={clippingPlanes}
      />
    );
  }

  if (config.type === "snow") {
    return (
      <SnowSystem
        config={config}
        dimensions={dimensions}
        clippingPlanes={clippingPlanes}
      />
    );
  }

  if (config.type === "rain") {
    return (
      <RainSystem
        config={config}
        count={RAIN_COUNT}
        color={0xaaccee}
        baseSpeed={0.022}
        opacity={0.55}
        dimensions={dimensions}
        clippingPlanes={clippingPlanes}
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
          dimensions={dimensions}
          clippingPlanes={clippingPlanes}
        />
        <LightningOverlay
          intensity={config.intensity}
          dimensions={dimensions}
        />
      </>
    );
  }

  return null;
};

export const WeatherSystem = React.memo(({ config, dimensions }: Props) => {
  if (config.type === "none") return null;
  return <WeatherSystemInner config={config} dimensions={dimensions} />;
});
