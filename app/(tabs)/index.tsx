import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
  Dimensions,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useProfile } from "@/context/profile";
import { router } from "expo-router";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = Math.min(SCREEN_W, 375);

// ─── Animated SVG Ring ────────────────────────────────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function HealthRing({ score }: { score: number }) {
  const R = 52;
  const CIRC = 2 * Math.PI * R;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: score / 100,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, []);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRC, 0],
  });

  return (
    <Svg width={120} height={120} style={{ transform: [{ rotate: "-90deg" }] }}>
      <Circle cx={60} cy={60} r={R} stroke="#FFFFFF14" strokeWidth={8} fill="none" />
      <AnimatedCircle
        cx={60}
        cy={60}
        r={R}
        stroke={Colors.accent}
        strokeWidth={8}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${CIRC}`}
        strokeDashoffset={strokeDashoffset}
      />
    </Svg>
  );
}

// ─── Shimmer Skeleton ─────────────────────────────────────────────────────────
function Shimmer({ width, height, radius = 6 }: { width: number | string; height: number; radius?: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const bg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#E8E5DF", "#F0EDE8"],
  });

  return (
    <Animated.View
      style={{ width: width as any, height, borderRadius: radius, backgroundColor: bg }}
    />
  );
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────
function AlertBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  const translateY = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      tension: 80,
      friction: 12,
      useNativeDriver: true,
    }).start();

    const t = setTimeout(() => {
      Animated.timing(translateY, {
        toValue: -80,
        duration: 300,
        useNativeDriver: true,
      }).start(onDismiss);
    }, 8000);

    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    Animated.timing(translateY, {
      toValue: -80,
      duration: 250,
      useNativeDriver: true,
    }).start(onDismiss);
  };

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY }] }]}>
      <View style={styles.bannerLeft}>
        <Feather name="alert-triangle" size={14} color="#FFFFFF" />
        <Text style={styles.bannerText}>{message}</Text>
      </View>
      <Pressable onPress={dismiss} hitSlop={12}>
        <Feather name="x" size={16} color="#FFFFFF" />
      </Pressable>
    </Animated.View>
  );
}

// ─── Pulsing Live Dot ─────────────────────────────────────────────────────────
function LivePill() {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.4, duration: 600, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.livePill}>
      <View style={styles.liveDotWrapper}>
        <Animated.View style={[styles.liveDotRing, { transform: [{ scale }] }]} />
        <View style={styles.liveDot} />
      </View>
      <Text style={styles.liveText}>LIVE</Text>
    </View>
  );
}

// ─── Stat Mini Card ───────────────────────────────────────────────────────────
function StatCard({ icon, line1, line2 }: { icon: string; line1: string; line2: string }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.statCard, { opacity: pressed ? 0.8 : 1 }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // TODO: open bottom sheet with stat detail
      }}
    >
      <Feather name={icon as any} size={14} color="#FFFFFF88" />
      <Text style={styles.statLine1}>{line1}</Text>
      <Text style={styles.statLine2}>{line2}</Text>
    </Pressable>
  );
}

// ─── Data Card ────────────────────────────────────────────────────────────────
type DataCardProps = {
  icon: string;
  iconBg: string;
  value: string;
  label: string;
  pillLabel: string;
  pillColor: string;
  pillBg: string;
  isLoading?: boolean;
  onPress: () => void;
};

function DataCard({ icon, iconBg, value, label, pillLabel, pillColor, pillBg, isLoading, onPress }: DataCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  if (isLoading) {
    return (
      <View style={styles.dataCard}>
        <Shimmer width={32} height={32} radius={10} />
        <Shimmer width={40} height={28} radius={6} />
        <Shimmer width="80%" height={12} radius={4} />
        <Shimmer width={60} height={20} radius={10} />
      </View>
    );
  }

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.dataCard, { transform: [{ scale }] }]}>
        <View style={[styles.dataIconCircle, { backgroundColor: iconBg }]}>
          <Ionicons name={icon as any} size={16} color="#FFFFFF" />
        </View>
        <Text style={styles.dataValue}>{value}</Text>
        <Text style={styles.dataLabel}>{label}</Text>
        <View style={[styles.dataPill, { backgroundColor: pillBg }]}>
          <Text style={[styles.dataPillText, { color: pillColor }]}>{pillLabel}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─── Trending Chip ────────────────────────────────────────────────────────────
function TrendingChip({ tag, name, meta }: { tag: string; name: string; meta: string }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.trendChip, { opacity: pressed ? 0.8 : 1 }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // TODO: open trending item detail
      }}
    >
      <Text style={styles.trendTag}>{tag}</Text>
      <Text style={styles.trendName}>{name}</Text>
      <View style={styles.trendMetaRow}>
        <Text style={styles.trendMeta}>{meta}</Text>
      </View>
    </Pressable>
  );
}

// ─── Alert Row ────────────────────────────────────────────────────────────────
function AlertRow({ color, text, time }: { color: string; text: string; time: string }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.alertRow, { opacity: pressed ? 0.75 : 1 }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // TODO: open alert detail
      }}
    >
      <View style={[styles.alertDot, { backgroundColor: color }]} />
      <Text style={styles.alertText} numberOfLines={1}>{text}</Text>
      <Text style={styles.alertTime}>{time}</Text>
      <Feather name="info" size={14} color={Colors.textTertiary} />
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PulseScreen() {
  const insets = useSafeAreaInsets();
  const { profile, clearProfile } = useProfile();
  const [showBanner, setShowBanner] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [loading] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 72;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning," : hour < 17 ? "Good afternoon," : "Good evening,";

  const displayName = profile?.name || "there";
  const zoneName = profile?.homeZone
    ? profile.homeZone.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : "The Loop";

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Alert Banner */}
      {showBanner && (
        <AlertBanner
          message="DePaul vs Marquette starts in 60 min →"
          onDismiss={() => setShowBanner(false)}
        />
      )}

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerGreeting}>{greeting}</Text>
          <Text style={styles.headerName}>{displayName}</Text>
          <Pressable
            style={styles.zonePill}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // TODO: open zone picker
            }}
          >
            <Feather name="map-pin" size={11} color={Colors.accent} />
            <Text style={styles.zonePillText}>{zoneName}</Text>
            <Feather name="chevron-right" size={11} color={Colors.textTertiary} />
          </Pressable>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // TODO: open saved panel
            }}
          >
            <Feather name="bookmark" size={20} color={Colors.textPrimary} />
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowSettings(true);
            }}
          >
            <Feather name="settings" size={20} color={Colors.textPrimary} />
          </Pressable>
          <LivePill />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Pulse Hero Card ── */}
        <View style={styles.section}>
          <View style={styles.heroCard}>
            {/* Subtle glow */}
            <View style={styles.heroGlow} />

            <Text style={styles.heroLabel}>{"// LOOP HEALTH SCORE"}</Text>

            <View style={styles.heroRingRow}>
              <View style={styles.heroRingWrapper}>
                <HealthRing score={87} />
                <View style={styles.heroScoreCenter}>
                  <Text style={styles.heroScore}>87</Text>
                </View>
              </View>
              <View style={styles.heroRightCol}>
                <View style={styles.heroStatusRow}>
                  <View style={styles.heroStatusDot} />
                  <Text style={styles.heroStatus}>Moderately Busy</Text>
                </View>
                <View style={styles.heroStatCards}>
                  <StatCard icon="trending-up" line1="Past 30 Min" line2="↑ Trending Up" />
                  <StatCard icon="users" line1="Density" line2="Moderate" />
                </View>
              </View>
            </View>

            <View style={styles.heroFooter}>
              <Text style={styles.heroUpdated}>Updated 2 min ago</Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // TODO: refresh data
                }}
              >
                <Feather name="refresh-cw" size={13} color="#FFFFFF66" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* ── Data Cards Grid ── */}
        <View style={styles.section}>
          <View style={styles.grid}>
            <DataCard
              icon="shield-checkmark"
              iconBg={Colors.success}
              value="2"
              label="Nearby Incidents"
              pillLabel="Low Risk"
              pillColor={Colors.success}
              pillBg={Colors.successBg}
              isLoading={loading}
              onPress={() => {
                // TODO: open safety detail
              }}
            />
            <DataCard
              icon="ticket"
              iconBg="#3B82F6"
              value="4"
              label="Today's Events"
              pillLabel="View All"
              pillColor="#3B82F6"
              pillBg="#EFF6FF"
              isLoading={loading}
              onPress={() => {
                // TODO: open events list
              }}
            />
            <DataCard
              icon="restaurant"
              iconBg={Colors.accent}
              value="38"
              label="Open Nearby"
              pillLabel="Active"
              pillColor={Colors.success}
              pillBg={Colors.successBg}
              isLoading={loading}
              onPress={() => {
                // TODO: open spots list
              }}
            />
            <DataCard
              icon="leaf"
              iconBg={Colors.success}
              value="52"
              label="AQI — Good"
              pillLabel="Safe"
              pillColor={Colors.success}
              pillBg={Colors.successBg}
              isLoading={loading}
              onPress={() => {
                // TODO: open air quality detail
              }}
            />
          </View>
        </View>

        {/* ── Game Day Card ── */}
        {true /* hasGame */ && (
          <View style={styles.section}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                // TODO: open game day detail / ticket link
              }}
              style={({ pressed }) => [styles.gameCard, { opacity: pressed ? 0.9 : 1 }]}
            >
              <View style={styles.gameCardInner}>
                <View style={styles.gameLeft}>
                  <View style={styles.gameIconCircle}>
                    <Ionicons name="basketball" size={22} color="#FFFFFF" />
                  </View>
                  <View style={styles.gameTextCol}>
                    <Text style={styles.gameTitle}>DePaul vs Marquette</Text>
                    <Text style={styles.gameMeta}>Tonight 7:00 PM</Text>
                    <Text style={styles.gameVenue}>Wintrust Arena · 0.8 mi</Text>
                  </View>
                </View>
                <View style={styles.gameRight}>
                  <View style={styles.gameTicketPill}>
                    <Text style={styles.gameTicketText}>From $18</Text>
                  </View>
                  <Text style={styles.gameTicketLink}>Get Tickets</Text>
                </View>
              </View>
              <View style={styles.gameFooter}>
                <Feather name="alert-triangle" size={12} color="#FFFFFF99" />
                <Text style={styles.gameFooterText}>Wabash Ave busy post-game</Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* ── Trending Now ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Now</Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // TODO: navigate to full trending list
            }}
          >
            <Text style={styles.viewAll}>View All</Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trendScroll}
        >
          <TrendingChip tag="BUSY" name="Millennium Park" meta="↑ 3× normal traffic" />
          <TrendingChip tag="TONIGHT" name="Symphony Center" meta="Doors 6:30PM · ~2,500" />
          <TrendingChip tag="TRENDING" name="Gyu-Kaku Loop" meta="Mentioned 47× today" />
          <TrendingChip tag="SPORTS" name="DePaul vs Marquette" meta="Tonight · Wintrust" />
        </ScrollView>

        {/* ── Active Alerts ── */}
        <View style={[styles.sectionHeader, { marginTop: 8 }]}>
          <Text style={styles.sectionTitle}>Active Alerts</Text>
        </View>
        <View style={[styles.section, { marginTop: 0 }]}>
          <View style={styles.alertsCard}>
            <AlertRow color="#F59E0B" text="Traffic blocked on State St" time="Just now" />
            <View style={styles.alertDivider} />
            <AlertRow color={Colors.success} text="Noise complaint near DePaul" time="Just now" />
            <View style={styles.alertDivider} />
            <AlertRow color={Colors.danger} text="Fire alarm on Wabash" time="Just now" />
          </View>
        </View>

        {/* ── Chat Preview ── */}
        <View style={styles.section}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/chat");
            }}
            style={({ pressed }) => [styles.chatCard, { opacity: pressed ? 0.85 : 1 }]}
          >
            <View style={styles.chatIconBox}>
              <MaterialIcons name="diamond" size={20} color={Colors.accent} />
            </View>
            <View style={styles.chatCenter}>
              <Text style={styles.chatPrompt}>
                "What should I do near DePaul tonight?"
              </Text>
              <Text style={styles.chatHint}>Tap to ask the Loop →</Text>
            </View>
            <Feather name="arrow-right" size={18} color={Colors.accent} />
          </Pressable>
        </View>
      </ScrollView>

      {/* ── Settings Modal ── */}
      <Modal
        visible={showSettings}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowSettings(false)}
        />
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Settings</Text>

          <Pressable
            style={({ pressed }) => [
              styles.resetBtn,
              { opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowSettings(false);
              await clearProfile();
              router.replace("/onboarding/step1");
            }}
          >
            <Feather name="refresh-ccw" size={18} color="#FFFFFF" />
            <Text style={styles.resetBtnText}>Restart Onboarding</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.cancelBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => setShowSettings(false)}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  // Banner
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: Colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bannerLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  bannerText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: "#FFFFFF",
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: { gap: 4 },
  headerGreeting: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  headerName: {
    fontFamily: "DMSans_700Bold",
    fontSize: 24,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  zonePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#FEF0ED",
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  zonePillText: {
    fontFamily: "DMMono_400Regular",
    fontSize: 11,
    color: Colors.accent,
    letterSpacing: 0.3,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 4 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.successBg,
    borderRadius: 20,
  },
  liveDotWrapper: { width: 8, height: 8, alignItems: "center", justifyContent: "center" },
  liveDotRing: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
    opacity: 0.4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  liveText: {
    fontFamily: "DMMono_500Medium",
    fontSize: 10,
    color: Colors.success,
    letterSpacing: 1,
  },

  scroll: { flex: 1 },

  section: { paddingHorizontal: 20, marginTop: 16 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 17,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  viewAll: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: Colors.accent,
  },

  // Hero Card
  heroCard: {
    backgroundColor: Colors.textPrimary,
    borderRadius: 24,
    padding: 20,
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(232,83,58,0.12)",
  },
  heroLabel: {
    fontFamily: "DMMono_400Regular",
    fontSize: 10,
    color: "#FFFFFF55",
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  heroRingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  heroRingWrapper: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  heroScoreCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  heroScore: {
    fontFamily: "DMSans_700Bold",
    fontSize: 52,
    color: "#FFFFFF",
    letterSpacing: -2,
  },
  heroRightCol: { flex: 1, gap: 12 },
  heroStatusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  heroStatus: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 14,
    color: "#FFFFFFCC",
  },
  heroStatCards: { gap: 8 },
  statCard: {
    backgroundColor: "#FFFFFF12",
    borderRadius: 10,
    padding: 10,
    gap: 3,
  },
  statLine1: {
    fontFamily: "DMMono_400Regular",
    fontSize: 10,
    color: "#FFFFFF66",
    letterSpacing: 0.3,
  },
  statLine2: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 13,
    color: "#FFFFFF",
  },
  heroFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#FFFFFF14",
  },
  heroUpdated: {
    fontFamily: "DMMono_400Regular",
    fontSize: 10,
    color: "#FFFFFF44",
    letterSpacing: 0.3,
  },

  // Data Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  dataCard: {
    width: (Math.min(SCREEN_W, 375) - 40 - 10) / 2,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 6,
  },
  dataIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dataValue: {
    fontFamily: "DMSans_700Bold",
    fontSize: 28,
    color: Colors.textPrimary,
    letterSpacing: -1,
    marginTop: 4,
  },
  dataLabel: {
    fontFamily: "DMMono_400Regular",
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  dataPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 4,
  },
  dataPillText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 11,
  },

  // Game Card
  gameCard: {
    backgroundColor: Colors.depaul,
    borderRadius: 16,
    padding: 16,
    overflow: "hidden",
  },
  gameCardInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gameLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  gameIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFFFFF20",
    alignItems: "center",
    justifyContent: "center",
  },
  gameTextCol: { gap: 2 },
  gameTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 15,
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  gameMeta: {
    fontFamily: "DMMono_400Regular",
    fontSize: 11,
    color: "#FFFFFFBB",
  },
  gameVenue: {
    fontFamily: "DMMono_400Regular",
    fontSize: 11,
    color: "#FFFFFF88",
  },
  gameRight: { alignItems: "flex-end", gap: 4 },
  gameTicketPill: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  gameTicketText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 12,
    color: Colors.depaul,
  },
  gameTicketLink: {
    fontFamily: "DMSans_500Medium",
    fontSize: 11,
    color: "#FFFFFFCC",
  },
  gameFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#FFFFFF22",
  },
  gameFooterText: {
    fontFamily: "DMMono_400Regular",
    fontSize: 11,
    color: "#FFFFFF99",
  },

  // Trending
  trendScroll: {
    paddingLeft: 20,
    paddingRight: 8,
    gap: 10,
  },
  trendChip: {
    width: 150,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 4,
  },
  trendTag: {
    fontFamily: "DMMono_400Regular",
    fontSize: 9,
    color: Colors.textTertiary,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  trendName: {
    fontFamily: "DMSans_700Bold",
    fontSize: 13,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  trendMetaRow: { marginTop: 4 },
  trendMeta: {
    fontFamily: "DMMono_400Regular",
    fontSize: 11,
    color: Colors.textSecondary,
  },

  // Alerts
  alertsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: Colors.textPrimary,
    flex: 1,
  },
  alertTime: {
    fontFamily: "DMMono_400Regular",
    fontSize: 10,
    color: Colors.textTertiary,
  },
  alertDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 16,
  },

  // Chat Preview
  chatCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  chatIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.textPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  chatCenter: { flex: 1, gap: 4 },
  chatPrompt: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: "italic",
    lineHeight: 18,
  },
  chatHint: {
    fontFamily: "DMMono_400Regular",
    fontSize: 11,
    color: Colors.textTertiary,
  },

  // Settings modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "#00000055",
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 20,
    color: Colors.textPrimary,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
  },
  resetBtnText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 14,
  },
  cancelBtnText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: Colors.textSecondary,
  },
});
