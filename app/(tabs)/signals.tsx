import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Animated,
  TextInput,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useProfile } from "@/context/profile";
import { router } from "expo-router";
import { MOCK_SCORE, MOCK_REPORTS } from "@/constants/config";

const WIDGETS = [
  {
    id: "safety",
    name: "SAFETY",
    icon: "🛡️",
    getValue: () => `${MOCK_SCORE.safety.incidents} incidents`,
    sub: "Last 6 hours · 800m radius",
  },
  {
    id: "transit",
    name: "TRANSIT",
    icon: "🚇",
    getValue: () => MOCK_SCORE.transit.status.includes("normally") ? "All clear" : "Delays",
    sub: "CTA status right now",
  },
  {
    id: "air",
    name: "AIR QUALITY",
    icon: "🌿",
    getValue: () => `AQI ${MOCK_SCORE.air.aqi}`,
    sub: `${MOCK_SCORE.air.category} · Safe for outdoor activity`,
  },
  {
    id: "weather",
    name: "WEATHER",
    icon: "🌤️",
    getValue: () => MOCK_SCORE.weather.temp,
    sub: `Feels like ${MOCK_SCORE.weather.feelsLike} · ${MOCK_SCORE.weather.condition}`,
  },
  {
    id: "crowds",
    name: "CROWDS",
    icon: "👥",
    getValue: () => "Moderate",
    sub: "Based on events + time",
  },
  {
    id: "events",
    name: "EVENTS",
    icon: "🎟️",
    getValue: () => `${MOCK_SCORE.events} today`,
    sub: "Near your zone",
  },
  {
    id: "reports",
    name: "REPORTS",
    icon: "⚠️",
    getValue: () => `${MOCK_REPORTS.length} nearby`,
    sub: "User-submitted reports",
  },
];

const REPORT_TYPES = [
  "Safety concern",
  "Suspicious activity",
  "Accident",
  "Traffic issue",
  "Other",
];

function PulsingDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.8, duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 900, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.7, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={mapStyles.pulseWrap}>
      <Animated.View style={[mapStyles.pulseRing, { transform: [{ scale }], opacity }]} />
      <View style={mapStyles.pulseDot} />
    </View>
  );
}

function Toast({ message, visible }: { message: string; visible: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2200),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);
  return (
    <Animated.View style={[toastStyles.toast, { opacity }]} pointerEvents="none">
      <Text style={toastStyles.toastText}>{message}</Text>
    </Animated.View>
  );
}

