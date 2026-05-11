import * as React from "react";

const BACKGROUND_IMAGES = [
  "navis-background.jpg",
  "combat_nains_mines.png",
  "darnell_jeune_chasse.png",
  "darnell_jeune_epee.png",
  "darnell_jeune_lecture.png",
  "darnell_victorieux_arene.png",
  "groupe_boite_magique.png",
  "groupe_grange.png",
  "groupe_khaelen_vol.png",
  "groupe_taverne.png",
  "lidda_bunnar.png",
  "reve_khaelen.png",
  "tempete_navire.png",
];

export const useRandomBackground = (): string => {
  const [bg] = React.useState(
    () =>
      BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)]
  );
  return `/images/backgrounds/${encodeURIComponent(bg)}`;
};
