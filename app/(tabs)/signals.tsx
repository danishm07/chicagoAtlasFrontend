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
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useProfile } from "@/context/profile";
import { useColors } from "@/context/theme";
import { useSaved } from "@/context/saved";
import { MOCK_SCORE, MOCK_REPORTS } from "@/constants/config";
import SharedHeader from "@/components/SharedHeader";
import SavedPanel from "@/components/SavedPanel";

const { width: SW } = Dimensions.get("window");
const WIDGET_SIZE = (Math.min(SW, 480) - 48 - 10) / 2;

const WIDGETS = [
  { id: "safety",  name: "SAFETY",      icon: "🛡️", getValue: () => `${MOCK_SCORE.safety.incidents} incidents`, sub: "Last 6 hours · 800m radius" },
  { id: "transit", name: "TRANSIT",     icon: "🚇", getValue: () => MOCK_SCORE.transit.status.includes("normally") ? "All clear" : "Delays", sub: "CTA status right now" },
  { id: "air",     name: "AIR QUALITY", icon: "🌿", getValue: () => `AQI ${MOCK_SCORE.air.aqi}`, sub: `${MOCK_SCORE.air.category} · Safe for outdoor` },
  { id: "weather", name: "WEATHER",     icon: "☀️", getValue: () => MOCK_SCORE.weather.temp, sub: `Feels like ${MOCK_SCORE.weather.feelsLike}` },
  { id: "crowds",  name: "CROWDS",      icon: "👥", getValue: () => "Moderate", sub: "Based on events + time" },
  { id: "events",  name: "EVENTS",      icon: "🎟️", getValue: () => `${MOCK_SCORE.events} today`, sub: "Near your zone" },
  { id: "reports", name: "REPORTS",     icon: "⚠️", getValue: () => `${MOCK_REPORTS.length} nearby`, sub: "User-submitted reports" },
];

const REPORT_TYPES = ["Safety concern", "Suspicious activity", "Accident", "Traffic issue", "Other"];

const ALERT_COLORS: Record<string, string> = { red: "#C8303A", yellow: "#B8860B", green: "#16A34A" };

function ShakeView({ shaking, children }: { shaking: boolean; children: React.ReactNode }) {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (shaking) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 4, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -4, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
      ]).start();
    }
  }, [shaking]);

  return (
    <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
      {children}
    </Animated.View>
  );
}

