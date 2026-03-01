import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Animated,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const INTERESTS = [
  { id: "food", label: "🍜 Food & Drinks" },
  { id: "events", label: "🎭 Events & Shows" },
  { id: "sports", label: "🏀 Sports" },
  { id: "live_music", label: "🎵 Live Music" },
  { id: "outdoor", label: "🌿 Outdoor & Parks" },
  { id: "hidden_gems", label: "💎 Hidden Gems" },
  { id: "transit", label: "🚇 Transit & Commute" },
  { id: "arts", label: "🎨 Arts & Culture" },
];

export default function OnboardingStep2() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    name: string;
    personas: string;
    university?: string;
    sportsNotifications?: string;
  }>();
  const [interests, setInterests] = useState<string[]>([]);
  const ctaScale = useRef(new Animated.Value(1)).current;

  const toggleInterest = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInterests((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const goNext = (skip?: boolean) => {
    Animated.sequence([
      Animated.timing(ctaScale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(ctaScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/onboarding/step3",
      params: {
        name: params.name ?? "",
        personas: params.personas ?? "",
        university: params.university ?? "",
        sportsNotifications: params.sportsNotifications ?? "false",
        interests: skip ? "" : interests.join(","),
      },
    });
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.progressBar}>
        <View style={[styles.progressSegment, styles.filled]} />
        <View style={[styles.progressSegment, styles.filled]} />
        <View style={styles.progressSegment} />
        <View style={styles.progressSegment} />
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

        <Text style={styles.heading}>What are you into?</Text>
        <Text style={styles.subtitle}>Pick up to 3 — Harold will tailor what he shows you.</Text>

        <View style={styles.pillRow}>
          {INTERESTS.map((item) => {
            const selected = interests.includes(item.id);
            const disabled = !selected && interests.length >= 3;
            return (
              <Pressable
                key={item.id}
                onPress={() => !disabled && toggleInterest(item.id)}
                style={({ pressed }) => [
                  styles.pill,
                  selected && styles.pillSelected,
                  disabled && styles.pillDisabled,
                  pressed && !disabled && { opacity: 0.75 },
                ]}
              >
                <Text style={[styles.pillText, selected && styles.pillTextSelected, disabled && styles.pillTextDisabled]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.ctaWrapper, { paddingBottom: bottomPad + 16 }]}>
        <Pressable onPress={() => goNext()}>
          <Animated.View style={[styles.ctaButton, { transform: [{ scale: ctaScale }] }]}>
            <Text style={styles.ctaText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Animated.View>
        </Pressable>
        <Pressable onPress={() => goNext(true)} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
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
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  pillSelected: { borderColor: Colors.accent, backgroundColor: "#FEF0ED" },
  pillDisabled: { opacity: 0.4 },
  pillText: { fontSize: 14, fontWeight: "500", color: Colors.textSecondary },
  pillTextSelected: { color: Colors.accent, fontWeight: "600" },
  pillTextDisabled: { color: Colors.textTertiary },
  ctaWrapper: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingTop: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1, borderTopColor: Colors.border,
    gap: 12, alignItems: "center",
  },
  ctaButton: {
    width: "100%",
    backgroundColor: Colors.textPrimary,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8, paddingVertical: 16,
  },
  ctaText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  skipBtn: { paddingVertical: 4 },
  skipText: { fontSize: 14, color: Colors.textTertiary },
});
