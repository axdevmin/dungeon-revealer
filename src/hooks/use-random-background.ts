import * as React from "react";

export const useRandomBackground = (): string | null => {
  const [bg, setBg] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/backgrounds")
      .then((r) => r.json())
      .then((json: { data: { images: string[] } }) => {
        const images = json.data?.images;
        if (images && images.length > 0) {
          setBg(images[Math.floor(Math.random() * images.length)]);
        }
      })
      .catch(() => {
        // fallback silencieux — pas de background
      });
  }, []);

  return bg;
};
