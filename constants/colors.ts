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
  cardShadow: {
    shadowColor: "#1C1B18",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
} as const;

export default Colors;

export const light = {
  tint: Colors.accent,
  tabIconDefault: Colors.textTertiary,
  tabIconSelected: Colors.accent,
};
