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
import Colors, { CHICAGO_SIDES } from "@/constants/colors";

export default function OnboardingStep3() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    name: string;
    personas: string;
    university?: string;
    sportsNotifications?: string;
    interests?: string;
  }>();
  const [homeZone, setHomeZone] = useState("");
  const ctaScale = useRef(new Animated.Value(1)).current;

  const handleContinue = () => {
    if (!homeZone) return;
    Animated.sequence([
      Animated.timing(ctaScale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(ctaScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/onboarding/step4",
      params: { ...params, homeZone },
    });
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.progressBar}>
        <View style={[styles.progressSegment, styles.filled]} />
        <View style={[styles.progressSegment, styles.filled]} />
        <View style={[styles.progressSegment, styles.filled]} />
        <View style={styles.progressSegment} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 140 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.textSecondary} />
        </Pressable>

        <Text style={styles.heading}>Where are{"\n"}you based?</Text>

        <View style={styles.cardList}>
          {CHICAGO_SIDES.map((z) => {
            const selected = homeZone === z.id;
            return (
              <Pressable
                key={z.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setHomeZone(z.id);
                }}
                style={({ pressed }) => [
                  styles.card,
                  selected && styles.cardSelected,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <View style={[styles.colorDot, { backgroundColor: z.color }]} />
                <Text style={[styles.cardLabel, selected && styles.cardLabelSelected]}>
                  {z.label}
                </Text>
                <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                  {selected && <View style={styles.radioInner} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.ctaWrapper, { paddingBottom: bottomPad + 16 }]}>
        <Pressable onPress={handleContinue} disabled={!homeZone} style={{ width: "100%" }}>
          <Animated.View
            style={[
              styles.ctaButton,
              !homeZone && styles.ctaButtonDisabled,
              { transform: [{ scale: ctaScale }] },
            ]}
          >
            <Text style={styles.ctaText}>Continue</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
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
  heading: { fontSize: 34, fontWeight: "700", color: Colors.textPrimary, letterSpacing: -0.8, lineHeight: 40, marginBottom: 28 },
  cardList: { gap: 8 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 12,
  },
  cardSelected: { borderColor: Colors.accent, backgroundColor: "#FEF0ED" },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  cardLabel: { flex: 1, fontSize: 15, fontWeight: "500", color: Colors.textPrimary },
  cardLabelSelected: { color: Colors.accent, fontWeight: "600" },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  radioOuterSelected: { borderColor: Colors.accent },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent },
  ctaWrapper: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingTop: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  ctaButton: {
    width: "100%", backgroundColor: Colors.textPrimary, borderRadius: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 15,
  },
  ctaButtonDisabled: { backgroundColor: Colors.border },
  ctaText: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },
});
