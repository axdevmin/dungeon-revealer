import * as React from "react";
import * as THREE from "three";
import graphql from "babel-plugin-relay/macro";
import { useFrame } from "react-three-fiber";
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

const ROLL_DURATION = 2500;

const DiceGeometry = ({ diceType }: { diceType: DiceType }) => {
  switch (diceType) {
    case "d4":
      return <tetrahedronBufferGeometry args={[0.42, 0]} />;
    case "d6":
      return <boxBufferGeometry args={[0.55, 0.55, 0.55]} />;
    case "d8":
      return <octahedronBufferGeometry args={[0.48, 0]} />;
    case "d10":
    case "d100":
      return <coneBufferGeometry args={[0.36, 0.62, 10, 1]} />;
    case "d12":
      return <dodecahedronBufferGeometry args={[0.44, 0]} />;
    case "d20":
      return <icosahedronBufferGeometry args={[0.46, 0]} />;
  }
};

const DiceRollItem = ({
  event,
  onRemove,
}: {
  event: DiceRollEventData;
  onRemove: () => void;
}) => {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const startTime = React.useRef(Date.now());
  const [showResult, setShowResult] = React.useState(false);

  const [spring, setSpring] = useSpring(() => ({
    position: [0, 2.5, 1.5] as [number, number, number],
    dieOpacity: 0,
    groupScale: 0.3,
  }));

  const [resultSpring, setResultSpring] = useSpring(() => ({
    scale: 0,
  }));

  React.useEffect(() => {
    setSpring({
      position: [0, 0, 1.5] as [number, number, number],
      dieOpacity: 1,
      groupScale: 1,
      config: { tension: 140, friction: 18 },
    });

    const landTimer = setTimeout(() => {
      setShowResult(true);
      setResultSpring({
        scale: 1,
        config: { tension: 200, friction: 20 },
      });
    }, ROLL_DURATION);

    const fadeTimer = setTimeout(() => {
      setSpring({ dieOpacity: 0, groupScale: 0.5, config: { duration: 600 } });
      setResultSpring({ scale: 0, config: { duration: 500 } });
    }, 4500);

    const removeTimer = setTimeout(onRemove, 5300);

    return () => {
      clearTimeout(landTimer);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / ROLL_DURATION, 1);
    if (progress < 1) {
      const speed = Math.pow(1 - progress, 1.5) * 10;
      meshRef.current.rotation.x += speed * delta;
      meshRef.current.rotation.y += speed * 0.73 * delta;
      meshRef.current.rotation.z += speed * 0.45 * delta;
    }
  });

  const diceType = event.diceType as DiceType;
  const color = DICE_COLORS[diceType] ?? "#6366f1";

  return (
    <animated.group
      position={spring.position}
      scale={spring.groupScale.to(
        (s) => [s, s, s] as [number, number, number]
      )}
    >
      <mesh ref={meshRef} renderOrder={15}>
        <DiceGeometry diceType={diceType} />
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore – react-spring/three animated material with many props hits TS2589 */}
        <animated.meshStandardMaterial
          attach="material"
          color={color}
          metalness={0.25}
          roughness={0.3}
          transparent
          depthWrite={false}
          opacity={spring.dieOpacity}
        />
      </mesh>
      {showResult && (
        <animated.group
          position={[0, 0.9, 0]}
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
