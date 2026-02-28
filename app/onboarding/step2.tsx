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
import { Feather, MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useProfile } from "@/context/profile";

const UNIVERSITIES = [
  { id: "depaul", label: "DePaul University", accent: Colors.depaul },
  { id: "iit", label: "Illinois Institute of Technology", accent: null },
  { id: "columbia", label: "Columbia College Chicago", accent: null },
  { id: "roosevelt", label: "Roosevelt University", accent: null },
  { id: "none", label: "Not a student", accent: null },
];

const ZONES = [
  {
    id: "north",
    label: "North Loop",
    sub: "Millennium Park, Michigan Ave",
    icon: "place" as const,
  },
  {
    id: "depaul_loop",
    label: "DePaul Loop",
    sub: "Jackson, State, Congress",
    icon: "school" as const,
  },
  {
    id: "west",
    label: "West Loop",
    sub: "Wacker, Willis Tower",
    icon: "business" as const,
  },
  {
    id: "south",
    label: "South Loop",
    sub: "Roosevelt, Museum Campus",
    icon: "location-city" as const,
  },
  {
    id: "gps",
    label: "Use my GPS",
    sub: "Auto-detect my location",
    icon: "gps-fixed" as const,
    pulsing: true,
  },
];

function PulsingDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.5, duration: 800, useNativeDriver: true }),
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

function SelectCard({
  label,
  sub,
  selected,
  onPress,
  leftAccent,
  icon,
  pulsing,
  isDepaul,
}: {
  label: string;
  sub?: string;
  selected: boolean;
  onPress: () => void;
  leftAccent?: string | null;
  icon?: string;
  pulsing?: boolean;
  isDepaul?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 70, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={[
          styles.card,
          selected && styles.cardSelected,
          leftAccent ? { borderLeftColor: leftAccent, borderLeftWidth: 3 } : null,
          { transform: [{ scale }] },
        ]}
      >
        {pulsing ? (
          <PulsingDot />
        ) : icon ? (
          <View style={[styles.cardIcon, selected && styles.cardIconSelected]}>
            <MaterialIcons
              name={icon as any}
              size={18}
              color={selected ? Colors.accent : Colors.textSecondary}
            />
          </View>
        ) : null}

        <View style={styles.cardTextBlock}>
          <View style={styles.cardLabelRow}>
            <Text style={[styles.cardLabel, selected && styles.cardLabelSelected]}>
              {label}
            </Text>
            {isDepaul && (
              <View style={styles.depaulBadge}>
                <Feather name="star" size={10} color={Colors.depaul} />
              </View>
            )}
          </View>
          {sub ? <Text style={styles.cardSub}>{sub}</Text> : null}
        </View>

        <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
          {selected && <View style={styles.radioInner} />}
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function OnboardingStep2() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    name: string;
    personas: string;
    interests: string;
  }>();
  const { saveProfile } = useProfile();

  const [university, setUniversity] = useState("");
  const [homeZone, setHomeZone] = useState("");
  const ctaScale = useRef(new Animated.Value(1)).current;

  const isReady = university !== "" && homeZone !== "";

  const handleComplete = async () => {
    if (!isReady) return;
    Animated.sequence([
      Animated.timing(ctaScale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(ctaScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await saveProfile({
      name: params.name ?? "",
      personas: params.personas ? params.personas.split(",").filter(Boolean) : [],
      interests: params.interests ? params.interests.split(",").filter(Boolean) : [],
      university,
      homeZone,
      currentZone: homeZone,
      onboardedAt: new Date().toISOString(),
    });

    router.replace("/home");
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={Colors.textSecondary} />
        </Pressable>

        {/* Progress */}
        <View style={styles.progressRow}>
          <View style={styles.progressDot} />
          <View style={[styles.progressDot, styles.progressDotActive]} />
        </View>

        <Text style={styles.heading}>One more thing.</Text>
        <Text style={styles.subtitle}>
          Helps us personalize your Loop experience.
        </Text>

        {/* University */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Are you a student?</Text>
          <View style={styles.cardList}>
            {UNIVERSITIES.map((u) => (
              <SelectCard
                key={u.id}
                label={u.label}
                selected={university === u.id}
                onPress={() => setUniversity(u.id)}
                leftAccent={u.id === "depaul" ? Colors.depaul : null}
                isDepaul={u.id === "depaul"}
              />
            ))}
          </View>
        </View>

        {/* Home Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your home base in the Loop</Text>
          <View style={styles.cardList}>
            {ZONES.map((z) => (
              <SelectCard
                key={z.id}
                label={z.label}
                sub={z.sub}
                selected={homeZone === z.id}
                onPress={() => setHomeZone(z.id)}
                icon={z.icon}
                pulsing={z.pulsing}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.ctaWrapper, { paddingBottom: bottomPad + 16 }]}>
        <Pressable onPress={handleComplete} disabled={!isReady}>
          <Animated.View
            style={[
              styles.ctaButton,
              isReady ? styles.ctaButtonReady : styles.ctaButtonDisabled,
              { transform: [{ scale: ctaScale }] },
            ]}
          >
            <Text style={[styles.ctaText, isReady && styles.ctaTextReady]}>
              Enter the Loop
            </Text>
            <Feather
              name="arrow-right"
              size={18}
              color={isReady ? "#FFFFFF" : Colors.textTertiary}
            />
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
    marginBottom: 8,
  },
  progressRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 28,
  },
  progressDot: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  progressDotActive: {
    backgroundColor: Colors.accent,
    width: 40,
  },
  heading: {
    fontFamily: "DMSans_700Bold",
    fontSize: 34,
    color: Colors.textPrimary,
    letterSpacing: -0.8,
    lineHeight: 40,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 40,
  },
  section: {
    marginBottom: 36,
  },
  sectionTitle: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  cardList: {
    gap: 8,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  cardSelected: {
    borderColor: Colors.accent,
    backgroundColor: "#FEF0ED",
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  cardIconSelected: {
    backgroundColor: "#FDDDD7",
  },
  cardTextBlock: {
    flex: 1,
  },
  cardLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  cardLabelSelected: {
    color: Colors.accent,
    fontFamily: "DMSans_600SemiBold",
  },
  cardSub: {
    fontFamily: "DMMono_400Regular",
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  depaulBadge: {
    width: 18,
    height: 18,
    borderRadius: 5,
    backgroundColor: "#E8F0FB",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: Colors.accent,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
  },
  pulseContainer: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.accent,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
  },
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
  },
  ctaButton: {
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  ctaButtonDisabled: {
    backgroundColor: Colors.border,
  },
  ctaButtonReady: {
    backgroundColor: Colors.accent,
  },
  ctaText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 16,
    color: Colors.textTertiary,
  },
  ctaTextReady: {
    color: "#FFFFFF",
  },
});
