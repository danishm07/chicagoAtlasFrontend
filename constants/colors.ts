import { Platform } from "react-native";

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
  cardShadow: Platform.select({
    web: {
      boxShadow: "0 1px 3px rgba(28,27,24,0.06), 0 4px 16px rgba(28,27,24,0.04)",
    },
    default: {
      shadowColor: "#1C1B18",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 2,
    },
  }) as object,
} as const;

export default Colors;

export const DarkColors = {
  background: "#0F0F0F",
  surface: "#1A1A1A",
  border: "#2A2A2A",
  textPrimary: "#F7F6F3",
  textSecondary: "#7C7870",
  textTertiary: "#4A4A4A",
  accent: "#E8533A",
  success: "#16A34A",
  successBg: "#0D2D1A",
  warning: "#B8860B",
  warningBg: "#2D2500",
  danger: "#C8303A",
  dangerBg: "#2D0A0C",
  depaul: "#005596",
  cardShadow: Platform.select({
    web: {
      boxShadow: "0 1px 3px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2)",
    },
    default: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 4,
    },
  }) as object,
} as const;

export const light = {
  tint: Colors.accent,
  tabIconDefault: Colors.textTertiary,
  tabIconSelected: Colors.accent,
};
