import * as React from "react";

const BACKGROUND_IMAGES = [
  "ChatGPT Image 3 mai 2026, 15_52_27.png",
  "ChatGPT Image 3 mai 2026, 16_25_31.png",
  "ChatGPT Image 6 mai 2026, 20_54_16.png",
  "ChatGPT Image 8 mai 2026, 15_40_22.png",
  "ChatGPT Image 8 mai 2026, 15_42_35.png",
  "ChatGPT Image 9 mai 2026, 15_25_37.png",
  "ChatGPT Image 9 mai 2026, 15_28_49.png",
  "navis-background.jpg",
];

export const useRandomBackground = (): string => {
  const [bg] = React.useState(
    () =>
      BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)]
  );
  return `/images/backgrounds/${encodeURIComponent(bg)}`;
};
