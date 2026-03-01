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
  ActivityIndicator,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors, useTheme } from "@/context/theme";
import { useSaved } from "@/context/saved";
import { AZURE_MAPS_KEY } from "@/constants/config";
import SharedHeader from "@/components/SharedHeader";
import SavedPanel from "@/components/SavedPanel";

const { width: SW } = Dimensions.get("window");
const GRID_PADDING = 20;
const GRID_GAP = 10;
const WIDGET_SIZE = (Math.min(SW, 480) - GRID_PADDING * 2 - GRID_GAP) / 2;

const SCORE_URL = "https://loop-pulse.vercel.app/api/score";

type ScoreResponse = {
  score?: number;
  weather?: { temp: string; feelsLike: string; condition?: string };
  safety?: { score?: number; incidents?: number; recommendation?: string };
  events?: number;
  transit?: { status: string; alerts?: string[] };
  air?: { aqi: number; category: string };
  reports?: Array<{ id: string; level?: string; type?: string; location?: string; time?: string; severity?: string; description?: string }>;
};

type WidgetId = "safety" | "transit" | "air" | "weather" | "crowds" | "events" | "reports";

function getWidgets(liveData: ScoreResponse | null, cpdIncidents: any[]) {
  if (!liveData) return [];
  const d = liveData;
  const incidentCount = cpdIncidents.length;
  const safetyScore = Math.max(10, 100 - (incidentCount * 3));
  return [
    {
      id: "safety" as const,
      name: "Safety",
      icon: "shield-outline",
      getValue: () => `${safetyScore}/100 Score`,
      sub: "Official CPD Data · 800m radius",
    },
    {
      id: "transit" as const,
      name: "Transit",
      icon: "train-outline",
      getValue: () => (d.transit?.status?.includes("normally") ? "All clear" : "Details"),
      sub: "CTA status right now",
    },
    {
      id: "air" as const,
      name: "Air Quality",
      icon: "leaf-outline",
      getValue: () => `AQI ${d.air?.aqi ?? 0}`,
      sub: `${d.air?.category ?? "—"} · Safe outdoors`,
    },
    {
      id: "weather" as const,
      name: "Weather",
      icon: "partly-sunny-outline",
      getValue: () => d.weather?.temp ?? "—",
      sub: `Feels like ${d.weather?.feelsLike ?? "—"}`,
    },
    {
      id: "crowds" as const,
      name: "Crowds",
      icon: "people-outline",
      getValue: () => "Moderate",
      sub: "Based on events + time",
    },
    {
      id: "events" as const,
      name: "Events",
      icon: "calendar-outline",
      getValue: () => `${d.events ?? 0} today`,
      sub: "Near your zone",
    },
    {
      id: "reports" as const,
      name: "Reports",
      icon: "alert-circle-outline",
      getValue: () => `${d.reports?.length ?? 0} nearby`,
      sub: "User-submitted reports",
    },
  ];
}

function normalizeReports(reports: ScoreResponse["reports"]) {
  if (!reports?.length) return [];
  return reports.map((r) => ({
    id: r.id,
    level: r.level ?? (r.severity === "high" ? "red" : r.severity === "medium" ? "yellow" : "green"),
    type: r.type ?? r.description ?? "Report",
    location: r.location ?? "Nearby",
    time: r.time ?? "Just now",
  }));
}

const REPORT_TYPES = ["Safety concern", "Suspicious activity", "Accident", "Traffic issue", "Other"];
const ALERT_COLORS: Record<string, string> = { red: "#C8303A", yellow: "#B8860B", green: "#16A34A" };

const LIVE_ARRIVALS = [
  { route: "Brown Line", dest: "Kimball", eta: "2 min", color: "#62361B" },
  { route: "Green Line", dest: "Harlem/Lake", eta: "4 min", color: "#009B3A" },
  { route: "Orange Line", dest: "Midway", eta: "7 min", color: "#F9461C" },
  { route: "Red Line", dest: "Howard", eta: "DUE", color: "#C60C30", station: "State/Lake" } 
];

