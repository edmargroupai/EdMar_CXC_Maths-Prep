/**
 * EdMar design tokens — aligned to the CXC Maths brand board.
 * Colour is semantic; never convey meaning by colour alone (B-17).
 */

export const colour = {
  navy: {
    DEFAULT: "#0D1B3E",
    deep: "#0A1530",
  },
  royal: {
    DEFAULT: "#2E5BBA",
    hover: "#244A9A",
  },
  gold: {
    DEFAULT: "#F2C94C",
    hover: "#E0B73A",
    muted: "#FDF4D6",
  },
  purple: {
    DEFAULT: "#6C47FF",
    muted: "#EDE8FF",
  },
  sky: {
    DEFAULT: "#E5F1FF",
    deep: "#C8DFFA",
  },
  semantic: {
    success: "#27AE60",
    successMuted: "#D5F5E3",
    warning: "#F2994A",
    warningMuted: "#FDEBD0",
    error: "#EB5757",
    errorMuted: "#FADBD8",
    /** Muted red for common-mistakes blocks — not for marking the student's answer wrong. */
    misconception: "#B91C1C",
    misconceptionMuted: "#FEE2E2",
  },
  neutral: {
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
    950: "#020617",
  },
  surface: {
    background: "var(--edmar-color-surface-background, #ffffff)",
    foreground: "var(--edmar-color-surface-foreground, #0D1B3E)",
    card: "var(--edmar-color-surface-card, #ffffff)",
    border: "var(--edmar-color-surface-border, rgba(13, 27, 62, 0.08))",
  },
  /** @deprecated Use colour.royal — kept for existing imports */
  brand: {
    primary: "#2E5BBA",
    primaryHover: "#244A9A",
    primaryMuted: "#E5F1FF",
  },
} as const;

export const typography = {
  fontFamily: {
    sans: 'var(--edmar-font-sans, "Poppins", system-ui, sans-serif)',
    mono: 'var(--edmar-font-mono, ui-monospace, monospace)',
  },
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
    "5xl": "3rem",
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  lineHeight: {
    tight: "1.2",
    normal: "1.5",
    relaxed: "1.625",
  },
} as const;

export const space = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
} as const;

export const radii = {
  none: "0",
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.25rem",
  "3xl": "1.5rem",
  full: "9999px",
} as const;

export const shadows = {
  card: "0 4px 24px rgba(13, 27, 62, 0.08)",
  elevated: "0 12px 40px rgba(13, 27, 62, 0.12)",
} as const;

/** CSS custom-property map for apps/web theme layer. */
export const cssVariables = {
  light: {
    "--edmar-color-navy": colour.navy.DEFAULT,
    "--edmar-color-royal": colour.royal.DEFAULT,
    "--edmar-color-gold": colour.gold.DEFAULT,
    "--edmar-color-purple": colour.purple.DEFAULT,
    "--edmar-color-sky": colour.sky.DEFAULT,
    "--edmar-color-surface-background": "#ffffff",
    "--edmar-color-surface-foreground": colour.navy.DEFAULT,
    "--edmar-color-surface-card": "#ffffff",
    "--edmar-color-surface-border": "rgba(13, 27, 62, 0.08)",
    "--edmar-color-semantic-success": colour.semantic.success,
    "--edmar-color-semantic-warning": colour.semantic.warning,
    "--edmar-color-semantic-error": colour.semantic.error,
    "--edmar-color-semantic-misconception": colour.semantic.misconception,
    "--edmar-font-sans": typography.fontFamily.sans,
  },
  dark: {
    "--edmar-color-navy": colour.navy.deep,
    "--edmar-color-royal": colour.royal.DEFAULT,
    "--edmar-color-gold": colour.gold.DEFAULT,
    "--edmar-color-purple": colour.purple.DEFAULT,
    "--edmar-color-sky": colour.neutral[800],
    "--edmar-color-surface-background": colour.navy.deep,
    "--edmar-color-surface-foreground": colour.neutral[50],
    "--edmar-color-surface-card": colour.navy.DEFAULT,
    "--edmar-color-surface-border": "rgba(255, 255, 255, 0.12)",
    "--edmar-color-semantic-success": colour.semantic.success,
    "--edmar-color-semantic-warning": colour.semantic.warning,
    "--edmar-color-semantic-error": colour.semantic.error,
    "--edmar-color-semantic-misconception": colour.semantic.misconception,
    "--edmar-font-sans": typography.fontFamily.sans,
  },
} as const;

export const tokens = {
  colour,
  typography,
  space,
  radii,
  shadows,
  cssVariables,
} as const;

export type EdmarTokens = typeof tokens;
