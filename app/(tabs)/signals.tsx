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
  PanResponder,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/context/theme";
import { useSaved } from "@/context/saved";
import { MOCK_SCORE, MOCK_REPORTS } from "@/constants/config";
import SharedHeader from "@/components/SharedHeader";
import SavedPanel from "@/components/SavedPanel";

const { width: SW } = Dimensions.get("window");
const GRID_PADDING = 20;
const GRID_GAP = 10;
const WIDGET_SIZE = (Math.min(SW, 480) - GRID_PADDING * 2 - GRID_GAP) / 2;

// ─── Widget definitions — add new types here only ───────────────────────────
const WIDGETS = [
  {
    id: "safety",
    name: "Safety",
    icon: "shield-outline",
    getValue: () => `${MOCK_SCORE.safety.incidents} incidents`,
    sub: "Last 6 hours · 800m radius",
  },
  {
    id: "transit",
    name: "Transit",
    icon: "train-outline",
    getValue: () => MOCK_SCORE.transit.status.includes("normally") ? "All clear" : "Delays",
    sub: "CTA status right now",
  },
  {
    id: "air",
    name: "Air Quality",
    icon: "leaf-outline",
    getValue: () => `AQI ${MOCK_SCORE.air.aqi}`,
    sub: `${MOCK_SCORE.air.category} · Safe outdoors`,
  },
  {
    id: "weather",
    name: "Weather",
    icon: "partly-sunny-outline",
    getValue: () => MOCK_SCORE.weather.temp,
    sub: `Feels like ${MOCK_SCORE.weather.feelsLike}`,
  },
  {
    id: "crowds",
    name: "Crowds",
    icon: "people-outline",
    getValue: () => "Moderate",
    sub: "Based on events + time",
  },
  {
    id: "events",
    name: "Events",
    icon: "calendar-outline",
    getValue: () => `${MOCK_SCORE.events} today`,
    sub: "Near your zone",
  },
  {
    id: "reports",
    name: "Reports",
    icon: "alert-circle-outline",
    getValue: () => `${MOCK_REPORTS.length} nearby`,
    sub: "User-submitted reports",
  },
] as const;

type WidgetId = typeof WIDGETS[number]["id"];

const REPORT_TYPES = ["Safety concern", "Suspicious activity", "Accident", "Traffic issue", "Other"];
const ALERT_COLORS: Record<string, string> = { red: "#C8303A", yellow: "#B8860B", green: "#16A34A" };

