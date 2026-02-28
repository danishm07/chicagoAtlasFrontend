import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useProfile } from "@/context/profile";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Feather name="zap" size={18} color={Colors.accent} />
          </View>
          <Text style={styles.logoText}>Loop Pulse</Text>
        </View>
        <View style={styles.zonePill}>
          <Feather name="map-pin" size={11} color={Colors.accent} />
          <Text style={styles.zoneText}>
            {profile?.homeZone
              ? profile.homeZone.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
              : "The Loop"}
          </Text>
        </View>
      </View>

      <View style={styles.center}>
        <View style={styles.pulse}>
          <Feather name="zap" size={40} color={Colors.accent} />
        </View>
        <Text style={styles.greeting}>
          {profile?.name ? `Hey, ${profile.name}.` : "Hey there."}
        </Text>
        <Text style={styles.sub}>Your Loop is loading soon.</Text>
        <Text style={styles.meta}>More screens coming in the next prompts.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "#FEF0ED",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontFamily: "DM_Sans_700Bold",
    fontSize: 15,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  zonePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#FEF0ED",
    borderRadius: 20,
  },
  zoneText: {
    fontFamily: "DM_Mono_400Regular",
    fontSize: 11,
    color: Colors.accent,
    letterSpacing: 0.3,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  pulse: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "#FEF0ED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  greeting: {
    fontFamily: "DM_Sans_700Bold",
    fontSize: 28,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  sub: {
    fontFamily: "DM_Sans_400Regular",
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  meta: {
    fontFamily: "DM_Mono_400Regular",
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: "center",
    marginTop: 4,
    letterSpacing: 0.2,
  },
});