export default function SignalsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 72;

  const [selected, setSelected] = useState<string[]>(["safety", "transit"]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState("");
  const [reportNote, setReportNote] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [emergencyModal, setEmergencyModal] = useState(false);

  const drawerAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2800);
  };

  const toggleWidget = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) {
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 3, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.spring(drawerAnim, { toValue: 1, useNativeDriver: false, tension: 65, friction: 10 }).start();
  };

  const closeDrawer = () => {
    Animated.timing(drawerAnim, { toValue: 0, duration: 250, useNativeDriver: false }).start(() => {
      setDrawerOpen(false);
      setReportOpen(false);
    });
  };

  const submitReport = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setReportType("");
    setReportNote("");
    setReportOpen(false);
    showToast("Thanks — Harold sees it.");
  };

  const sendEmergencyAlert = () => {
    setEmergencyModal(false);
    const contactName = profile?.emergencyContact?.name ?? "your contact";
    showToast(`Alert sent to ${contactName}`);
  };

  const drawerHeight = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 300],
  });

  const backdropOpacity = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  const hasEmergencyContact = !!profile?.emergencyContact?.name;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Signals</Text>
        <Pressable style={styles.settingsBtn} onPress={() => router.push("/settings")}>
          <Ionicons name="settings-outline" size={22} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <Animated.View style={[styles.widgetRow]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.widgetScroll}
          style={{ transform: [{ translateX: shakeAnim }] }}
        >
          {WIDGETS.map((w) => {
            const sel = selected.includes(w.id);
            return (
              <Pressable key={w.id} onPress={() => toggleWidget(w.id)}>
                <View style={[styles.widgetCard, sel && styles.widgetCardSelected]}>
                  <View style={styles.widgetTop}>
                    <Text style={styles.widgetName}>{w.name}</Text>
                    <View style={[styles.checkbox, sel && styles.checkboxSelected]}>
                      {sel && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                    </View>
                  </View>
                  <Text style={styles.widgetValue}>{w.getValue()}</Text>
                  <Text style={styles.widgetSub}>{w.sub}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      <View style={styles.mapArea}>
        {/* TODO: Replace with Azure Maps when USE_REAL_MAP=true */}
        <PulsingDot />
        <Text style={styles.mapText}>Map coming soon</Text>
        <Text style={styles.mapSub}>Live widget data shown in cards above</Text>
      </View>

      <Pressable style={styles.drawerHandle} onPress={drawerOpen ? closeDrawer : openDrawer}>
        <Ionicons
          name={drawerOpen ? "chevron-down" : "chevron-up"}
          size={20}
          color={Colors.textSecondary}
        />
        <Text style={styles.drawerHandleText}>Live Alerts</Text>
      </Pressable>

      {drawerOpen && (
        <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "#000", opacity: backdropOpacity }]} />
        </Pressable>
      )}

      <Animated.View style={[styles.drawer, { height: drawerHeight, overflow: "hidden" }]}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Live Alerts</Text>
            <Text style={styles.drawerTime}>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
          </View>

          {MOCK_REPORTS.map((r) => (
            <View key={r.id} style={styles.alertRow}>
              <View style={[styles.alertDot, r.severity === "high" ? styles.dotRed : r.severity === "medium" ? styles.dotYellow : styles.dotGreen]} />
              <Text style={styles.alertDesc}>{r.description}</Text>
              <Text style={styles.alertTime}>{r.time}</Text>
            </View>
          ))}

          <View style={styles.drawerDivider} />

          {!reportOpen ? (
            <Pressable
              style={styles.reportBtn}
              onPress={() => setReportOpen(true)}
            >
              <Text style={styles.reportBtnText}>Report an Incident</Text>
            </Pressable>
          ) : (
            <View style={styles.reportForm}>
              <Text style={styles.reportFormTitle}>Report to Chicago Pulse</Text>
              <View style={styles.typeOptions}>
                {REPORT_TYPES.map((t) => (
                  <Pressable
                    key={t}
                    style={[styles.typeOption, reportType === t && styles.typeOptionSelected]}
                    onPress={() => setReportType(t)}
                  >
                    <Text style={[styles.typeOptionText, reportType === t && styles.typeOptionTextSelected]}>{t}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={styles.reportInput}
                placeholder="Add a note (optional)"
                placeholderTextColor={Colors.textTertiary}
                value={reportNote}
                onChangeText={setReportNote}
                multiline
              />
              <Pressable style={styles.submitBtn} onPress={submitReport}>
                <Text style={styles.submitBtnText}>Submit</Text>
              </Pressable>
              <Text style={styles.reportAnon}>Reports are anonymous and shared with the community</Text>
            </View>
          )}

          {hasEmergencyContact && (
            <Pressable style={styles.emergencyBtn} onPress={() => setEmergencyModal(true)}>
              <Text style={styles.emergencyBtnText}>🚨 Alert my emergency contact</Text>
            </Pressable>
          )}
        </ScrollView>
      </Animated.View>

      <View style={{ height: bottomPad }} />

      <Modal transparent visible={emergencyModal} animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setEmergencyModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Send an alert to {profile?.emergencyContact?.name ?? "your contact"}?</Text>
            <Text style={styles.modalSub}>They'll receive a text with your location.</Text>
            <View style={styles.modalBtns}>
              <Pressable style={styles.modalCancel} onPress={() => setEmergencyModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSend} onPress={sendEmergencyAlert}>
                <Text style={styles.modalSendText}>Send Alert</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      <Toast message={toastMsg} visible={toastVisible} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: Colors.textPrimary, letterSpacing: -0.5 },
  settingsBtn: { padding: 6 },

  widgetRow: { paddingVertical: 12 },
  widgetScroll: { paddingHorizontal: 16, gap: 10 },
  widgetCard: {
    width: 150,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 4,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 1px 3px rgba(28,27,24,0.06)" }
      : { shadowColor: "#1C1B18", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 }),
  },
  widgetCardSelected: { borderColor: Colors.accent, backgroundColor: "#FEF0ED" },
  widgetTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  widgetName: { fontSize: 10, fontWeight: "600", color: Colors.textTertiary, letterSpacing: 0.5 },
  checkbox: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
  },
  checkboxSelected: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  widgetValue: { fontSize: 22, fontWeight: "700", color: Colors.textPrimary, letterSpacing: -0.5 },
  widgetSub: { fontSize: 11, color: Colors.textSecondary, lineHeight: 15 },

  mapArea: {
    flex: 1,
    backgroundColor: "#E8E5DF",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  mapText: { fontSize: 16, fontWeight: "600", color: Colors.textSecondary },
  mapSub: { fontSize: 12, color: Colors.textTertiary },

  drawerHandle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  drawerHandleText: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },

  drawer: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  drawerTitle: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary },
  drawerTime: { fontSize: 11, color: Colors.textTertiary },

  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 10,
  },
  alertDot: { width: 10, height: 10, borderRadius: 5 },
  dotRed: { backgroundColor: Colors.danger },
  dotYellow: { backgroundColor: "#B8860B" },
  dotGreen: { backgroundColor: Colors.success },
  alertDesc: { flex: 1, fontSize: 13, color: Colors.textPrimary },
  alertTime: { fontSize: 11, color: Colors.textTertiary },

  drawerDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },

  reportBtn: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  reportBtnText: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },

  reportForm: { gap: 10, marginBottom: 10 },
  reportFormTitle: { fontSize: 14, fontWeight: "700", color: Colors.textPrimary },
  typeOptions: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  typeOption: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  typeOptionSelected: { borderColor: Colors.accent, backgroundColor: "#FEF0ED" },
  typeOptionText: { fontSize: 12, color: Colors.textSecondary },
  typeOptionTextSelected: { color: Colors.accent, fontWeight: "600" },
  reportInput: {
    backgroundColor: Colors.background,
    borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: Colors.textPrimary, minHeight: 50,
  },
  submitBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 12, paddingVertical: 12,
    alignItems: "center",
  },
  submitBtnText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  reportAnon: { fontSize: 11, color: Colors.textTertiary, textAlign: "center" },

  emergencyBtn: {
    borderWidth: 1.5,
    borderColor: Colors.danger,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  emergencyBtnText: { fontSize: 14, fontWeight: "600", color: Colors.danger },

  modalBackdrop: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center", justifyContent: "center", padding: 24,
  },
  modalCard: {
    backgroundColor: Colors.surface, borderRadius: 20,
    padding: 24, width: "100%", gap: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: Colors.textPrimary },
  modalSub: { fontSize: 14, color: Colors.textSecondary },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalCancel: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 12, paddingVertical: 12, alignItems: "center",
  },
  modalCancelText: { fontSize: 15, color: Colors.textSecondary },
  modalSend: {
    flex: 1, backgroundColor: Colors.danger,
    borderRadius: 12, paddingVertical: 12, alignItems: "center",
  },
  modalSendText: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },
});

const mapStyles = StyleSheet.create({
  pulseWrap: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  pulseRing: {
    position: "absolute", width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.accent,
  },
  pulseDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.accent },
});

const toastStyles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: 100,
    left: 24,
    right: 24,
    backgroundColor: Colors.textPrimary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  toastText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
});