// ─── Inline Slot Machine picker ──────────────────────────────────────────────
function SlotPicker({
  options,
  onSelect,
  onDismiss,
  C,
}: {
  options: typeof WIDGETS[number][];
  onSelect: (id: WidgetId) => void;
  onDismiss: () => void;
  C: ReturnType<typeof useColors>;
}) {
  const [idx, setIdx] = useState(0);
  const slideAnim = useRef(new Animated.Value(WIDGET_SIZE)).current;
  const itemAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 280 }).start();
  }, []);

  const go = (dir: 1 | -1) => {
    const next = Math.max(0, Math.min(options.length - 1, idx + dir));
    if (next === idx) return;
    Haptics.selectionAsync();
    Animated.sequence([
      Animated.timing(itemAnim, { toValue: dir > 0 ? -16 : 16, duration: 80, useNativeDriver: true }),
      Animated.timing(itemAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start();
    setIdx(next);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8,
      onPanResponderRelease: (_, g) => {
        if (g.dy < -20) go(-1);
        else if (g.dy > 20) go(1);
      },
    })
  ).current;

  const confirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(options[idx].id as WidgetId);
  };

  const current = options[idx];
  const canUp = idx > 0;
  const canDown = idx < options.length - 1;

  return (
    <Animated.View
      style={[
        styles.slotContainer,
        { width: WIDGET_SIZE, height: WIDGET_SIZE, backgroundColor: C.surface, borderColor: "#E8533A", transform: [{ translateY: slideAnim }] },
      ]}
      {...panResponder.panHandlers}
    >
      <Pressable
        onPress={() => go(-1)}
        style={[styles.slotArrowBtn, { opacity: canUp ? 1 : 0.2 }]}
      >
        <Ionicons name="chevron-up" size={14} color={C.textSecondary} />
      </Pressable>

      <Animated.View style={[styles.slotMiddle, { transform: [{ translateY: itemAnim }] }]}>
        <Ionicons name={current.icon as any} size={26} color={C.textPrimary} />
        <Text style={[styles.slotName, { color: C.textPrimary }]}>{current.name}</Text>
        <Text style={[styles.slotSub, { color: C.textTertiary }]} numberOfLines={1}>{current.sub}</Text>
      </Animated.View>

      <Pressable
        onPress={() => go(1)}
        style={[styles.slotArrowBtn, { opacity: canDown ? 1 : 0.2 }]}
      >
        <Ionicons name="chevron-down" size={14} color={C.textSecondary} />
      </Pressable>

      <Pressable onPress={confirm} style={styles.slotConfirm}>
        <Text style={styles.slotConfirmText}>Select</Text>
      </Pressable>

      <Pressable onPress={onDismiss} style={styles.slotDismiss}>
        <Ionicons name="close" size={12} color={C.textTertiary} />
      </Pressable>

      <Text style={[styles.slotCounter, { color: C.textTertiary }]}>
        {idx + 1} / {options.length}
      </Text>
    </Animated.View>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────
export default function SignalsTab() {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const { panelOpen, closePanel } = useSaved();

  const [selectedWidgets, setSelectedWidgets] = useState<WidgetId[]>(["safety", "transit"]);
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

  const handleLongPress = (slot: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSwapSlot(slot);
  };

  const handleSwapSelect = (widgetId: WidgetId) => {
    if (swapSlot === null) return;
    setSelectedWidgets((prev) => {
      const next = [...prev] as WidgetId[];
      next[swapSlot] = widgetId;
      return next;
    });
    setSwapSlot(null);
  };

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

            if (swapSlot === slot) {
              const others = WIDGETS.filter((w) => !selectedWidgets.includes(w.id));
              return (
                <SlotPicker
                  key={`swap-${slot}`}
                  options={[...others]}
                  onSelect={handleSwapSelect}
                  onDismiss={() => setSwapSlot(null)}
                  C={C}
                />
              );
            }

            if (!widget) {
              return <View key={slot} style={[styles.widgetEmpty, { width: WIDGET_SIZE, borderColor: C.border }]} />;
            }

            return (
              <Pressable
                key={slot}
                onLongPress={() => handleLongPress(slot)}
                delayLongPress={500}
                style={({ pressed }) => [
                  styles.widgetCard,
                  { width: WIDGET_SIZE, backgroundColor: C.surface, borderColor: C.border, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <View style={styles.widgetTop}>
                  <Ionicons name={widget.icon as any} size={22} color={C.textPrimary} />
                </View>
                <View style={styles.widgetBody}>
                  <Text style={[styles.widgetName, { color: C.textPrimary }]}>{widget.name}</Text>
                  <Text style={[styles.widgetValue, { color: C.textPrimary }]}>{widget.getValue()}</Text>
                  <Text style={[styles.widgetSub, { color: "#7C7870" }]}>{widget.sub}</Text>
                </View>
              </Pressable>
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
                  onPress={() => {
                    setReportSubmitted(true);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    showToastMsg();
                  }}
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
  content: { paddingHorizontal: GRID_PADDING, paddingTop: 8 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 2 },
  sectionHint: { fontSize: 12, marginBottom: 12 },

  widgetGrid: { flexDirection: "row", gap: GRID_GAP, marginBottom: 16 },

  widgetEmpty: {
    width: WIDGET_SIZE, height: WIDGET_SIZE,
    borderRadius: 16, borderWidth: 1.5, borderStyle: "dashed",
  },
  widgetCard: {
    width: WIDGET_SIZE, height: WIDGET_SIZE,
    borderRadius: 16, borderWidth: 1.5,
    padding: 16, justifyContent: "space-between",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  widgetTop: { alignItems: "flex-start" },
  widgetBody: { gap: 3 },
  widgetName: { fontSize: 16, fontWeight: "700", letterSpacing: -0.2 },
  widgetValue: { fontSize: 20, fontWeight: "700", letterSpacing: -0.3 },
  widgetSub: { fontSize: 12, lineHeight: 16 },

  slotContainer: {
    height: WIDGET_SIZE,
    borderRadius: 16,
    borderWidth: 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    shadowColor: "#E8533A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  slotArrowBtn: { paddingHorizontal: 16, paddingVertical: 6 },
  slotMiddle: { alignItems: "center", gap: 4, flex: 1, justifyContent: "center", paddingHorizontal: 8 },
  slotName: { fontSize: 14, fontWeight: "700", textAlign: "center" },
  slotSub: { fontSize: 11, textAlign: "center", lineHeight: 14 },
  slotConfirm: {
    backgroundColor: "#E8533A", borderRadius: 8,
    paddingHorizontal: 20, paddingVertical: 6,
  },
  slotConfirmText: { color: "#FFF", fontSize: 12, fontWeight: "600" },
  slotDismiss: { position: "absolute", top: 8, right: 8 },
  slotCounter: { position: "absolute", bottom: 8, fontSize: 10 },

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

  toast: {
    position: "absolute", bottom: 100, alignSelf: "center",
    backgroundColor: "#1C1B18", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8,
  },
  toastText: { color: "#FFF", fontSize: 13, fontWeight: "500" },
});
