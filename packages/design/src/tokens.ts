/**
 * EdMar design tokens (§2.1, MASTER_BLUEPRINT §A-06).
 * Consumed as CSS variables by apps/web; React Native maps the same keys at V2.
 * Colour is semantic — never convey meaning by colour alone (B-17).
 */

export const colour = {
  brand: {
    primary: "#2563eb",
    primaryHover: "#1d4ed8",
    primaryMuted: "#dbeafe",
  },
  semantic: {
    correct: "#059669",
    correctMuted: "#d1fae5",
    tip: "#d97706",
    tipMuted: "#fef3c7",
    /** Muted red for common-mistakes blocks — not for marking the student's answer wrong. */
    misconception: "#b91c1c",
    misconceptionMuted: "#fee2e2",
  },
  neutral: {
    50: "#fafafa",
    100: "#f4f4f5",
    200: "#e4e4e7",
    300: "#d4d4d8",
    400: "#a1a1aa",
    500: "#71717a",
    600: "#52525b",
    700: "#3f3f46",
    800: "#27272a",
    900: "#18181b",
    950: "#09090b",
  },
  surface: {
    background: "var(--edmar-color-surface-background, #ffffff)",
    foreground: "var(--edmar-color-surface-foreground, #18181b)",
    card: "var(--edmar-color-surface-card, #ffffff)",
    border: "var(--edmar-color-surface-border, rgba(0, 0, 0, 0.08))",
  },
} as const;

export const typography = {
  fontFamily: {
    sans: 'var(--edmar-font-sans, "Inter", system-ui, sans-serif)',
    mono: 'var(--edmar-font-mono, "JetBrains Mono", ui-monospace, monospace)',
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
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  lineHeight: {
    tight: "1.25",
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
} as const;

export const radii = {
  none: "0",
  sm: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  full: "9999px",
} as const;

/** CSS custom-property map for apps/web theme layer (P14). */
export const cssVariables = {
  light: {
    "--edmar-color-surface-background": colour.neutral[50],
    "--edmar-color-surface-foreground": colour.neutral[900],
    "--edmar-color-surface-card": "#ffffff",
    "--edmar-color-surface-border": "rgba(0, 0, 0, 0.08)",
    "--edmar-color-brand-primary": colour.brand.primary,
    "--edmar-color-semantic-correct": colour.semantic.correct,
    "--edmar-color-semantic-tip": colour.semantic.tip,
    "--edmar-color-semantic-misconception": colour.semantic.misconception,
  },
  dark: {
    "--edmar-color-surface-background": colour.neutral[950],
    "--edmar-color-surface-foreground": colour.neutral[50],
    "--edmar-color-surface-card": colour.neutral[900],
    "--edmar-color-surface-border": "rgba(255, 255, 255, 0.12)",
    "--edmar-color-brand-primary": colour.brand.primary,
    "--edmar-color-semantic-correct": colour.semantic.correct,
    "--edmar-color-semantic-tip": colour.semantic.tip,
    "--edmar-color-semantic-misconception": colour.semantic.misconception,
  },
} as const;

export const tokens = {
  colour,
  typography,
  space,
  radii,
  cssVariables,
} as const;

export type EdmarTokens = typeof tokens;
