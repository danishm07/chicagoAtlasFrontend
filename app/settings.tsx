import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Switch,
  Platform,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useProfile } from "@/context/profile";
import { useTheme, useColors } from "@/context/theme";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile, clearProfile } = useProfile();
  const { isDark, isVivid, toggleDark, toggleVivid } = useTheme();
  const C = useColors();
  const [resetModalVisible, setResetModalVisible] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const isStudent = profile?.personas?.includes("student") || profile?.interests?.includes("sports");

  const handleReset = async () => {
    await clearProfile();
    setResetModalVisible(false);
    router.replace("/splash");
  };

  function SectionLabel({ label }: { label: string }) {
    return <Text style={[styles.sectionLabel, { color: C.textTertiary }]}>{label}</Text>;
  }

  function ToggleRow({ label, desc, value, onValueChange, trackOn, last }: {
    label: string; desc?: string; value: boolean; onValueChange: (v: boolean) => void; trackOn?: string; last?: boolean;
  }) {
    return (
      <View style={[styles.row, !last && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
        <View style={styles.rowText}>
          <Text style={[styles.rowLabel, { color: C.textPrimary }]}>{label}</Text>
          {!!desc && <Text style={[styles.rowDesc, { color: C.textTertiary }]}>{desc}</Text>}
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: C.border, true: trackOn ?? "#E8533A" }}
          thumbColor="#FFFFFF"
        />
      </View>
    );
  }

  function NavRow({ label, desc, value, onPress, danger, last }: {
    label: string; desc?: string; value?: string; onPress: () => void; danger?: boolean; last?: boolean;
  }) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.row, !last && { borderBottomWidth: 1, borderBottomColor: C.border }, { opacity: pressed ? 0.7 : 1 }]}
      >
        <View style={styles.rowText}>
          <Text style={[styles.rowLabel, { color: danger ? "#C8303A" : C.textPrimary }]}>{label}</Text>
          {!!desc && <Text style={[styles.rowDesc, { color: C.textTertiary }]}>{desc}</Text>}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          {!!value && <Text style={[styles.rowValue, { color: C.textSecondary }]}>{value}</Text>}
          <Ionicons name="chevron-forward" size={16} color={C.textTertiary} />
        </View>
      </Pressable>
    );
  }

  function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
    return (
      <View style={[styles.row, !last && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
        <Text style={[styles.rowLabel, { color: C.textPrimary }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: C.textSecondary }]}>{value}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: C.background, paddingTop: topPad }]}>
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}>
          <Ionicons name="arrow-back" size={22} color={C.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel label="APPEARANCE" />
        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <ToggleRow
            label="Dark Mode"
            desc="Easier on the eyes in low light"
            value={isDark}
            onValueChange={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleDark(); }}
          />
          <ToggleRow
            label="Vivid Mode"
            desc="High contrast — easier to read for all users"
            value={isVivid}
            onValueChange={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleVivid(); }}
            last
          />
        </View>

        <SectionLabel label="NOTIFICATIONS" />
        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <ToggleRow
            label="Safety Alerts"
            desc="Serious incidents near you"
            value={!!profile?.safetyAlerts}
            onValueChange={(v) => updateProfile({ safetyAlerts: v })}
          />
          {isStudent && (
            <ToggleRow
              label="Sports Events"
              desc="Your school's game notifications"
              value={!!profile?.sportsNotifications}
              onValueChange={(v) => updateProfile({ sportsNotifications: v })}
            />
          )}
          <ToggleRow
            label="Train Alerts"
            desc="CTA nudges when your train arrives"
            value={!!profile?.trainAlerts}
            onValueChange={(v) => updateProfile({ trainAlerts: v })}
            last
          />
        </View>

        <SectionLabel label="PROFILE" />
        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <NavRow
            label="Re-onboard"
            desc="Reset your profile and preferences"
            onPress={() => setResetModalVisible(true)}
            danger
            last
          />
        </View>

        <SectionLabel label="ABOUT" />
        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <InfoRow label="App version" value="1.0.0" />
          <InfoRow label="Powered by" value="Live Chicago data" />
          <InfoRow label="Built at" value="DemonHacks 2026" last />
        </View>
      </ScrollView>

      <Modal
        visible={resetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: C.surface }]}>
            <Text style={[styles.modalTitle, { color: C.textPrimary }]}>Start over?</Text>
            <Text style={[styles.modalDesc, { color: C.textSecondary }]}>
              This will reset your profile and preferences.
            </Text>
            <View style={styles.modalBtns}>
              <Pressable
                onPress={() => setResetModalVisible(false)}
                style={({ pressed }) => [styles.modalBtn, { backgroundColor: C.border, opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={[styles.modalBtnText, { color: C.textPrimary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleReset}
                style={({ pressed }) => [styles.modalBtn, { backgroundColor: "#C8303A", opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={[styles.modalBtnText, { color: "#FFFFFF" }]}>Reset</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginTop: 20, marginBottom: 8, paddingHorizontal: 4 },
  card: { borderRadius: 16, borderWidth: 1.5, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  rowText: { flex: 1, gap: 2, paddingRight: 12 },
  rowLabel: { fontSize: 15, fontWeight: "500" },
  rowDesc: { fontSize: 12, lineHeight: 17 },
  rowValue: { fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 32 },
  modalBox: { borderRadius: 20, padding: 24, width: "100%", gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalDesc: { fontSize: 14, lineHeight: 20 },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 8 },
  modalBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  modalBtnText: { fontSize: 15, fontWeight: "600" },
});
