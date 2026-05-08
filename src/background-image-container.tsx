import React from "react";
import styled from "@emotion/styled/macro";
import { ds } from "./design-system";

// Ajoutez des images dans public/images/backgrounds/ et listez-les ici.
// Elles s'afficheront en rotation aléatoire à chaque chargement.
const BACKGROUND_IMAGES = [
  "/images/backgrounds/navis-background.jpg",
  "/images/backgrounds/dungeon-entrance.jpg",
];

const pickRandom = (arr: string[]): string =>
  arr[Math.floor(Math.random() * arr.length)];

export const Container = styled.div<{ bgImage: string }>`
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;

  background-color: ${ds.colors.bg};
  background-image: radial-gradient(
      ellipse at 20% 50%,
      rgba(96, 165, 250, 0.04) 0%,
      transparent 60%
    ),
    radial-gradient(
      ellipse at 80% 20%,
      rgba(96, 165, 250, 0.03) 0%,
      transparent 50%
    ),
    linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)),
    url(${(p) => p.bgImage});
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
`;

const Inner = styled.div`
  min-height: 40vh;
  padding: 40px 32px;
  max-width: 440px;
  width: 100%;
`;

export const BackgroundImageContainer: React.FC<{}> = ({ children }) => {
  const bgImage = React.useMemo(() => pickRandom(BACKGROUND_IMAGES), []);
  return (
    <Container bgImage={bgImage}>
      <Inner>{children}</Inner>
    </Container>
  );
};
