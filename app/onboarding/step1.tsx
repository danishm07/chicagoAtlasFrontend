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
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const PERSONAS = ["University Student", "Commuter", "Local Resident", "Visitor"];

interface StepData {
  name: string;
  personas: string[];
  emergencyName: string;
  emergencyPhone: string;
}

function PillButton({
  label,
  selected,
  onPress,
  disabled,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.94, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable onPress={handlePress} disabled={disabled && !selected}>
      <Animated.View
        style={[
          styles.pill,
          selected && styles.pillSelected,
          disabled && !selected && styles.pillDisabled,
          { transform: [{ scale }] },
        ]}
      >
        <Text
          style={[
            styles.pillText,
            selected && styles.pillTextSelected,
            disabled && !selected && styles.pillTextDisabled,
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function OnboardingStep1() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<StepData>({
    name: "",
    personas: [],
    emergencyName: "",
    emergencyPhone: "",
  });
  const ctaScale = useRef(new Animated.Value(1)).current;

  const isReady = data.name.trim().length > 0 || data.personas.length > 0;

  const togglePersona = (p: string) => {
    setData((prev) => {
      const current = prev.personas;

      // Deselect if already selected
      if (current.includes(p)) {
        return { ...prev, personas: current.filter((x) => x !== p) };
      }

      // Visitor is always solo
      if (p === "Visitor") {
        return { ...prev, personas: ["Visitor"] };
      }

      // Selecting anything while Visitor is active replaces it
      if (current.includes("Visitor")) {
        return { ...prev, personas: [p] };
      }

      // Commuter and Local Resident are mutually exclusive
      if (p === "Commuter") {
        const filtered = current.filter((x) => x !== "Local Resident");
        if (filtered.length >= 2) return prev;
        return { ...prev, personas: [...filtered, p] };
      }
      if (p === "Local Resident") {
        const filtered = current.filter((x) => x !== "Commuter");
        if (filtered.length >= 2) return prev;
        return { ...prev, personas: [...filtered, p] };
      }

      // Max 2
      if (current.length >= 2) return prev;
      return { ...prev, personas: [...current, p] };
    });
  };

  const handleContinue = () => {
    if (!isReady) return;
    Animated.sequence([
      Animated.timing(ctaScale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(ctaScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/onboarding/step2",
      params: {
        name: data.name,
        personas: data.personas.join(","),
        emergencyName: data.emergencyName,
        emergencyPhone: data.emergencyPhone,
      },
    });
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 120 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo area */}
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Feather name="zap" size={22} color={Colors.accent} />
          </View>
          <Text style={styles.logoText}>Loop Pulse</Text>
        </View>

        <Text style={styles.heading}>Welcome to Loop.</Text>
        <Text style={styles.subtitle}>
          Feel the pulse of your city. Let's get you set up.
        </Text>

        {/* Name field */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>What should we call you?</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="First name"
              placeholderTextColor={Colors.textTertiary}
              value={data.name}
              onChangeText={(t) => setData((prev) => ({ ...prev, name: t }))}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Persona pills */}
        <View style={styles.section}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>I am a...</Text>
            <Text style={styles.helperText}>Select up to 2</Text>
          </View>
          <View style={styles.pillRow}>
            {PERSONAS.map((p) => {
              const isSelected = data.personas.includes(p);
              const isDisabled =
                !isSelected &&
                (data.personas.length >= 2 ||
                  (p !== "Visitor" && data.personas.includes("Visitor")));
              return (
                <PillButton
                  key={p}
                  label={p}
                  selected={isSelected}
                  onPress={() => togglePersona(p)}
                  disabled={isDisabled}
                />
              );
            })}
          </View>
        </View>

        {/* Emergency Contact */}
        <View style={styles.section}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>Emergency Contact</Text>
            <Text style={styles.helperText}>Optional</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Stored only on your device.</Text>
          <View style={[styles.inputWrapper, { marginBottom: 10 }]}>
            <TextInput
              style={styles.input}
              placeholder="Contact name (e.g. Mom, Dad)"
              placeholderTextColor={Colors.textTertiary}
              value={data.emergencyName}
              onChangeText={(t) => setData((prev) => ({ ...prev, emergencyName: t }))}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              placeholderTextColor={Colors.textTertiary}
              value={data.emergencyPhone}
              onChangeText={(t) => setData((prev) => ({ ...prev, emergencyPhone: t }))}
              keyboardType="phone-pad"
              returnKeyType="done"
            />
          </View>
          <Text style={styles.emergencyHelper}>
            Only used if you choose to share your location in an emergency. Never sent anywhere.
          </Text>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.ctaWrapper, { paddingBottom: bottomPad + 16 }]}>
        <Pressable onPress={handleContinue} disabled={!isReady}>
          <Animated.View
            style={[
              styles.ctaButton,
              isReady ? styles.ctaButtonReady : styles.ctaButtonDisabled,
              { transform: [{ scale: ctaScale }] },
            ]}
          >
            <Text style={[styles.ctaText, isReady && styles.ctaTextReady]}>
              Continue
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
    paddingTop: 20,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 32,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FEF0ED",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
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
    marginBottom: 32,
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  fieldLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontFamily: "DMMono_400Regular",
    fontSize: 11,
    color: Colors.textTertiary,
    marginBottom: 12,
    marginTop: -8,
    letterSpacing: 0.2,
  },
  helperText: {
    fontFamily: "DMMono_400Regular",
    fontSize: 11,
    color: Colors.textTertiary,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  input: {
    fontFamily: "DMSans_400Regular",
    fontSize: 16,
    color: Colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  emergencyHelper: {
    fontFamily: "DMMono_400Regular",
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 10,
    lineHeight: 15,
    letterSpacing: 0.2,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  pillSelected: {
    borderColor: Colors.accent,
    backgroundColor: "#FEF0ED",
  },
  pillDisabled: {
    opacity: 0.45,
  },
  pillText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  pillTextSelected: {
    color: Colors.accent,
  },
  pillTextDisabled: {
    color: Colors.textTertiary,
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
