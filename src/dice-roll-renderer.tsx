import * as React from "react";
import * as THREE from "three";
import graphql from "babel-plugin-relay/macro";
import { animated, useSpring } from "@react-spring/three";
import { useSubscription } from "relay-hooks";
import { CanvasText } from "./canvas-text";
import type { diceRollRenderer_DiceRollSubscription } from "./__generated__/diceRollRenderer_DiceRollSubscription.graphql";

type DiceType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100";

type DiceRollEventData = {
  id: string;
  diceType: string;
  result: number;
};

const DICE_COLORS: Record<DiceType, string> = {
  d4: "#22c55e",
  d6: "#3b82f6",
  d8: "#a855f7",
  d10: "#f97316",
  d12: "#ec4899",
  d20: "#ef4444",
  d100: "#6366f1",
};

const ROLL_DURATION = 3200; // ms
const SPINS = 2;            // full rotations before settling
// easeOutCubic: derivative at t=0 is 3× average → natural deceleration
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Target rotation the die settles on after rolling.
 * SPINS full rotations + a final pose that tilts the die toward the camera so
 * the top face is clearly visible (X tilt ≈ 63°, slight Y rotation, no Z lean).
 */
function getTargetRotation(): [number, number, number] {
  const tau = Math.PI * 2;
  return [
    SPINS * tau + Math.PI * 0.35, // decelerate → lean toward camera
    SPINS * tau + Math.PI * 0.3,  // end with a slight Y turn for visual interest
    0,
  ];
}

/**
 * Pentagonal trapezohedron — the real shape of a d10.
 * 10 kite-shaped faces, 12 vertices (2 poles + 5 upper + 5 lower equatorial).
 *
 * For planar kite faces the constraint is h/m ≈ 9.49 (derived from coplanarity
 * of the four kite vertices). With m=0.050 → h=0.475, giving a realistic
 * aspect ratio (height ≈ diameter) and truly flat faces.
 */
function buildD10Geometry(): THREE.BufferGeometry {
  const h = 0.475; // pole height  (h/m ≈ 9.49 → planar kite faces)
  const m = 0.050; // equatorial band height offset
  const r = 0.44;  // equatorial radius
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const T = [0, h, 0];
  const B = [0, -h, 0];
  const U: number[][] = [];
  const L: number[][] = [];

  for (let i = 0; i < 5; i++) {
    const a = toRad(i * 72);
    U.push([r * Math.cos(a), m, r * Math.sin(a)]);
  }
  for (let i = 0; i < 5; i++) {
    const a = toRad(36 + i * 72);
    L.push([r * Math.cos(a), -m, r * Math.sin(a)]);
  }

  const positions: number[] = [];
  const addTri = (a: number[], b: number[], c: number[]) =>
    positions.push(...a, ...b, ...c);

  for (let i = 0; i < 5; i++) {
    const next = (i + 1) % 5;
    // Upper kite face (winding verified CCW from outside)
    addTri(T, L[i], U[i]);
    addTri(T, U[next], L[i]);
    // Lower kite face
    addTri(B, L[i], U[next]);
    addTri(B, U[next], L[next]);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(positions), 3)
  );
  geo.computeVertexNormals();
  return geo;
}

const D10Geometry = () => {
  const geo = React.useMemo(() => buildD10Geometry(), []);
  React.useEffect(() => () => geo.dispose(), [geo]);
  return <primitive attach="geometry" object={geo} />;
};

const DiceGeometry = ({ diceType }: { diceType: DiceType }) => {
  switch (diceType) {
    case "d4":
      return <tetrahedronBufferGeometry args={[0.42, 0]} />;
    case "d6":
      return <boxBufferGeometry args={[0.55, 0.55, 0.55]} />;
    case "d8":
      return <octahedronBufferGeometry args={[0.48, 0]} />;
    case "d10":
      return <D10Geometry />;
    // d100 (Zocchihedron) ≈ geodesic sphere — icosphere detail=1 → 80 triangular faces
    case "d100":
      return <icosahedronBufferGeometry args={[0.46, 1]} />;
    case "d12":
      return <dodecahedronBufferGeometry args={[0.44, 0]} />;
    case "d20":
      return <icosahedronBufferGeometry args={[0.46, 0]} />;
  }
};

/**
 * Renders the edge lines (contour) of the die — makes the 3-D shape readable
 * on a solid-coloured mesh. Uses EdgesGeometry which skips internal edges
 * (dihedral angle < 15°, e.g. the kite diagonals on a d10).
 */
