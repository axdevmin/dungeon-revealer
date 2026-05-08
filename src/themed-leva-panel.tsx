import * as React from "react";
import { LevaPanel } from "leva";

const levaTheme = {
  colors: {
    elevation1: "#1e2330",
    elevation2: "#161a23",
    elevation3: "#252b3b",
    accent1: "rgba(255,255,255,0.08)",
    accent2: "rgba(255,255,255,0.12)",
    accent3: "rgba(96,165,250,0.3)",
    highlight1: "#6b7280",
    highlight2: "#e8e6e1",
    highlight3: "#60a5fa",
    toolTipBackground: "#1e2330",
    toolTipText: "#e8e6e1",
  },
  fonts: {
    mono: "inherit",
    sans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  fontSizes: {
    root: "12px",
  },
  sizes: {
    rootWidth: "100%",
    controlWidth: "100px",
    rowHeight: "28px",
    folderTitleHeight: "30px",
    checkboxSize: "14px",
    joystickWidth: "100px",
    joystickHeight: "100px",
    colorPickerWidth: "160px",
    imagePreviewSize: "60px",
    monitorHeight: "60px",
    scrubberWidth: "8px",
    scrubberHeight: "16px",
    numberInputMinWidth: "56px",
  },
  radii: {
    xs: "4px",
    sm: "6px",
    lg: "8px",
  },
  borderWidths: {
    root: "1px",
    input: "1px",
    focus: "1px",
    hover: "1px",
    active: "1px",
    folder: "1px",
  },
  shadows: {
    level1: "none",
    level2: "none",
  },
  space: {
    xs: "4px",
    sm: "6px",
    md: "10px",
    rowGap: "6px",
    colGap: "6px",
  },
};

export const ThemedLevaPanel = (
  props: React.ComponentProps<typeof LevaPanel>
) => <LevaPanel {...props} theme={levaTheme} />;
