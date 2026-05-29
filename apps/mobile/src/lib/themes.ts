export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
} as const;

export const fontFamilies = {
  base: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semiBold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
  },
  heading: {
    regular: "Newsreader_400Regular",
    bold: "Newsreader_700Bold",
  },
} as const;

export const fontWeight = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const radius = {
  sm: 3,
  md: 6,
  lg: 8,
  xl: 11,
  "2xl": 14,
  "3xl": 18,
  "4xl": 21,
} as const;

export type ColorTheme = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  border: string;
  input: string;
  ring: string;
  statusBarIcons: "light" | "dark";
};

export type Theme = "light" | "dark";

export const themes: Record<Theme, ColorTheme> = {
  light: {
    background: "#fcfbf7",
    foreground: "#0f172a",
    card: "#f5f4ee",
    cardForeground: "#0f172a",
    primary: "#1a4331",
    primaryForeground: "#fcfbf7",
    secondary: "#059669",
    secondaryForeground: "#fcfbf7",
    muted: "#edecea",
    mutedForeground: "#96a5b9",
    accent: "#edf7f3",
    accentForeground: "#1a4331",
    destructive: "#dc2626",
    border: "#e2e0d8",
    input: "#e2e0d8",
    ring: "#1a4331",
    statusBarIcons: "dark",
  },
  dark: {
    background: "#0d1f18",
    foreground: "#f5f4ee",
    card: "#162b1f",
    cardForeground: "#f5f4ee",
    primary: "#34d399",
    primaryForeground: "#0d1f18",
    secondary: "#059669",
    secondaryForeground: "#fcfbf7",
    muted: "#1e3329",
    mutedForeground: "#96a5b9",
    accent: "#1e3329",
    accentForeground: "#34d399",
    destructive: "#f87171",
    border: "rgba(255, 255, 255, 0.1)",
    input: "rgba(255, 255, 255, 0.15)",
    ring: "#34d399",
    statusBarIcons: "light",
  },
};
