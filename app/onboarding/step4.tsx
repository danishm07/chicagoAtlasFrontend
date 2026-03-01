import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
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
  const [emergencyEnabled, setEmergencyEnabled] = useState(false);
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [trainAlerts, setTrainAlerts] = useState(false);
  const ctaScale = useRef(new Animated.Value(1)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;

  const toggleEmergency = (val: boolean) => {
    setEmergencyEnabled(val);
    Animated.timing(expandAnim, {
      toValue: val ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const handleComplete = async () => {
    Animated.sequence([
      Animated.timing(ctaScale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(ctaScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const emergencyContact =
      emergencyEnabled && emergencyName
        ? { name: emergencyName, phone: emergencyPhone }
        : null;

    await saveProfile({
      name: params.name ?? "",
      personas: params.personas ? params.personas.split(",").filter(Boolean) : [],
      university: params.university ?? "",
      sportsNotifications: params.sportsNotifications === "true",
      interests: params.interests ? params.interests.split(",").filter(Boolean) : [],
      homeZone: params.homeZone ?? "loop",
      currentZone: params.homeZone ?? "loop",
      safetyAlerts,
      emergencyContact,
      trainAlerts,
      onboardedAt: new Date().toISOString(),
    });

    router.replace("/(tabs)");
  };

  const expandHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 130],
  });

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
              <Text style={styles.toggleLabel}>Emergency contact</Text>
              <Text style={styles.toggleDesc}>Harold can notify someone if you're near danger</Text>
            </View>
            <Switch
              value={emergencyEnabled}
              onValueChange={toggleEmergency}
              trackColor={{ false: Colors.border, true: Colors.danger }}
              thumbColor="#FFFFFF"
            />
          </View>

          <Animated.View style={[styles.expandSection, { height: expandHeight, overflow: "hidden" }]}>
            <View style={styles.expandInner}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Contact name"
                  placeholderTextColor={Colors.textTertiary}
                  value={emergencyName}
                  onChangeText={setEmergencyName}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Phone number"
                  placeholderTextColor={Colors.textTertiary}
                  value={emergencyPhone}
                  onChangeText={setEmergencyPhone}
                  keyboardType="phone-pad"
                />
              </View>
              <Text style={styles.expandHelp}>
                They'll get a text if you trigger an emergency alert.
              </Text>
            </View>
          </Animated.View>

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
        <Pressable onPress={handleComplete}>
          <Animated.View style={[styles.ctaButton, { transform: [{ scale: ctaScale }] }]}>
            <Text style={styles.ctaText}>Enter Chicago →</Text>
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
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  toggleText: { flex: 1, gap: 3 },
  toggleLabel: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
  toggleDesc: { fontSize: 12, color: Colors.textTertiary, lineHeight: 17 },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 0 },
  expandSection: {},
  expandInner: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 8,
    backgroundColor: "#FAFAF8",
  },
  inputWrapper: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  input: {
    fontSize: 15,
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  expandHelp: { fontSize: 11, color: Colors.textTertiary, lineHeight: 16 },
  ctaWrapper: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingTop: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  ctaButton: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  ctaText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
});