const DiceEdges = ({ diceType }: { diceType: DiceType }) => {
  const geo = React.useMemo(() => {
    let base: THREE.BufferGeometry;
    switch (diceType) {
      case "d4":
        base = new THREE.TetrahedronBufferGeometry(0.42, 0);
        break;
      case "d6":
        base = new THREE.BoxBufferGeometry(0.55, 0.55, 0.55);
        break;
      case "d8":
        base = new THREE.OctahedronBufferGeometry(0.48, 0);
        break;
      case "d10":
        base = buildD10Geometry();
        break;
      case "d100":
        base = new THREE.IcosahedronBufferGeometry(0.46, 1);
        break;
      case "d12":
        base = new THREE.DodecahedronBufferGeometry(0.44, 0);
        break;
      case "d20":
        base = new THREE.IcosahedronBufferGeometry(0.46, 0);
        break;
    }
    // threshold 15° → skips nearly-flat internal edges, keeps true face borders
    const edges = new THREE.EdgesGeometry(base, 15);
    base.dispose();
    return edges;
  }, [diceType]);

  React.useEffect(() => () => geo.dispose(), [geo]);

  return (
    <lineSegments renderOrder={17}>
      <primitive attach="geometry" object={geo} />
      <lineBasicMaterial attach="material" color="#ffffff" opacity={0.85} transparent />
    </lineSegments>
  );
};

const DiceRollItem = ({
  event,
  onRemove,
}: {
  event: DiceRollEventData;
  onRemove: () => void;
}) => {
  const [showResult, setShowResult] = React.useState(false);

  const [spring, setSpring] = useSpring(() => ({
    position: [0, 2.5, 1.5] as [number, number, number],
    groupScale: 0,
  }));

  // Rotation spring: starts at zero, spins with easeOutQuart then settles
  // face-forward toward the camera.
  const [rotSpring, setRotSpring] = useSpring(() => ({
    rot: [0, 0, 0] as [number, number, number],
  }));

  const [resultSpring, setResultSpring] = useSpring(() => ({
    scale: 0,
  }));

  React.useEffect(() => {
    setSpring({
      position: [0, 0, 1.5] as [number, number, number],
      groupScale: 1,
      config: { tension: 140, friction: 18 },
    });

    setRotSpring({
      rot: getTargetRotation(),
      config: { duration: ROLL_DURATION, easing: easeOutCubic },
    });

    const landTimer = setTimeout(() => {
      setShowResult(true);
      setResultSpring({
        scale: 1,
        config: { tension: 200, friction: 20 },
      });
    }, ROLL_DURATION);

    const fadeTimer = setTimeout(() => {
      setSpring({ groupScale: 0, config: { duration: 600 } });
      setResultSpring({ scale: 0, config: { duration: 500 } });
    }, ROLL_DURATION + 2000);

    const removeTimer = setTimeout(onRemove, ROLL_DURATION + 2800);

    return () => {
      clearTimeout(landTimer);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  const diceType = event.diceType as DiceType;
  const color = DICE_COLORS[diceType] ?? "#6366f1";

  return (
    <animated.group
      position={spring.position}
      scale={spring.groupScale.to(
        (s) => [s, s, s] as [number, number, number]
      )}
    >
      {/* Spring-driven rotation settles face-forward toward camera */}
      {/* @ts-ignore – animated.group rotation with SpringValue hits TS2589 */}
      <animated.group rotation={rotSpring.rot}>
        <mesh renderOrder={15}>
          <DiceGeometry diceType={diceType} />
          <meshStandardMaterial
            attach="material"
            color={color}
            metalness={0.25}
            roughness={0.3}
          />
        </mesh>
        <DiceEdges diceType={diceType} />
      </animated.group>
      {showResult && (
        <animated.group
          position={[0, 1.6, 0]}
          scale={resultSpring.scale.to(
            (s) => [s, s, s] as [number, number, number]
          )}
        >
          <CanvasText
            fontSize={0.55}
            anchorX="center"
            anchorY="middle"
            color="white"
            renderOrder={16}
          >
            {String(event.result)}
          </CanvasText>
          <CanvasText
            fontSize={0.22}
            anchorX="center"
            anchorY="top"
            color={color}
            position={[0, -0.42, 0]}
            renderOrder={16}
          >
            {diceType.toUpperCase()}
          </CanvasText>
        </animated.group>
      )}
    </animated.group>
  );
};

const DiceRollSubscription = graphql`
  subscription diceRollRenderer_DiceRollSubscription($mapId: ID!) {
    diceRoll(mapId: $mapId) {
      id
      diceType
      result
    }
  }
`;

export const DiceRollRenderer = ({ mapId }: { mapId: string }) => {
  const [rolls, setRolls] = React.useState<DiceRollEventData[]>([]);

  useSubscription<diceRollRenderer_DiceRollSubscription>(
    React.useMemo(
      () => ({
        subscription: DiceRollSubscription,
        variables: { mapId },
        onNext: (data) => {
          if (data?.diceRoll) {
            setRolls((prev) => [...prev, data.diceRoll]);
          }
        },
      }),
      [mapId]
    )
  );

  return (
    <>
      {rolls.map((roll) => (
        <DiceRollItem
          key={roll.id}
          event={roll}
          onRemove={() =>
            setRolls((prev) => prev.filter((r) => r.id !== roll.id))
          }
        />
      ))}
    </>
  );
};
