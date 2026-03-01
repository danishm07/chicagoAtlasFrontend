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

const UNIVERSITIES = [
  { id: "depaul", label: "DePaul University" },
  { id: "iit", label: "Illinois Institute of Technology" },
  { id: "columbia", label: "Columbia College Chicago" },
  { id: "roosevelt", label: "Roosevelt University" },
  { id: "uic", label: "University of Illinois Chicago" },
  { id: "other", label: "Other" },
];

function ProgressBar() {
  return (
    <View style={styles.progressBar}>
      <View style={[styles.progressSegment, styles.progressSegmentFilled]} />
      <View style={[styles.progressSegment, { backgroundColor: Colors.accent, opacity: 0.45 }]} />
      <View style={styles.progressSegment} />
      <View style={styles.progressSegment} />
    </View>
  );
}

export default function OnboardingStep1b() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ name: string; personas: string }>();
  const [university, setUniversity] = useState("");
  const [sportsNotifications, setSportsNotifications] = useState(false);
  const ctaScale = useRef(new Animated.Value(1)).current;

  const handleContinue = () => {
    Animated.sequence([
      Animated.timing(ctaScale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(ctaScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/onboarding/step2",
      params: {
        name: params.name ?? "",
        personas: params.personas ?? "",
        university,
        sportsNotifications: sportsNotifications ? "true" : "false",
      },
    });
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <ProgressBar />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 140 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.textSecondary} />
        </Pressable>

        <Text style={styles.heading}>Which school?</Text>
        <Text style={styles.subtitle}>We'll tailor campus-specific info for you.</Text>

        <View style={styles.cardList}>
          {UNIVERSITIES.map((u) => {
            const selected = university === u.id;
            return (
              <Pressable
                key={u.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setUniversity(u.id);
                }}
                style={({ pressed }) => [
                  styles.card,
                  selected && styles.cardSelected,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={[styles.cardLabel, selected && styles.cardLabelSelected]}>
                  {u.label}
                </Text>
                <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                  {selected && <View style={styles.radioInner} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.toggleCard}>
          <View style={styles.toggleText}>
            <Text style={styles.toggleLabel}>Notify me about sports events</Text>
            <Text style={styles.toggleDesc}>Games and events for my school</Text>
          </View>
          <Switch
            value={sportsNotifications}
            onValueChange={setSportsNotifications}
            trackColor={{ false: Colors.border, true: Colors.accent }}
            thumbColor="#FFFFFF"
          />
        </View>
      </ScrollView>

      <View style={[styles.ctaWrapper, { paddingBottom: bottomPad + 16 }]}>
        <Pressable onPress={handleContinue}>
          <Animated.View style={[styles.ctaButton, { transform: [{ scale: ctaScale }] }]}>
            <Text style={styles.ctaText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Animated.View>
        </Pressable>
        <Pressable onPress={() => router.push({ pathname: "/onboarding/step2", params: { name: params.name ?? "", personas: params.personas ?? "" } })} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  progressBar: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 6,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  progressSegmentFilled: { backgroundColor: Colors.accent },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 16 },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
    marginBottom: 16,
  },
  heading: {
    fontSize: 34,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: -0.8,
    lineHeight: 40,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 28,
  },
  cardList: { gap: 8, marginBottom: 24 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  cardSelected: { borderColor: Colors.accent, backgroundColor: "#FEF0ED" },
  cardLabel: { flex: 1, fontSize: 15, fontWeight: "500", color: Colors.textPrimary },
  cardLabelSelected: { color: Colors.accent, fontWeight: "600" },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: { borderColor: Colors.accent },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
  },
  toggleCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  toggleText: { flex: 1, gap: 2 },
  toggleLabel: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
  toggleDesc: { fontSize: 12, color: Colors.textTertiary },
  ctaWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
    alignItems: "center",
  },
  ctaButton: {
    width: "100%",
    backgroundColor: Colors.textPrimary,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  ctaText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  skipBtn: { paddingVertical: 4 },
  skipText: { fontSize: 14, color: Colors.textTertiary },
});
