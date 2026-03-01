import React, { useState, useRef, useEffect } from "react";
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

const ZONES = [
  { id: "north_side", label: "📍 North Side", sub: "Lincoln Park, Wrigleyville" },
  { id: "near_campus", label: "🎓 Near Campus", sub: "Lincoln Park / Loop area" },
  { id: "loop", label: "🏢 The Loop / Downtown", sub: "Millennium Park, State St" },
  { id: "south_side", label: "🌆 South Side", sub: "Hyde Park, Bronzeville" },
  { id: "west_side", label: "🌉 West Side", sub: "West Loop, Fulton Market" },
  { id: "gps", label: "📡 Use my GPS", sub: "Auto-detect my location", pulsing: true },
];

function PulsingDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.6, duration: 800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.8, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.pulseContainer}>
      <Animated.View style={[styles.pulseRing, { transform: [{ scale }], opacity }]} />
      <View style={styles.pulseDot} />
    </View>
  );
}

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
        <Text style={styles.subtitle}>Harold will surface what's closest to you.</Text>

        <View style={styles.cardList}>
          {ZONES.map((z) => {
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
                <View style={styles.cardLeft}>
                  {z.pulsing ? (
                    <PulsingDot />
                  ) : null}
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardLabel, selected && styles.cardLabelSelected]}>
                    {z.label}
                  </Text>
                  <Text style={styles.cardSub}>{z.sub}</Text>
                </View>
                <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                  {selected && <View style={styles.radioInner} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.ctaWrapper, { paddingBottom: bottomPad + 16 }]}>
        <Pressable onPress={handleContinue} disabled={!homeZone}>
          <Animated.View
            style={[
              styles.ctaButton,
              !homeZone && styles.ctaButtonDisabled,
              { transform: [{ scale: ctaScale }] },
            ]}
          >
            <Text style={styles.ctaText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
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
  cardList: { gap: 8 },
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
  cardLeft: { width: 32, alignItems: "center" },
  cardText: { flex: 1 },
  cardLabel: { fontSize: 15, fontWeight: "500", color: Colors.textPrimary },
  cardLabelSelected: { color: Colors.accent, fontWeight: "600" },
  cardSub: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
  },
  radioOuterSelected: { borderColor: Colors.accent },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent },
  pulseContainer: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  pulseRing: {
    position: "absolute", width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.accent,
  },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent },
  ctaWrapper: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingTop: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  ctaButton: {
    backgroundColor: Colors.textPrimary,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8, paddingVertical: 16,
  },
  ctaButtonDisabled: { backgroundColor: Colors.border },
  ctaText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
});