const CPD_INCIDENTS = [
  { type: "Theft - Retail", location: "State & Lake", time: "15 mins ago", level: "yellow" }, 
  { type: "Disturbance", location: "Wabash & Washington", time: "42 mins ago", level: "yellow" }, 
  { type: "Motor Vehicle Theft", location: "Monroe & Dearborn", time: "1 hr ago", level: "red" }
];

// ─── Inline Slot Machine picker ──────────────────────────────────────────────
function SlotPicker({
  options,
  onSelect,
  onDismiss,
  C,
}: {
  options: Array<{ id: WidgetId; name: string; icon: string; getValue: () => string; sub: string }>;
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
      onMoveShouldSetPanResponder: (_: any, gestureState: any) => Math.abs(gestureState.dy) > 8,
      onPanResponderRelease: (_: any, gestureState: any) => {
        if (gestureState.dy < -20) go(-1);
        else if (gestureState.dy > 20) go(1);
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

// ─── Map Grid Fallback Component ─────────────────────────────────────────────
function MapGridFallback({ C }: { C: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.mapGridFallback, { backgroundColor: C.background }]}>
      {/* Grid lines */}
      <View style={[styles.gridLines, { opacity: 0.1 }]}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={`h-${i}`} style={[styles.gridLine, styles.gridHorizontal, { top: `${(i + 1) * 16.67}%` }]} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={`v-${i}`} style={[styles.gridLine, styles.gridVertical, { left: `${(i + 1) * 12.5}%` }]} />
        ))}
      </View>
      
      {/* Fallback markers */}
      <View style={[styles.markerContainer, styles.safetyMarker]}>
        <View style={styles.calloutBubble}>
          <Text style={styles.calloutText}>Safe Corridor</Text>
        </View>
        <View style={[styles.iconMarker, styles.safetyIcon]}>
          <Ionicons name="shield-checkmark" size={20} color="#FFF" />
        </View>
      </View>
      
      <View style={[styles.markerContainer, styles.transitMarker]}>
        <View style={styles.calloutBubble}>
          <Text style={styles.calloutText}>Brown Line: On Time</Text>
        </View>
        <View style={[styles.iconMarker, styles.transitIcon]}>
          <Ionicons name="train" size={20} color="#FFF" />
        </View>
      </View>
      
      <View style={[styles.markerContainer, styles.activityMarker]}>
        <View style={styles.calloutBubble}>
          <Text style={styles.calloutText}>Fairgrounds: Busy</Text>
        </View>
        <View style={[styles.iconMarker, styles.activityIcon]}>
          <Ionicons name="star" size={20} color="#FFF" />
        </View>
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legend</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.safetyLegend]} />
          <Text style={styles.legendText}>Safety</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.transitLegend]} />
          <Text style={styles.legendText}>Transit</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.activityLegend]} />
          <Text style={styles.legendText}>Activity</Text>
        </View>
      </View>
      
      <Text style={[styles.mapErrorText, { color: C.textSecondary }]}>Map unavailable</Text>
    </View>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────
