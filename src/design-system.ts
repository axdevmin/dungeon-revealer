export const ds = {
  colors: {
    bg: "#0d0f14",
    surface: "#161a23",
    surfaceHover: "#1e2330",
    surfaceActive: "#252b3b",
    border: "rgba(255,255,255,0.06)",
    borderStrong: "rgba(255,255,255,0.12)",

    accent: "#60a5fa",
    accentHover: "#93c5fd",
    accentMuted: "rgba(96,165,250,0.12)",
    accentBorder: "rgba(96,165,250,0.3)",

    textPrimary: "#e8e6e1",
    textSecondary: "#9ca3af",
    textMuted: "#6b7280",
    textAccent: "#60a5fa",

    danger: "#dc4a4a",
    dangerMuted: "rgba(220,74,74,0.15)",
    success: "#4ade80",
    successMuted: "rgba(74,222,128,0.15)",

    overlay: "rgba(13,15,20,0.8)",
    glass: "rgba(22,26,35,0.85)",
    glassDark: "rgba(13,15,20,0.75)",
  },

  radii: {
    sm: "6px",
    md: "10px",
    lg: "14px",
    xl: "20px",
    full: "9999px",
  },

  shadows: {
    sm: "0 1px 3px rgba(0,0,0,0.4)",
    md: "0 4px 16px rgba(0,0,0,0.5)",
    lg: "0 8px 32px rgba(0,0,0,0.6)",
    accent: "0 0 0 2px rgba(96,165,250,0.4)",
    glow: "0 0 20px rgba(96,165,250,0.2)",
  },

  blur: {
    sm: "blur(8px)",
    md: "blur(16px)",
    lg: "blur(24px)",
  },

  transitions: {
    fast: "0.12s ease",
    base: "0.2s ease",
    slow: "0.35s ease",
  },

  font: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    brand: "folkard, palitino, serif",
  },

  zIndex: {
    map: 0,
    toolbar: 10,
    aside: 20,
    overlay: 30,
    modal: 40,
    toast: 50,
  },
} as const;

export const cssVars = `
  :root {
    --bg: ${ds.colors.bg};
    --surface: ${ds.colors.surface};
    --surface-hover: ${ds.colors.surfaceHover};
    --surface-active: ${ds.colors.surfaceActive};
    --border: ${ds.colors.border};
    --border-strong: ${ds.colors.borderStrong};

    --accent: ${ds.colors.accent};
    --accent-hover: ${ds.colors.accentHover};
    --accent-muted: ${ds.colors.accentMuted};
    --accent-border: ${ds.colors.accentBorder};

    --text-primary: ${ds.colors.textPrimary};
    --text-secondary: ${ds.colors.textSecondary};
    --text-muted: ${ds.colors.textMuted};

    --danger: ${ds.colors.danger};
    --success: ${ds.colors.success};

    --radius-sm: ${ds.radii.sm};
    --radius-md: ${ds.radii.md};
    --radius-lg: ${ds.radii.lg};
  }
`;
