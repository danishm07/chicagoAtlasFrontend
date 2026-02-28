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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = Math.min(SCREEN_W, 375) - 40;

// ─── Data ────────────────────────────────────────────────────────────────────

const EVENTS = [
  {
    id: "1",
    title: "DePaul vs Marquette",
    badge: "Game Day",
    badgeColor: Colors.accent,
    price: "From $18",
    time: "Tonight 7:00 PM",
    distance: "0.8 mi",
    gradient: ["#003F73", "#005596"] as const,
  },
  {
    id: "2",
    title: "Symphony Center",
    badge: "Tonight",
    badgeColor: Colors.textPrimary,
    price: "From $35",
    time: "Doors 6:30 PM",
    distance: "0.3 mi",
    gradient: ["#2D1B69", "#4C1D95"] as const,
  },
  {
    id: "3",
    title: "Chicago Cultural Center",
    badge: "Free",
    badgeColor: Colors.success,
    price: "Free",
    time: "Open Now",
    distance: "0.1 mi",
    gradient: ["#C2410C", "#E8533A"] as const,
  },
  {
    id: "4",
    title: "Second City Comedy",
    badge: "Tonight",
    badgeColor: Colors.textPrimary,
    price: "From $22",
    time: "8:00 PM",
    distance: "0.6 mi",
    gradient: ["#065F46", "#047857"] as const,
  },
];

const SPOTS = [
  { id: "1", icon: "🍜", name: "Eleven City Diner", category: "American", price: "$$", wait: "10 min", distance: "0.2 mi", iconBg: "#FEF3C7" },
  { id: "2", icon: "☕", name: "Intelligentsia Coffee", category: "Coffee", price: "$", wait: "No wait", distance: "0.1 mi", iconBg: "#FEF0ED" },
  { id: "3", icon: "🍱", name: "Wow Bao", category: "Asian", price: "$", wait: "No wait", distance: "0.1 mi", iconBg: "#EDF7F2" },
  { id: "4", icon: "🥩", name: "Gyu-Kaku Loop", category: "Japanese BBQ", price: "$$$", wait: "25 min", distance: "0.4 mi", iconBg: "#FDF0F1" },
  { id: "5", icon: "🍕", name: "Lou Malnati's", category: "Pizza", price: "$$", wait: "20 min", distance: "0.3 mi", iconBg: "#EFF6FF" },
];

const TRENDING = [
  { id: "1", name: "Millennium Park", status: "BUSY" },
  { id: "2", name: "Symphony Center", status: "TONIGHT" },
  { id: "3", name: "Gyu-Kaku Loop", status: "TRENDING" },
  { id: "4", name: "DePaul vs Marquette", status: "SPORTS" },
];

const TABS = ["Events", "Spots", "Trending"] as const;
type TabKey = (typeof TABS)[number];

// ─── Refresh Bar ─────────────────────────────────────────────────────────────

function RefreshBar() {
  const progress = useRef(new Animated.Value(0)).current;
  const [updatedAt, setUpdatedAt] = useState("just now");

  const runCycle = () => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 60000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setUpdatedAt("just now");
        // TODO: fetch('/api/feed?filter=events&zone=depaul_loop')
        runCycle();
      }
    });
  };

  useEffect(() => {
    runCycle();
    return () => progress.stopAnimation();
  }, []);

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.refreshContainer}>
      <View style={styles.refreshTrack}>
        <Animated.View style={[styles.refreshBar, { width: barWidth }]} />
      </View>
      <Text style={styles.refreshLabel}>Updated {updatedAt}</Text>
    </View>
  );
}

// ─── Segmented Tab Control ────────────────────────────────────────────────────

