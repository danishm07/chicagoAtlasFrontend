import { Platform } from "react-native";

const shadowCard = Platform.select({
  web: { boxShadow: "0 1px 3px rgba(28,27,24,0.06), 0 4px 16px rgba(28,27,24,0.04)" },
  default: { shadowColor: "#1C1B18", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
}) as object;

const shadowCardDark = Platform.select({
  web: { boxShadow: "0 1px 3px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2)" },
  default: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 4 },
}) as object;

const Colors = {
  background: "#F7F6F3",
  surface: "#FFFFFF",
  border: "#E8E5DF",
  textPrimary: "#1C1B18",
  textSecondary: "#7C7870",
  textTertiary: "#B5B0A7",
  accent: "#E8533A",
  success: "#16A34A",
  successBg: "#EDF7F2",
  warning: "#B8860B",
  warningBg: "#FDF8ED",
  danger: "#C8303A",
  dangerBg: "#FDF0F1",
  depaul: "#005596",
  cardShadow: shadowCard,
} as const;

export default Colors;

export const DarkColors = {
  background: "#1E1E1E",
  surface: "#2A2A2A",
  border: "#3A3A3A",
  textPrimary: "#F0EEE9",
  textSecondary: "#A0A0A0",
  textTertiary: "#666666",
  accent: "#E8533A",
  success: "#16A34A",
  successBg: "#0D2D1A",
  warning: "#B8860B",
  warningBg: "#2D2500",
  danger: "#C8303A",
  dangerBg: "#2D0A0C",
  depaul: "#005596",
  cardShadow: shadowCardDark,
} as const;

export const VividColors = {
  background: "#000000",
  surface: "#111111",
  border: "#333333",
  textPrimary: "#FFFFFF",
  textSecondary: "#D0D0D0",
  textTertiary: "#888888",
  accent: "#FF6B4E",
  success: "#22C55E",
  successBg: "#052010",
  warning: "#EAB308",
  warningBg: "#1A1200",
  danger: "#EF4444",
  dangerBg: "#200505",
  depaul: "#3B82F6",
  cardShadow: shadowCardDark,
} as const;

export type ColorTheme = typeof Colors;

export const CHICAGO_SIDES = [
  { id: "far_north",     label: "Far North Side",    color: "#7BB5E0" },
  { id: "northwest",     label: "Northwest Side",     color: "#95C17A" },
  { id: "north",         label: "North Side",         color: "#F0A96F" },
  { id: "west",          label: "West Side",          color: "#C09AD4" },
  { id: "central",       label: "Central",            color: "#E8533A" },
  { id: "south",         label: "South Side",         color: "#6DAAAA" },
  { id: "southwest",     label: "Southwest Side",     color: "#D4A96F" },
  { id: "far_southwest", label: "Far Southwest Side", color: "#A9B4C4" },
  { id: "far_southeast", label: "Far Southeast Side", color: "#B5A08C" },
] as const;

export const ZONE_LABEL_MAP: Record<string, string> = {
  far_north: "Far North Side",
  northwest: "Northwest Side",
  north: "North Side",
  west: "West Side",
  central: "Central",
  south: "South Side",
  southwest: "Southwest Side",
  far_southwest: "Far Southwest Side",
  far_southeast: "Far Southeast Side",
  north_side: "North Side",
  near_campus: "Near Campus",
  loop: "The Loop",
  south_side: "South Side",
  west_side: "West Side",
  depaul_loop: "DePaul Loop",
  gps: "My Location",
};

export const light = {
  tint: Colors.accent,
  tabIconDefault: Colors.textTertiary,
  tabIconSelected: Colors.accent,
};
