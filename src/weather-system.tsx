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

const WIND_COUNT = 500;

function spawnWindGust(
  pos: Float32Array,
  vel: Float32Array,
  i: number,
  bounds: { w: number; h: number },
  windAngle: number
) {
  const { wx, wy } = windComponents(windAngle);
  const speed = 0.035 + Math.random() * 0.025;

  const vx = wx * speed + (Math.random() - 0.5) * 0.005;
  const vy = wy * speed * 0.4 + (Math.random() - 0.5) * 0.003;

  const len = (0.04 + Math.random() * 0.06) * bounds.w;
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
    const matRef = React.useRef<THREE.LineBasicMaterial>(null);
    const posRef = React.useRef(new Float32Array(WIND_COUNT * 6));
    const velRef = React.useRef(new Float32Array(WIND_COUNT * 2));
    const bounds = { w: dimensions.width, h: dimensions.height };

    React.useEffect(() => {
      for (let i = 0; i < WIND_COUNT; i++) {
        spawnWindGust(
          posRef.current,
          velRef.current,
          i,
          bounds,
          config.windAngle
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
      const t = Date.now() * 0.001;
      // vitesse min à 0.6 pour éviter les particules figées
      const gustFactor = 0.6 + 0.4 * Math.abs(Math.sin(t * 0.8));
      const speed = config.intensity * gustFactor;

      for (let i = 0; i < WIND_COUNT; i++) {
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
          spawnWindGust(p, v, i, bounds, config.windAngle);
        }
      }

      if (matRef.current) {
        matRef.current.opacity = (0.45 + 0.3 * gustFactor) * config.intensity;
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
            count={WIND_COUNT * 2}
            itemSize={3}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <lineBasicMaterial
          ref={matRef}
          color={0xdde8ff}
          transparent
          opacity={0.6 * config.intensity}
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

const SUN_RAY_COUNT = 14;
const SUN_PARTICLE_COUNT = 45;

const SunOverlay = ({
  intensity,
  dimensions,
}: {
  intensity: number;
  dimensions: WeatherDimensions;
}) => {
  const overlayRef = React.useRef<THREE.Mesh>(null);
  const raysGeomRef = React.useRef<THREE.BufferGeometry>(null);
  const rayMatRef = React.useRef<THREE.LineBasicMaterial>(null);
  const particlesGeomRef = React.useRef<THREE.BufferGeometry>(null);

  const rayPositions = React.useRef(new Float32Array(SUN_RAY_COUNT * 6));
  const particlePositions = React.useRef(
    new Float32Array(SUN_PARTICLE_COUNT * 3)
  );
  const particleVel = React.useRef(new Float32Array(SUN_PARTICLE_COUNT));

  const bounds = { w: dimensions.width, h: dimensions.height };
  const minDim = Math.min(dimensions.width, dimensions.height);

  React.useEffect(() => {
    for (let i = 0; i < SUN_PARTICLE_COUNT; i++) {
      particlePositions.current[i * 3 + 0] =
        (Math.random() - 0.5) * bounds.w * 0.5;
      particlePositions.current[i * 3 + 1] = (Math.random() - 0.5) * bounds.h;
      particlePositions.current[i * 3 + 2] = 0;
      particleVel.current[i] = 0.003 + Math.random() * 0.004;
    }
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (overlayRef.current) {
      const pulse = 0.08 + 0.06 * Math.sin(t * 0.5);
      (overlayRef.current.material as THREE.MeshBasicMaterial).opacity =
        pulse * intensity;
    }

    if (raysGeomRef.current && rayMatRef.current) {
      const innerR = minDim * 0.04;
      for (let i = 0; i < SUN_RAY_COUNT; i++) {
        const angle = (i / SUN_RAY_COUNT) * Math.PI * 2 + t * 0.15;
        const pulseFactor =
          0.6 + 0.4 * Math.sin(t * 1.3 + (i * Math.PI * 2) / SUN_RAY_COUNT);
        const outerR = minDim * 0.38 * pulseFactor;

        rayPositions.current[i * 6 + 0] = Math.cos(angle) * innerR;
        rayPositions.current[i * 6 + 1] = Math.sin(angle) * innerR;
        rayPositions.current[i * 6 + 2] = 0;
        rayPositions.current[i * 6 + 3] = Math.cos(angle) * outerR;
        rayPositions.current[i * 6 + 4] = Math.sin(angle) * outerR;
        rayPositions.current[i * 6 + 5] = 0;
      }
      rayMatRef.current.opacity = (0.5 + 0.25 * Math.sin(t * 0.7)) * intensity;
      (
        raysGeomRef.current.attributes.position as THREE.BufferAttribute
      ).needsUpdate = true;
    }

    if (particlesGeomRef.current) {
      for (let i = 0; i < SUN_PARTICLE_COUNT; i++) {
        particlePositions.current[i * 3 + 1] +=
          particleVel.current[i] * intensity;
        particlePositions.current[i * 3 + 0] += (Math.random() - 0.5) * 0.0008;
        if (particlePositions.current[i * 3 + 1] > bounds.h * 0.55) {
          particlePositions.current[i * 3 + 0] =
            (Math.random() - 0.5) * bounds.w * 0.5;
          particlePositions.current[i * 3 + 1] = -bounds.h * 0.55;
        }
      }
      (
        particlesGeomRef.current.attributes.position as THREE.BufferAttribute
      ).needsUpdate = true;
    }
  });

  return (
    <>
      <mesh ref={overlayRef} renderOrder={8}>
        <planeBufferGeometry
          attach="geometry"
          args={[dimensions.width, dimensions.height]}
        />
        <meshBasicMaterial
          attach="material"
          color={0xffdd44}
          transparent
          opacity={0.08 * intensity}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>

      <lineSegments renderOrder={8}>
        <bufferGeometry ref={raysGeomRef}>
          <bufferAttribute
            attachObject={["attributes", "position"]}
            array={rayPositions.current}
            count={SUN_RAY_COUNT * 2}
            itemSize={3}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <lineBasicMaterial
          ref={rayMatRef}
          color={0xffee77}
          transparent
          opacity={0.5 * intensity}
          depthWrite={false}
          depthTest={false}
        />
      </lineSegments>

      <points renderOrder={8}>
        <bufferGeometry ref={particlesGeomRef}>
          <bufferAttribute
            attachObject={["attributes", "position"]}
            array={particlePositions.current}
            count={SUN_PARTICLE_COUNT}
            itemSize={3}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <pointsMaterial
          color={0xffffa0}
          size={4}
          sizeAttenuation={false}
          transparent
          opacity={0.75 * intensity}
          depthWrite={false}
          depthTest={false}
        />
      </points>
    </>
  );
};

// ─── MOON ────────────────────────────────────────────────────────────────────

const MOON_FOG_COUNT = 70;
const MOON_STAR_COUNT = 100;

const MoonOverlay = ({
  intensity,
  dimensions,
}: {
  intensity: number;
  dimensions: WeatherDimensions;
}) => {
  const overlayRef = React.useRef<THREE.Mesh>(null);
  const fogGeomRef = React.useRef<THREE.BufferGeometry>(null);
  const fogMatRef = React.useRef<THREE.PointsMaterial>(null);
  const starsGeomRef = React.useRef<THREE.BufferGeometry>(null);
  const starsMatRef = React.useRef<THREE.PointsMaterial>(null);

  const bounds = { w: dimensions.width, h: dimensions.height };

  const fogPos = React.useRef(new Float32Array(MOON_FOG_COUNT * 3));
  const fogVel = React.useRef(new Float32Array(MOON_FOG_COUNT * 2));
  const starPos = React.useRef(new Float32Array(MOON_STAR_COUNT * 3));

  React.useEffect(() => {
    for (let i = 0; i < MOON_FOG_COUNT; i++) {
      fogPos.current[i * 3 + 0] = (Math.random() - 0.5) * bounds.w;
      fogPos.current[i * 3 + 1] = (Math.random() - 0.5) * bounds.h;
      fogPos.current[i * 3 + 2] = 0;
      fogVel.current[i * 2 + 0] = (Math.random() - 0.5) * 0.35;
      fogVel.current[i * 2 + 1] = (Math.random() - 0.5) * 0.08;
    }
    for (let i = 0; i < MOON_STAR_COUNT; i++) {
      starPos.current[i * 3 + 0] = (Math.random() - 0.5) * bounds.w;
      starPos.current[i * 3 + 1] = (Math.random() - 0.5) * bounds.h;
      starPos.current[i * 3 + 2] = 0;
    }
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (overlayRef.current) {
      (overlayRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.35 * intensity;
    }

    if (fogGeomRef.current) {
      for (let i = 0; i < MOON_FOG_COUNT; i++) {
        fogPos.current[i * 3 + 0] += fogVel.current[i * 2] * 0.3 * intensity;
        fogPos.current[i * 3 + 1] +=
          fogVel.current[i * 2 + 1] * 0.3 * intensity;

        if (Math.abs(fogPos.current[i * 3 + 0]) > bounds.w * 0.6) {
          fogPos.current[i * 3 + 0] =
            -Math.sign(fogVel.current[i * 2]) * bounds.w * 0.5;
        }
        if (Math.abs(fogPos.current[i * 3 + 1]) > bounds.h * 0.6) {
          fogPos.current[i * 3 + 1] = (Math.random() - 0.5) * bounds.h;
        }
      }
      if (fogMatRef.current) {
        fogMatRef.current.opacity =
          (0.09 + 0.05 * Math.sin(t * 0.4)) * intensity;
      }
      (
        fogGeomRef.current.attributes.position as THREE.BufferAttribute
      ).needsUpdate = true;
    }

    if (starsMatRef.current) {
      starsMatRef.current.opacity =
        (0.5 + 0.4 * Math.abs(Math.sin(t * 1.2))) * intensity;
    }
  });

  return (
    <>
      <mesh ref={overlayRef} renderOrder={8}>
        <planeBufferGeometry
          attach="geometry"
          args={[dimensions.width, dimensions.height]}
        />
        <meshBasicMaterial
          attach="material"
          color={0x0a1a33}
          transparent
          opacity={0.35 * intensity}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>

      <points renderOrder={8}>
        <bufferGeometry ref={starsGeomRef}>
          <bufferAttribute
            attachObject={["attributes", "position"]}
            array={starPos.current}
            count={MOON_STAR_COUNT}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={starsMatRef}
          color={0xffffff}
          size={2}
          sizeAttenuation={false}
          transparent
          opacity={0.6 * intensity}
          depthWrite={false}
          depthTest={false}
        />
      </points>

      <points renderOrder={8}>
        <bufferGeometry ref={fogGeomRef}>
          <bufferAttribute
            attachObject={["attributes", "position"]}
            array={fogPos.current}
            count={MOON_FOG_COUNT}
            itemSize={3}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={fogMatRef}
          color={0x7799bb}
          size={22}
          sizeAttenuation={false}
          transparent
          opacity={0.1 * intensity}
          depthWrite={false}
          depthTest={false}
        />
      </points>
    </>
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
