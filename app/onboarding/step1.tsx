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
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const PERSONAS = [
  { id: "student", label: "🎓 University Student" },
  { id: "visitor", label: "✈️ Visitor" },
  { id: "commuter", label: "🚗 Commuter" },
  { id: "local", label: "🏠 Local" },
];

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.progressBar}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.progressSegment, i < step && styles.progressSegmentFilled]}
        />
      ))}
    </View>
  );
}

export default function OnboardingStep1() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [personas, setPersonas] = useState<string[]>([]);
  const ctaScale = useRef(new Animated.Value(1)).current;

  const togglePersona = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPersonas((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      
      // If "Visitor" is selected, it becomes the ONLY selection
      if (id === "visitor") return ["visitor"];
      
      // If "Visitor" is already selected, replace it with the new selection
      if (prev.includes("visitor")) return [id];
      
      // If "University Student" is selected, allow ONE additional persona (Commuter or Local)
      if (prev.includes("student")) {
        if (prev.length >= 2) return prev; // Max 2 selections for student
        return [...prev, id];
      }
      
      // If selecting "University Student", allow up to 2 total selections
      if (id === "student") return [id];
      
      // For Commuter and Local without Student, allow only 1 selection
      if (prev.length >= 1) return prev;
      
      return [...prev, id];
    });
  };

  const handleContinue = () => {
    Animated.sequence([
      Animated.timing(ctaScale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(ctaScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const params = { name, personas: personas.join(",") };

    if (personas.includes("student")) {
      router.push({ pathname: "/onboarding/step1b", params });
    } else {
      router.push({ pathname: "/onboarding/step2", params });
    }
  };

  const handleSkip = () => {
    router.push({ pathname: "/onboarding/step2", params: { name, personas: personas.join(",") } });
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <ProgressBar step={1} total={4} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 140 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Ionicons name="pulse" size={18} color="#E8533A" />
          </View>
          <Text style={styles.logoText}>Chicago Pulse</Text>
        </View>

        <Text style={styles.heading}>Get Started</Text>
        <Text style={styles.subtitle}>Help us tailor your Chicago experience.</Text>

        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Introduce Yourself.</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Your name (optional)"
              placeholderTextColor={Colors.textTertiary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>I am a...</Text>
            <Text style={styles.helperText}>Students: select 1 more • Visitor: solo only</Text>
          </View>
          <View style={styles.pillRow}>
            {PERSONAS.map((p) => {
              const selected = personas.includes(p.id);
              const disabled = !selected && (
                // If Visitor is selected, everything else is disabled
                personas.includes("visitor") ||
                // If Student is selected and we already have 2 selections, disable additional
                (personas.includes("student") && personas.length >= 2) ||
                // If no Student and we already have 1 selection, disable additional
                (!personas.includes("student") && personas.length >= 1)
              );
              return (
                <Pressable
                  key={p.id}
                  onPress={() => !disabled && togglePersona(p.id)}
                  style={({ pressed }) => [
                    styles.pill,
                    selected && styles.pillSelected,
                    disabled && styles.pillDisabled,
                    pressed && !disabled && { opacity: 0.75 },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      selected && styles.pillTextSelected,
                      disabled && styles.pillTextDisabled,
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.ctaWrapper, { paddingBottom: bottomPad + 16 }]}>
        <Pressable onPress={handleContinue} style={{ width: "100%" }}>
          <Animated.View style={[styles.ctaButton, { transform: [{ scale: ctaScale }] }]}>
            <Text style={styles.ctaText}>Continue</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </Animated.View>
        </Pressable>
        <Pressable onPress={handleSkip} style={styles.skipBtn}>
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
  progressSegmentFilled: { backgroundColor: Colors.accent },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 16 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 28 },
  logoIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#FEF0ED", alignItems: "center", justifyContent: "center" },
  logoText: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary, letterSpacing: -0.3 },
  heading: { fontSize: 34, fontWeight: "700", color: Colors.textPrimary, letterSpacing: -0.8, lineHeight: 40, marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.textSecondary, lineHeight: 24, marginBottom: 36 },
  section: { marginBottom: 32 },
  fieldLabelRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 },
  fieldLabel: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary, marginBottom: 12 },
  helperText: { fontSize: 12, color: Colors.textTertiary },
  inputWrapper: { backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, overflow: "hidden" },
  input: { fontSize: 16, color: Colors.textPrimary, paddingHorizontal: 16, paddingVertical: 14 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  pill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  pillSelected: { borderColor: Colors.accent, backgroundColor: "#FEF0ED" },
  pillDisabled: { opacity: 0.4 },
  pillText: { fontSize: 14, fontWeight: "500", color: Colors.textSecondary },
  pillTextSelected: { color: Colors.accent, fontWeight: "600" },
  pillTextDisabled: { color: Colors.textTertiary },
  ctaWrapper: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingTop: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1, borderTopColor: Colors.border,
    gap: 12, alignItems: "center",
  },
  ctaButton: {
    width: "100%", backgroundColor: Colors.textPrimary, borderRadius: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 15,
  },
  ctaText: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },
  skipBtn: { paddingVertical: 4 },
  skipText: { fontSize: 14, color: Colors.textTertiary },
});