export default function SignalsTab() {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const { profile } = useProfile();
  const { panelOpen, closePanel } = useSaved();

  const [selectedWidgets, setSelectedWidgets] = useState<string[]>(["safety", "transit"]);
  const [shakingWidget, setShakingWidget] = useState<string | null>(null);
  const [swapSlot, setSwapSlot] = useState<number | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(0)).current;

  const [reportExpanded, setReportExpanded] = useState(false);
  const [reportType, setReportType] = useState("Safety concern");
  const [reportText, setReportText] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const toastAnim = useRef(new Animated.Value(0)).current;

  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 80;

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.spring(drawerAnim, { toValue: 1, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
  };

  const closeDrawer = () => {
    Animated.timing(drawerAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setDrawerOpen(false));
  };

  const showToastMsg = () => {
    setShowToast(true);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowToast(false));
  };

  const handleWidgetPress = (id: string) => {
    setSelectedWidgets((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) {
        setShakingWidget(id);
        setTimeout(() => setShakingWidget(null), 600);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        return prev;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return [...prev, id];
    });
  };

  const handleWidgetLongPress = (idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSwapSlot(idx);
  };

  const handleSwapSelect = (widgetId: string) => {
    if (swapSlot === null) return;
    setSelectedWidgets((prev) => {
      const next = [...prev];
      next[swapSlot] = widgetId;
      return next;
    });
    setSwapSlot(null);
  };

  const availableForSwap = WIDGETS.filter((w) => !selectedWidgets.includes(w.id));

  const drawerTranslateY = drawerAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] });
  const overlayOpacity = drawerAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <SharedHeader />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: C.textTertiary }]}>LIVE WIDGETS</Text>
        <Text style={[styles.sectionHint, { color: C.textSecondary }]}>Hold any widget to swap it</Text>

        <View style={styles.widgetGrid}>
          {[0, 1].map((slot) => {
            const wid = selectedWidgets[slot];
            const widget = WIDGETS.find((w) => w.id === wid);
            if (!widget) return <View key={slot} style={[styles.widgetEmpty, { width: WIDGET_SIZE, borderColor: C.border }]} />;
            return (
              <ShakeView key={slot} shaking={shakingWidget === widget.id}>
                <Pressable
                  onPress={() => handleWidgetPress(widget.id)}
                  onLongPress={() => handleWidgetLongPress(slot)}
                  delayLongPress={500}
                  style={({ pressed }) => [styles.widgetCard, { width: WIDGET_SIZE, backgroundColor: C.surface, borderColor: C.border, opacity: pressed ? 0.85 : 1 }]}
                >
                  <View style={styles.widgetTop}>
                    <Text style={styles.widgetIcon}>{widget.icon}</Text>
                    <Text style={[styles.widgetName, { color: C.textSecondary }]}>{widget.name}</Text>
                  </View>
                  <Text style={[styles.widgetValue, { color: C.textPrimary }]}>{widget.getValue()}</Text>
                  <Text style={[styles.widgetSub, { color: C.textTertiary }]}>{widget.sub}</Text>
                </Pressable>
              </ShakeView>
            );
          })}
        </View>

        <View style={[styles.mapPlaceholder, { backgroundColor: C.border }]}>
          <View style={styles.mapDot} />
          <Text style={[styles.mapLabel, { color: C.textSecondary }]}>Map coming soon</Text>
          <Text style={[styles.mapSub, { color: C.textTertiary }]}>Azure Maps integration pending</Text>
        </View>

        <Pressable
          onPress={openDrawer}
          style={({ pressed }) => [styles.drawerTrigger, { backgroundColor: C.surface, borderColor: C.border, opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={[styles.drawerTriggerText, { color: C.textPrimary }]}>Live Alerts</Text>
          <Ionicons name="chevron-up" size={16} color={C.textSecondary} />
        </Pressable>
      </ScrollView>

      {drawerOpen && (
        <>
          <Animated.View style={[styles.drawerOverlay, { opacity: overlayOpacity }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
          </Animated.View>
          <Animated.View style={[styles.drawer, { backgroundColor: C.surface, transform: [{ translateY: drawerTranslateY }] }]}>
            <View style={[styles.drawerHandle, { backgroundColor: C.border }]} />
            <View style={styles.drawerHeaderRow}>
              <Text style={[styles.drawerTitle, { color: C.textPrimary }]}>Live Alerts</Text>
              <Text style={[styles.drawerTimestamp, { color: C.textTertiary }]}>Updated just now</Text>
            </View>

            {MOCK_REPORTS.map((r) => (
              <View key={r.id} style={[styles.alertRow, { borderBottomColor: C.border }]}>
                <View style={[styles.alertDot, { backgroundColor: ALERT_COLORS[r.level] ?? C.textTertiary }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.alertTitle, { color: C.textPrimary }]}>{r.type}</Text>
                  <Text style={[styles.alertSub, { color: C.textSecondary }]}>{r.location} · {r.time}</Text>
                </View>
              </View>
            ))}

            <View style={[styles.drawerDivider, { backgroundColor: C.border }]} />

            {!reportExpanded ? (
              <Pressable
                onPress={() => setReportExpanded(true)}
                style={({ pressed }) => [styles.reportBtn, { borderColor: C.border, opacity: pressed ? 0.7 : 1 }]}
              >
                <Ionicons name="warning-outline" size={16} color={C.textSecondary} />
                <Text style={[styles.reportBtnText, { color: C.textSecondary }]}>Report to other Users</Text>
              </Pressable>
            ) : reportSubmitted ? (
              <View style={styles.thankRow}>
                <Text style={[styles.thankText, { color: C.textPrimary }]}>Thanks — report received 🙌</Text>
              </View>
            ) : (
              <View style={styles.reportForm}>
                <Text style={[styles.reportFormLabel, { color: C.textSecondary }]}>Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reportTypePills}>
                  {REPORT_TYPES.map((t) => (
                    <Pressable
                      key={t}
                      onPress={() => setReportType(t)}
                      style={[styles.reportTypePill, { backgroundColor: reportType === t ? "#E8533A" : C.surface, borderColor: reportType === t ? "#E8533A" : C.border }]}
                    >
                      <Text style={{ fontSize: 12, color: reportType === t ? "#FFF" : C.textSecondary, fontWeight: "500" }}>{t}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <TextInput
                  style={[styles.reportInput, { backgroundColor: C.background, borderColor: C.border, color: C.textPrimary }]}
                  placeholder="Add a note (optional)"
                  placeholderTextColor={C.textTertiary}
                  value={reportText}
                  onChangeText={setReportText}
                  multiline
                />
                <Pressable
                  onPress={() => { setReportSubmitted(true); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); showToastMsg(); }}
                  style={styles.submitBtn}
                >
                  <Text style={styles.submitBtnText}>Submit Report</Text>
                </Pressable>
              </View>
            )}

            <View style={{ height: Platform.OS === "web" ? 34 : insets.bottom + 8 }} />
          </Animated.View>
        </>
      )}

      {swapSlot !== null && (
        <Modal transparent animationType="slide" onRequestClose={() => setSwapSlot(null)}>
          <Pressable style={styles.swapOverlay} onPress={() => setSwapSlot(null)} />
          <View style={[styles.swapSheet, { backgroundColor: C.surface }]}>
            <View style={[styles.swapHandle, { backgroundColor: C.border }]} />
            <Text style={[styles.swapTitle, { color: C.textPrimary }]}>Swap Widget</Text>
            <Text style={[styles.swapSub, { color: C.textSecondary }]}>Choose what to show in this slot</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.swapList}>
              {availableForSwap.map((w) => (
                <Pressable
                  key={w.id}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleSwapSelect(w.id); }}
                  style={({ pressed }) => [styles.swapRow, { backgroundColor: C.background, opacity: pressed ? 0.7 : 1 }]}
                >
                  <Text style={styles.swapIcon}>{w.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.swapWidgetName, { color: C.textPrimary }]}>{w.name}</Text>
                    <Text style={[styles.swapWidgetSub, { color: C.textSecondary }]}>{w.sub}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={C.textTertiary} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Modal>
      )}

      {showToast && (
        <Animated.View style={[styles.toast, { opacity: toastAnim }]}>
          <Text style={styles.toastText}>Report submitted ✓</Text>
        </Animated.View>
      )}

      <SavedPanel isOpen={panelOpen} onClose={closePanel} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 2 },
  sectionHint: { fontSize: 12, marginBottom: 12 },
  widgetGrid: { flexDirection: "row", gap: 10, marginBottom: 16 },
  widgetEmpty: { height: WIDGET_SIZE, borderRadius: 14, borderWidth: 1.5, borderStyle: "dashed" },
  widgetCard: {
    height: WIDGET_SIZE, borderRadius: 14, borderWidth: 1.5,
    padding: 14, justifyContent: "space-between",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  widgetTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  widgetIcon: { fontSize: 18 },
  widgetName: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, flex: 1 },
  widgetValue: { fontSize: 20, fontWeight: "700", letterSpacing: -0.3, marginVertical: 4 },
  widgetSub: { fontSize: 11, lineHeight: 15 },
  mapPlaceholder: {
    height: 180, borderRadius: 16, marginBottom: 12,
    alignItems: "center", justifyContent: "center", gap: 6,
  },
  mapDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#E8533A" },
  mapLabel: { fontSize: 15, fontWeight: "500" },
  mapSub: { fontSize: 12 },
  drawerTrigger: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5,
  },
  drawerTriggerText: { fontSize: 15, fontWeight: "600" },
  drawerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 10 },
  drawer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 12, paddingHorizontal: 20, zIndex: 11,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 16,
  },
  drawerHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  drawerHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  drawerTitle: { fontSize: 17, fontWeight: "700" },
  drawerTimestamp: { fontSize: 12 },
  alertRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  alertDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  alertTitle: { fontSize: 14, fontWeight: "600" },
  alertSub: { fontSize: 12, marginTop: 2 },
  drawerDivider: { height: 1, marginVertical: 12 },
  reportBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1.5 },
  reportBtnText: { fontSize: 14, fontWeight: "500" },
  thankRow: { paddingVertical: 16, alignItems: "center" },
  thankText: { fontSize: 15, fontWeight: "500" },
  reportForm: { gap: 10 },
  reportFormLabel: { fontSize: 12, fontWeight: "600", letterSpacing: 0.5 },
  reportTypePills: { gap: 8, paddingBottom: 4 },
  reportTypePill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  reportInput: {
    borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, minHeight: 60,
  },
  submitBtn: { backgroundColor: "#E8533A", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  submitBtnText: { color: "#FFF", fontSize: 14, fontWeight: "600" },
  swapOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  swapSheet: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 12, paddingHorizontal: 20, maxHeight: "60%",
  },
  swapHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  swapTitle: { fontSize: 17, fontWeight: "700", marginBottom: 4 },
  swapSub: { fontSize: 13, marginBottom: 16 },
  swapList: { gap: 8, paddingBottom: 40 },
  swapRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 12 },
  swapIcon: { fontSize: 22 },
  swapWidgetName: { fontSize: 14, fontWeight: "600" },
  swapWidgetSub: { fontSize: 12, marginTop: 2 },
  toast: {
    position: "absolute", bottom: 100, alignSelf: "center",
    backgroundColor: "#1C1B18", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8,
  },
  toastText: { color: "#FFF", fontSize: 13, fontWeight: "500" },
});
