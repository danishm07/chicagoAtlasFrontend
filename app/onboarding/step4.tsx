import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Animated,
  Switch,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useProfile } from "@/context/profile";

export default function OnboardingStep4() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    name: string;
    personas: string;
    university?: string;
    sportsNotifications?: string;
    interests?: string;
    homeZone: string;
  }>();
  const { saveProfile } = useProfile();

  const [safetyAlerts, setSafetyAlerts] = useState(false);
  const [trainAlerts, setTrainAlerts] = useState(false);
  const ctaScale = useRef(new Animated.Value(1)).current;

  const handleComplete = async () => {
    Animated.sequence([
      Animated.timing(ctaScale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(ctaScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await saveProfile({
      name: params.name ?? "",
      personas: params.personas ? params.personas.split(",").filter(Boolean) : [],
      university: params.university ?? "",
      sportsNotifications: params.sportsNotifications === "true",
      interests: params.interests ? params.interests.split(",").filter(Boolean) : [],
      homeZone: params.homeZone ?? "central",
      currentZone: params.homeZone ?? "central",
      safetyAlerts,
      emergencyContact: null,
      trainAlerts,
      onboardedAt: new Date().toISOString(),
    });

    router.replace("/(tabs)");
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.progressBar}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.progressSegment, styles.filled]} />
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 140 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.textSecondary} />
        </Pressable>

        <Text style={styles.heading}>Stay safe{"\n"}out there.</Text>
        <Text style={styles.subtitle}>Optional but recommended.</Text>

        <View style={styles.togglesCard}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleLabel}>Safety alerts</Text>
              <Text style={styles.toggleDesc}>Get notified about serious incidents near you</Text>
            </View>
            <Switch
              value={safetyAlerts}
              onValueChange={setSafetyAlerts}
              trackColor={{ false: Colors.border, true: Colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleLabel}>Train alerts</Text>
              <Text style={styles.toggleDesc}>Subtle nudge when your train is arriving nearby</Text>
            </View>
            <Switch
              value={trainAlerts}
              onValueChange={setTrainAlerts}
              trackColor={{ false: Colors.border, true: Colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.ctaWrapper, { paddingBottom: bottomPad + 16 }]}>
        <Pressable onPress={handleComplete} style={{ width: "100%" }}>
          <Animated.View style={[styles.ctaButton, { transform: [{ scale: ctaScale }] }]}>
            <Text style={styles.ctaText}>Complete Setup</Text>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  progressBar: { flexDirection: "row", paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8, gap: 6 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  filled: { backgroundColor: Colors.accent },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 16 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginLeft: -8, marginBottom: 16 },
  heading: { fontSize: 34, fontWeight: "700", color: Colors.textPrimary, letterSpacing: -0.8, lineHeight: 40, marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.textSecondary, lineHeight: 24, marginBottom: 28 },
  togglesCard: {
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1.5, borderColor: Colors.border, overflow: "hidden",
  },
  toggleRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  toggleText: { flex: 1, gap: 3 },
  toggleLabel: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
  toggleDesc: { fontSize: 12, color: Colors.textTertiary, lineHeight: 17 },
  divider: { height: 1, backgroundColor: Colors.border },
  ctaWrapper: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingTop: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  ctaButton: {
    width: "100%", backgroundColor: Colors.accent, borderRadius: 14,
    alignItems: "center", justifyContent: "center", paddingVertical: 16,
  },
  ctaText: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },
});