function SegmentedTabs({
  active,
  onChange,
}: {
  active: number;
  onChange: (i: number) => void;
}) {
  const slideX = useRef(new Animated.Value(0)).current;
  const containerRef = useRef<View>(null);
  const [tabWidth, setTabWidth] = useState(0);

  useEffect(() => {
    if (tabWidth === 0) return;
    Animated.spring(slideX, {
      toValue: active * tabWidth,
      tension: 120,
      friction: 14,
      useNativeDriver: true,
    }).start();
  }, [active, tabWidth]);

  return (
    <View
      style={styles.tabPill}
      onLayout={(e) => setTabWidth(e.nativeEvent.layout.width / TABS.length)}
      ref={containerRef}
    >
      {tabWidth > 0 && (
        <Animated.View
          style={[
            styles.tabIndicator,
            { width: tabWidth, transform: [{ translateX: slideX }] },
          ]}
        />
      )}
      {TABS.map((tab, i) => (
        <Pressable
          key={tab}
          style={styles.tabItem}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChange(i);
          }}
        >
          <Text
            style={[styles.tabLabel, active === i && styles.tabLabelActive]}
          >
            {tab}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({ event }: { event: (typeof EVENTS)[number] }) {
  const scale = useRef(new Animated.Value(1)).current;
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <Pressable
      onPress={() => {
        Animated.sequence([
          Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
        ]).start();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // TODO: open event detail
      }}
    >
      <Animated.View style={[styles.eventCard, { transform: [{ scale }] }]}>
        {/* Image area */}
        <View style={styles.eventImageArea}>
          <LinearGradient
            colors={event.gradient}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          {/* Category badge */}
          <View
            style={[
              styles.eventBadge,
              { backgroundColor: event.badgeColor },
            ]}
          >
            <Text style={styles.eventBadgeText}>{event.badge}</Text>
          </View>
          {/* Price pill */}
          <View style={styles.eventPricePill}>
            <Text style={styles.eventPriceText}>{event.price}</Text>
          </View>
          {/* Bookmark */}
          <Pressable
            style={styles.eventBookmark}
            onPress={(e) => {
              e.stopPropagation?.();
              setBookmarked((b) => !b);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Feather
              name={bookmarked ? "bookmark" : "bookmark"}
              size={16}
              color={bookmarked ? Colors.accent : "#FFFFFF"}
            />
          </Pressable>
        </View>

        {/* Info area */}
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <View style={styles.eventMetaRow}>
            <View style={styles.eventMetaItem}>
              <Feather name="clock" size={12} color={Colors.textTertiary} />
              <Text style={styles.eventMetaText}>{event.time}</Text>
            </View>
            <View style={styles.eventMetaDot} />
            <View style={styles.eventMetaItem}>
              <Feather name="map-pin" size={12} color={Colors.textTertiary} />
              <Text style={styles.eventMetaText}>{event.distance}</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─── Spot Row ─────────────────────────────────────────────────────────────────

function SpotRow({ spot }: { spot: (typeof SPOTS)[number] }) {
  const [bookmarked, setBookmarked] = useState(false);
  const isNoWait = spot.wait === "No wait";

  return (
    <Pressable
      style={({ pressed }) => [styles.spotRow, { opacity: pressed ? 0.75 : 1 }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // TODO: open spot detail
      }}
    >
      <View style={[styles.spotIconBox, { backgroundColor: spot.iconBg }]}>
        <Text style={styles.spotEmoji}>{spot.icon}</Text>
      </View>
      <View style={styles.spotCenter}>
        <Text style={styles.spotName}>{spot.name}</Text>
        <Text style={styles.spotMeta}>
          {spot.category} · {spot.price}
        </Text>
      </View>
      <View style={styles.spotRight}>
        <View
          style={[
            styles.waitPill,
            { backgroundColor: isNoWait ? Colors.successBg : Colors.warningBg },
          ]}
        >
          <Text
            style={[
              styles.waitText,
              { color: isNoWait ? Colors.success : Colors.warning },
            ]}
          >
            {spot.wait}
          </Text>
        </View>
        <Text style={styles.spotDistance}>{spot.distance}</Text>
      </View>
      <Pressable
        onPress={(e) => {
          e.stopPropagation?.();
          setBookmarked((b) => !b);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      >
        <Feather
          name="bookmark"
          size={16}
          color={bookmarked ? Colors.accent : Colors.textTertiary}
        />
      </Pressable>
    </Pressable>
  );
}

// ─── Trending Row ─────────────────────────────────────────────────────────────

function TrendingRow({
  item,
  last,
}: {
  item: (typeof TRENDING)[number];
  last: boolean;
}) {
  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.trendRow, { opacity: pressed ? 0.75 : 1 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          // TODO: open trending item detail
        }}
      >
        <View style={styles.trendFlame}>
          <Text style={styles.trendFlameEmoji}>🔥</Text>
        </View>
        <View style={styles.trendCenter}>
          <Text style={styles.trendName}>{item.name}</Text>
          <Text style={styles.trendStatus}>{item.status}</Text>
        </View>
        <View style={styles.trendPill}>
          <Text style={styles.trendPillText}>Trending</Text>
        </View>
      </Pressable>
      {!last && <View style={styles.trendDivider} />}
    </>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 72;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>The Loop</Text>
          <Text style={styles.headerSub}>Live from your neighborhood</Text>
        </View>
      </View>

      {/* Refresh bar + tabs */}
      <View style={styles.controlsArea}>
        <RefreshBar />
        <SegmentedTabs active={activeTab} onChange={setActiveTab} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomPad, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Events Tab */}
        {activeTab === 0 && (
          <View style={styles.tabContent}>
            {/* TODO: fetch('/api/feed?filter=events&zone=depaul_loop') */}
            {EVENTS.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </View>
        )}

        {/* Spots Tab */}
        {activeTab === 1 && (
          <View style={[styles.tabContent, { paddingHorizontal: 20 }]}>
            {/* TODO: fetch('/api/feed?filter=spots&zone=depaul_loop') */}
            <View style={styles.spotsCard}>
              {SPOTS.map((spot, i) => (
                <React.Fragment key={spot.id}>
                  <SpotRow spot={spot} />
                  {i < SPOTS.length - 1 && <View style={styles.spotDivider} />}
                </React.Fragment>
              ))}
            </View>
          </View>
        )}

        {/* Trending Tab */}
        {activeTab === 2 && (
          <View style={[styles.tabContent, { paddingHorizontal: 20 }]}>
            {/* TODO: fetch('/api/feed?filter=trending&zone=depaul_loop') */}
            <View style={styles.trendingCard}>
              {TRENDING.map((item, i) => (
                <TrendingRow
                  key={item.id}
                  item={item}
                  last={i === TRENDING.length - 1}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 22,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },

  controlsArea: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 12,
  },

  // Refresh bar
  refreshContainer: { gap: 6 },
  refreshTrack: {
    height: 2,
    backgroundColor: Colors.border,
    borderRadius: 1,
    overflow: "hidden",
  },
  refreshBar: {
    height: 2,
    backgroundColor: Colors.accent,
    borderRadius: 1,
  },
  refreshLabel: {
    fontFamily: "DMMono_400Regular",
    fontSize: 10,
    color: Colors.textTertiary,
    letterSpacing: 0.3,
  },

  // Segmented tabs
  tabPill: {
    flexDirection: "row",
    backgroundColor: Colors.border,
    borderRadius: 12,
    padding: 3,
    position: "relative",
  },
  tabIndicator: {
    position: "absolute",
    top: 3,
    left: 3,
    bottom: 3,
    backgroundColor: Colors.surface,
    borderRadius: 9,
    zIndex: 0,
    shadowColor: "#1C1B18",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    zIndex: 1,
  },
  tabLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  tabLabelActive: {
    color: Colors.textPrimary,
    fontFamily: "DMSans_600SemiBold",
  },

  scroll: { flex: 1 },
  tabContent: { gap: 14 },

  // Event cards
  eventCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  eventImageArea: {
    height: 160,
    overflow: "hidden",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    position: "relative",
  },
  eventBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  eventBadgeText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 11,
    color: "#FFFFFF",
  },
  eventPricePill: {
    position: "absolute",
    bottom: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },
  eventPriceText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 11,
    color: Colors.textPrimary,
  },
  eventBookmark: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#00000033",
    alignItems: "center",
    justifyContent: "center",
  },
  eventInfo: {
    padding: 14,
    gap: 6,
  },
  eventTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  eventMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eventMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  eventMetaText: {
    fontFamily: "DMMono_400Regular",
    fontSize: 11,
    color: Colors.textSecondary,
  },
  eventMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textTertiary,
  },

  // Spots
  spotsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  spotRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  spotDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 60,
  },
  spotIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  spotEmoji: { fontSize: 20 },
  spotCenter: { flex: 1, gap: 2 },
  spotName: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 13,
    color: Colors.textPrimary,
  },
  spotMeta: {
    fontFamily: "DMMono_400Regular",
    fontSize: 11,
    color: Colors.textSecondary,
  },
  spotRight: { alignItems: "flex-end", gap: 4 },
  waitPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  waitText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 11,
  },
  spotDistance: {
    fontFamily: "DMMono_400Regular",
    fontSize: 10,
    color: Colors.textTertiary,
  },

  // Trending
  trendingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  trendDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 16,
  },
  trendFlame: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEF0ED",
    alignItems: "center",
    justifyContent: "center",
  },
  trendFlameEmoji: { fontSize: 16 },
  trendCenter: { flex: 1, gap: 2 },
  trendName: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 13,
    color: Colors.textPrimary,
  },
  trendStatus: {
    fontFamily: "DMMono_400Regular",
    fontSize: 10,
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  trendPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#FEF0ED",
  },
  trendPillText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 11,
    color: Colors.accent,
  },
});
