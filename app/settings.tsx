import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Switch,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useProfile } from "@/context/profile";
import { useTheme } from "@/context/theme";

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function RowItem({
  label,
  value,
  onPress,
  rightElement,
  danger,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        pressed && onPress ? { opacity: 0.7 } : null,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {rightElement ? rightElement : null}
      {onPress && !rightElement ? (
        <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
      ) : null}
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile, clearProfile } = useProfile();
  const { isDark, toggle: toggleTheme } = useTheme();

  const [resetModal, setResetModal] = useState(false);
  const [editContactModal, setEditContactModal] = useState(false);
  const [contactName, setContactName] = useState(profile?.emergencyContact?.name ?? "");
  const [contactPhone, setContactPhone] = useState(profile?.emergencyContact?.phone ?? "");

  const safetyAlerts = profile?.safetyAlerts ?? profile?.notifySafety ?? false;
  const trainAlerts = profile?.trainAlerts ?? false;
  const sportsEvents =
    profile?.sportsNotifications ??
    (profile?.personas?.includes("student") || profile?.interests?.includes("sports") ? false : undefined);
  const showSports = sportsEvents !== undefined || profile?.personas?.includes("student") || profile?.interests?.includes("sports");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleReset = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await clearProfile();
    setResetModal(false);
    router.replace("/splash");
  };

  const saveContact = async () => {
    await updateProfile({
      emergencyContact:
        contactName ? { name: contactName, phone: contactPhone } : null,
    });
    setEditContactModal(false);
  };

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="APPEARANCE" />
        <View style={styles.card}>
          <RowItem
            label="Dark Mode"
            rightElement={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: Colors.border, true: Colors.accent }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </View>

        <SectionHeader title="NOTIFICATIONS" />
        <View style={styles.card}>
          <RowItem
            label="Safety Alerts"
            rightElement={
              <Switch
                value={safetyAlerts}
                onValueChange={(v) => updateProfile({ safetyAlerts: v, notifySafety: v })}
                trackColor={{ false: Colors.border, true: Colors.accent }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <Divider />
          {showSports && (
            <>
              <RowItem
                label="Sports Events"
                rightElement={
                  <Switch
                    value={profile?.sportsNotifications ?? false}
                    onValueChange={(v) => updateProfile({ sportsNotifications: v })}
                    trackColor={{ false: Colors.border, true: Colors.accent }}
                    thumbColor="#FFFFFF"
                  />
                }
              />
              <Divider />
            </>
          )}
          <RowItem
            label="Train Alerts"
            rightElement={
              <Switch
                value={trainAlerts}
                onValueChange={(v) => updateProfile({ trainAlerts: v })}
                trackColor={{ false: Colors.border, true: Colors.accent }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </View>

        <SectionHeader title="EMERGENCY" />
        <View style={styles.card}>
          <RowItem
            label="Emergency Contact"
            value={profile?.emergencyContact?.name ?? "Not set"}
            onPress={() => {
              setContactName(profile?.emergencyContact?.name ?? "");
              setContactPhone(profile?.emergencyContact?.phone ?? "");
              setEditContactModal(true);
            }}
          />
        </View>

        <SectionHeader title="PROFILE" />
        <View style={styles.card}>
          <RowItem
            label="Re-onboard / Change preferences"
            onPress={() => setResetModal(true)}
          />
        </View>

        <SectionHeader title="ABOUT" />
        <View style={styles.card}>
          <RowItem label="App version" value="1.0.0" />
          <Divider />
          <RowItem label="Harold is powered by live Chicago data" />
          <Divider />
          <RowItem label="Built at DemonHacks 2026" />
        </View>
      </ScrollView>

      <Modal transparent visible={resetModal} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Start over?</Text>
            <Text style={styles.modalSub}>This will reset your profile and return you to the beginning.</Text>
            <View style={styles.modalBtns}>
              <Pressable style={styles.modalCancel} onPress={() => setResetModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalDanger} onPress={handleReset}>
                <Text style={styles.modalDangerText}>Reset</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={editContactModal} animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={() => setEditContactModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Emergency Contact</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Contact name"
                placeholderTextColor={Colors.textTertiary}
                value={contactName}
                onChangeText={setContactName}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                placeholderTextColor={Colors.textTertiary}
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.modalBtns}>
              <Pressable style={styles.modalCancel} onPress={() => setEditContactModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalCancel, { backgroundColor: Colors.accent, borderColor: Colors.accent }]} onPress={saveContact}>
                <Text style={[styles.modalCancelText, { color: "#FFFFFF" }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.textPrimary },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 24, gap: 0 },

  sectionHeader: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 20,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  rowLabel: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  rowLabelDanger: { color: Colors.danger },
  rowValue: { fontSize: 15, color: Colors.textTertiary },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 16 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    gap: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: Colors.textPrimary },
  modalSub: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalCancel: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCancelText: { fontSize: 15, color: Colors.textSecondary },
  modalDanger: {
    flex: 1,
    backgroundColor: Colors.danger,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalDangerText: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },

  inputWrapper: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  input: {
    fontSize: 15,
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