export default function SignalsTab() {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const { isDark } = useTheme();
  const { panelOpen, closePanel } = useSaved();

  const [liveData, setLiveData] = useState<ScoreResponse | null>(null);
  const [cpdIncidents, setCpdIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const refreshRotation = useRef(new Animated.Value(0)).current;
  const [mapError, setMapError] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);

  const fetchScore = async () => {
    setRefreshing(true);
    
    // Animate refresh icon
    Animated.loop(
      Animated.timing(refreshRotation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
    
    try {
      const res = await fetch(SCORE_URL);
      if (res.ok) {
        const data = (await res.json()) as ScoreResponse;
        setLiveData(data);
      }
      
      // Fetch live CPD data from Chicago Data Portal
      const cpdRes = await fetch("https://data.cityofchicago.org/resource/ijzp-q8t2.json?$limit=4&$order=date%20DESC");
      const cpdData = await cpdRes.json();
      setCpdIncidents(cpdData);
    } catch {
      // keep previous data on error
    } finally {
      setLoading(false);
      setRefreshing(false);
      refreshRotation.stopAnimation();
    }
  };

  useEffect(() => {
    fetchScore();
    const interval = setInterval(fetchScore, 90 * 1000);
    return () => clearInterval(interval);
  }, []);

  const [selectedWidgets, setSelectedWidgets] = useState<WidgetId[]>(["safety", "transit"]);
  const [swapSlot, setSwapSlot] = useState<number | null>(null);

  const WIDGETS = getWidgets(liveData, cpdIncidents);
  const reports = normalizeReports(liveData?.reports);

  const [activeDrawer, setActiveDrawer] = useState<"alerts" | "transit" | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(0)).current;

  const [reportExpanded, setReportExpanded] = useState(false);
  const [reportType, setReportType] = useState("Safety concern");
  const [reportText, setReportText] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const toastAnim = useRef(new Animated.Value(0)).current;

  // Radar pulse animations for markers
  const safetyPulse = useRef(new Animated.Value(1)).current;
  const transitPulse = useRef(new Animated.Value(1)).current;
  const trendingPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const radarAnimation = (anim: Animated.Value) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    radarAnimation(safetyPulse);
    radarAnimation(transitPulse);
    radarAnimation(trendingPulse);
  }, []);

  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 80;

  const openDrawer = (type: "alerts" | "transit") => {
    setActiveDrawer(type);
    setDrawerOpen(true);
    Animated.spring(drawerAnim, { toValue: 1, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
  };
  const closeDrawer = () => {
    Animated.timing(drawerAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
      setDrawerOpen(false);
      setActiveDrawer(null);
    });
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

  if (loading) {
    return (
      <View style={[styles.root, styles.loadingScreen, { backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color="#E8533A" />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <SharedHeader />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.sectionLabel, { color: C.textTertiary }]}>LIVE WIDGETS</Text>
            <Text style={[styles.sectionHint, { color: C.textSecondary }]}>Hold any widget to swap it</Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              fetchScore();
            }}
            style={({ pressed }) => [
              styles.refreshButton,
              { backgroundColor: C.surface, borderColor: C.border, opacity: pressed ? 0.7 : 1 }
            ]}
          >
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: refreshRotation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              }}
            >
              <Ionicons 
                name={refreshing ? "refresh" : "refresh-outline"} 
                size={16} 
                color={C.textSecondary} 
              />
            </Animated.View>
          </Pressable>
        </View>

        <View style={styles.widgetGrid}>
          {[0, 1].map((slot) => {
            const wid = selectedWidgets[slot];
            const widget = WIDGETS.find((w) => w.id === wid);

            if (swapSlot === slot) {
              const others = WIDGETS.filter((w) => !selectedWidgets.includes(w.id));
              if (others.length === 0) {
                return (
                  <Pressable
                    key={slot}
                    onPress={() => setSwapSlot(null)}
                    style={[styles.widgetEmpty, { width: WIDGET_SIZE, borderColor: C.border, alignItems: "center", justifyContent: "center" }]}
                  >
                    <Text style={[styles.slotSub, { color: C.textTertiary }]}>No widgets to swap</Text>
                  </Pressable>
                );
              }
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
                onPress={() => {
                  if (widget.id === "transit") {
                    openDrawer("transit");
                  } else if (widget.id === "safety") {
                    openDrawer("alerts");
                  }
                }}
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

        <View style={[styles.mapContainer, { paddingBottom: 100 }]}>
          <View style={[styles.manualMapBackground, { backgroundColor: '#0A192F' }]}>
            
            {/* Blueprint Grid Lines */}
            <View style={styles.gridLines}>
              {Array.from({ length: 9 }).map((_, i) => (
                <View key={`h-${i}`} style={[styles.gridLine, styles.gridHorizontal, { top: `${(i + 1) * 10}%`, backgroundColor: '#1B2B48' }]} />
              ))}
              {Array.from({ length: 9 }).map((_, i) => (
                <View key={`v-${i}`} style={[styles.gridLine, styles.gridVertical, { left: `${(i + 1) * 10}%`, backgroundColor: '#1B2B48' }]} />
              ))}
            </View>
            
            {/* Safety Marker - State/Lake */}
            <View style={[styles.markerContainer, { top: "25%", left: "35%" }]}>
              <View style={styles.blueprintLabel}>
                <Text style={styles.blueprintTime}>09:30 AM</Text>
                <Text style={styles.blueprintLocation}>STATE & LAKE</Text>
                <Text style={[styles.blueprintStatus, { color: '#EF4444' }]}>ACTIVE ALERT</Text>
              </View>
              <View style={styles.pulseContainer}>
                <View style={[styles.pulseCore, { backgroundColor: '#EF4444' }]} />
                <Animated.View style={[styles.pulseRing, { borderColor: '#EF4444', opacity: safetyPulse, transform: [{ scale: safetyPulse.interpolate({ inputRange: [0, 1], outputRange: [2, 1] }) }] }]} />
              </View>
            </View>
            
            {/* Transit Marker - Washington/Wabash */}
            <View style={[styles.markerContainer, { top: "50%", left: "60%" }]}>
              <View style={styles.blueprintLabel}>
                <Text style={styles.blueprintTime}>LIVE</Text>
                <Text style={styles.blueprintLocation}>CTA BROWN LINE</Text>
                <Text style={[styles.blueprintStatus, { color: '#10B981' }]}>ON TIME</Text>
              </View>
              <View style={styles.pulseContainer}>
                <View style={[styles.pulseCore, { backgroundColor: '#10B981' }]} />
                <Animated.View style={[styles.pulseRing, { borderColor: '#10B981', opacity: transitPulse, transform: [{ scale: transitPulse.interpolate({ inputRange: [0, 1], outputRange: [2, 1] }) }] }]} />
              </View>
            </View>
            
            {/* Activity Marker - Millennium Park */}
            <View style={[styles.markerContainer, { top: "70%", left: "45%" }]}>
              <View style={styles.blueprintLabel}>
                <Text style={styles.blueprintTime}>TRENDING</Text>
                <Text style={styles.blueprintLocation}>MILLENNIUM PARK</Text>
                <Text style={[styles.blueprintStatus, { color: '#FB7185' }]}>HIGH FOOT TRAFFIC</Text>
              </View>
              <View style={styles.pulseContainer}>
                <View style={[styles.pulseCore, { backgroundColor: '#FB7185' }]} />
                <Animated.View style={[styles.pulseRing, { borderColor: '#FB7185', opacity: trendingPulse, transform: [{ scale: trendingPulse.interpolate({ inputRange: [0, 1], outputRange: [2, 1] }) }] }]} />
              </View>
            </View>

          </View>
        </View>

        <Pressable
          onPress={() => openDrawer("alerts")}
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
              <Text style={[styles.drawerTitle, { color: C.textPrimary }]}>
                {activeDrawer === "transit" ? "CTA Live Status" : "Live Alerts"}
              </Text>
              <Text style={[styles.drawerTimestamp, { color: C.textTertiary }]}>Updated just now</Text>
            </View>

            {activeDrawer === "alerts" && (
              <>
                {/* Section 1: Official CPD Data */}
                <Text style={[styles.sectionLabel, { color: C.textTertiary, marginBottom: 8 }]}>OFFICIAL CHICAGO POLICE DEPT. DATA</Text>
                {cpdIncidents.map((incident, idx) => (
                  <View key={idx} style={[styles.alertRow, { borderBottomColor: C.border }]}>
                    <View style={[styles.alertDot, { backgroundColor: ALERT_COLORS[incident.level] ?? C.textTertiary }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.alertTitle, { color: C.textPrimary }]}>{incident.primary_type}</Text>
                      <Text style={[styles.alertSub, { color: C.textSecondary }]}>{incident.block} · {new Date(incident.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                    </View>
                    <Ionicons name="shield-checkmark" size={16} color="#4285F4" />
                  </View>
                ))}

                <View style={[styles.drawerDivider, { backgroundColor: C.border }]} />

                {/* Section 2: Community Reports */}
                <Text style={[styles.sectionLabel, { color: C.textTertiary, marginBottom: 8, marginTop: 8 }]}>COMMUNITY REPORTS</Text>
                {reports.map((r) => (
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
                    <Pressable
                      onPress={() => {
                        setReportSubmitted(false);
                        setReportText("");
                        setReportExpanded(false);
                      }}
                      style={styles.submitAnotherBtn}
                    >
                      <Text style={styles.submitAnotherText}>Submit Another</Text>
                    </Pressable>
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
              </>
            )}

            {activeDrawer === "transit" && (
              <View style={{ flex: 1, paddingTop: 4 }}>
                
                {/* 1. Live Arrivals Section */}
                <Text style={[styles.sectionLabel, { color: C.textTertiary, marginBottom: 8 }]}>
                  NEARBY ARRIVALS • WASHINGTON / WABASH
                </Text>
                <View style={{ marginBottom: 20 }}>
                  {LIVE_ARRIVALS.map((train, i) => (
                    <View key={i} style={[styles.arrivalRow, { borderBottomColor: C.border }]}>
                      <View style={styles.arrivalLeft}>
                        <View style={[styles.trainLineColor, { backgroundColor: train.color }]} />
                        <View>
                          <Text style={[styles.trainRoute, { color: C.textPrimary }]}>{train.route}</Text>
                          <Text style={[styles.trainDest, { color: C.textSecondary }]}>To {train.dest}</Text>
                        </View>
                      </View>
                      <Text style={[
                        styles.trainEta, 
                        { color: train.eta === "DUE" ? "#E8533A" : C.textPrimary }
                      ]}>
                        {train.eta}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* 2. System Alerts Section */}
                <Text style={[styles.sectionLabel, { color: C.textTertiary, marginBottom: 8 }]}>
                  SYSTEM ALERTS
                </Text>
                {(liveData?.transit?.alerts ?? []).length === 0 ? (
                  <View style={styles.transitSuccessRow}>
                    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                    <Text style={[styles.transitSuccessText, { color: C.textPrimary }]}>
                      All CTA lines are running normally.
                    </Text>
                  </View>
                ) : (
                  (liveData?.transit?.alerts ?? []).map((alert, idx) => {
                    const parts = alert.split(/[—:]/);
                    const route = parts[0]?.trim() ?? "CTA";
                    const headline = parts.slice(1).join(":").trim() || alert;
                    return (
                      <View key={idx} style={[styles.transitAlertRow, { borderBottomColor: C.border }]}>
                        <Text style={[styles.transitRoute, { color: C.textPrimary }]}>{route}</Text>
                        <Text style={[styles.transitHeadline, { color: C.textSecondary }]}>{headline}</Text>
                      </View>
                    );
                  })
                )}
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
  loadingScreen: { alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: GRID_PADDING, paddingTop: 8 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 2 },
  sectionHint: { fontSize: 12, marginBottom: 12 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  refreshButton: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
  },

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

  mapContainer: {
    height: 300,
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    position: "relative",
  },
  manualMapBackground: {
    width: "100%",
    height: "100%",
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
  },
  indicatorContainer: {
    position: "absolute",
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  indicatorIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  indicatorLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  safetyIndicator: {
    top: "20%",
    left: "10%",
  },
  safetyIndicatorIcon: {
    backgroundColor: "#EF4444",
  },
  transitIndicator: {
    top: "40%",
    left: "15%",
  },
  transitIndicatorIcon: {
    backgroundColor: "#10B981",
  },
  spotsIndicator: {
    top: "60%",
    left: "20%",
  },
  spotsIndicatorIcon: {
    backgroundColor: "#FB7185",
  },
  markerContainer: {
    position: "absolute",
    alignItems: "center",
  },
  calloutBubble: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  calloutText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1C1B18",
  },
  iconMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  safetyMarker: {
    top: "25%",
    left: "35%",
  },
  safetyIcon: {
    backgroundColor: "#EF4444",
  },
  transitMarker: {
    top: "50%",
    left: "60%",
  },
  transitIcon: {
    backgroundColor: "#10B981",
  },
  activityMarker: {
    top: "70%",
    left: "45%",
  },
  activityIcon: {
    backgroundColor: "#FB7185",
  },
  legend: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1C1B18",
    marginBottom: 6,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  safetyLegend: {
    backgroundColor: "#EF4444",
  },
  transitLegend: {
    backgroundColor: "#10B981",
  },
  activityLegend: {
    backgroundColor: "#FB7185",
  },
  legendText: {
    fontSize: 11,
    color: "#1C1B18",
    fontWeight: "500",
  },
  mapGridFallback: {
    width: "100%",
    height: "100%",
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
  },
  gridLines: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: "absolute",
    backgroundColor: "#1B2B48",
  },
  gridHorizontal: {
    left: 0,
    right: 0,
    height: 1,
  },
  gridVertical: {
    top: 0,
    bottom: 0,
    width: 1,
  },
  mapLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  mapErrorText: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
  },

  drawerTrigger: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5,
  },
  drawerTriggerText: { fontSize: 15, fontWeight: "600" },

  drawerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 10 },
  drawer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 12, paddingHorizontal: 20, paddingBottom: 90, zIndex: 11,
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
  transitSuccessRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 16 },
  transitSuccessText: { fontSize: 15, fontWeight: "500", flex: 1 },
  transitAlertRow: { paddingVertical: 12, borderBottomWidth: 1, gap: 4 },
  transitRoute: { fontSize: 14, fontWeight: "700" },
  transitHeadline: { fontSize: 13, lineHeight: 18 },
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
  submitAnotherBtn: { backgroundColor: "#1C1B18", borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 12 },
  submitAnotherText: { color: "#FFF", fontSize: 14, fontWeight: "600" },

  toast: {
    position: "absolute", bottom: 100, alignSelf: "center",
    backgroundColor: "#1C1B18", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8,
  },
  toastText: { color: "#FFF", fontSize: 13, fontWeight: "500" },

  // Blueprint aesthetic styles
  blueprintLabel: {
    backgroundColor: "rgba(30, 58, 95, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E3A5F",
  },
  blueprintTime: {
    fontSize: 9,
    color: "#64FFDA",
    fontFamily: Platform.OS === "web" ? "SF Mono, Monaco, monospace" : "monospace",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  blueprintLocation: {
    fontSize: 10,
    color: "#FFFFFF",
    fontFamily: Platform.OS === "web" ? "SF Mono, Monaco, monospace" : "monospace",
    fontWeight: "700",
    letterSpacing: 0.3,
    marginTop: 1,
  },
  blueprintStatus: {
    fontSize: 8,
    color: "#8892B0",
    fontFamily: Platform.OS === "web" ? "SF Mono, Monaco, monospace" : "monospace",
    fontWeight: "500",
    letterSpacing: 0.8,
    marginTop: 1,
  },
  pulseContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
  },
  pulseCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: "absolute",
    zIndex: 2,
  },
  pulseRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: "absolute",
    borderWidth: 1,
    opacity: 0,
  },
  safetyPulse: {
    backgroundColor: "#EF4444",
  },
  safetyRing: {
    borderColor: "#EF4444",
  },
  transitPulse: {
    backgroundColor: "#10B981",
  },
  transitRing: {
    borderColor: "#10B981",
  },
  trendingPulse: {
    backgroundColor: "#FB7185",
  },
  trendingRing: {
    borderColor: "#FB7185",
  },
  arrivalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  arrivalLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  trainLineColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  trainRoute: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  trainDest: {
    fontSize: 13,
    marginTop: 2,
  },
  trainEta: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
});
