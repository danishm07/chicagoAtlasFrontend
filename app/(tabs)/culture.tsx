import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/context/theme";
import { useSaved } from "@/context/saved";
import SharedHeader from "@/components/SharedHeader";
import SavedPanel from "@/components/SavedPanel";

// TODO: GET /api/feed?filter=all — refresh every 90 seconds

const TRENDING = [
  { id: "t1", icon: "🔥", iconBg: "#E8533A", name: "Millennium Park", category: "OUTDOOR", trend: "up" as const, trendLabel: "↑ 3× normal traffic", sparkData: [2, 3, 4, 5, 6, 7, 8, 9, 10, 9] },
  { id: "t2", icon: "🎵", iconBg: "#5856D6", name: "Three Top Lounge", category: "LIVE MUSIC", trend: "up" as const, trendLabel: "↑ Fess Grandiose 8:30PM", sparkData: [3, 3, 4, 5, 5, 6, 8, 9, 9, 10] },
  { id: "t3", icon: "🍜", iconBg: "#FF9500", name: "Gyu-Kaku Loop", category: "RESTAURANT", trend: "steady" as const, trendLabel: "→ 20min wait, busy tonight", sparkData: [6, 7, 6, 7, 6, 7, 6, 7, 6, 7] },
  { id: "t4", icon: "🏀", iconBg: "#C8303A", name: "United Center", category: "SPORTS", trend: "up" as const, trendLabel: "↑ Bulls game 7:30PM", sparkData: [1, 2, 3, 4, 5, 6, 8, 9, 10, 10] },
];

const DISCOVER = [
  { id: "d1", featured: true, category: "FEATURED", name: "Intelligentsia Coffee", description: "Quieter than usual for a Saturday — no wait right now", distance: "0.1 mi", price: "$", open: "Open now" },
  { id: "d2", featured: false, category: "CULTURE", name: "Chicago Cultural Center", description: "Free admission, current exhibit closing this week", distance: "0.2 mi", price: "Free", open: "Open now" },
  { id: "d3", featured: false, category: "BAR", name: "The Berghoff Bar", description: "Happy hour until 7PM, usually mellow on weeknights", distance: "0.3 mi", price: "$$", open: "Open now" },
  { id: "d4", featured: false, category: "JAZZ", name: "Andy's Jazz Club", description: "Live set starts 9PM, $10 cover — real Chicago jazz", distance: "0.4 mi", price: "$$", open: "Open · 9PM show" },
];

const TONIGHT_CYCLE = [
  "Gyu-Kaku Loop — Japanese BBQ, limited seats",
  "Chicago Cultural Center — free exhibit, open late",
  "Second City — 8PM show, tickets available",
];

const TREND_COLORS: Record<string, string> = { up: "#16A34A", steady: "#7C7870", down: "#B5B0A7" };

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const H = 28;
  const W = 40;
  const step = W / (data.length - 1);

  return (
    <View style={{ width: W, height: H, flexDirection: "row", alignItems: "flex-end", gap: 1.5 }}>
      {data.map((v, i) => {
        const height = Math.max(3, ((v - min) / range) * H);
        return <View key={i} style={{ flex: 1, height, borderRadius: 2, backgroundColor: color, opacity: 0.6 + (i / data.length) * 0.4 }} />;
      })}
    </View>
  );
}

function SegmentControl({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const C = useColors();
  const pillAnim = useRef(new Animated.Value(value === "trending" ? 0 : 1)).current;

  const select = (v: string) => {
    onChange(v);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(pillAnim, { toValue: v === "trending" ? 0 : 1, useNativeDriver: false, damping: 18, stiffness: 200 }).start();
  };

  const pillLeft = pillAnim.interpolate({ inputRange: [0, 1], outputRange: ["2%", "50%"] });

  return (
    <View style={[styles.segContainer, { backgroundColor: C.border }]}>
      <Animated.View style={[styles.segPill, { left: pillLeft, backgroundColor: C.surface }]} />
      {["trending", "discover"].map((v) => (
        <Pressable key={v} onPress={() => select(v)} style={styles.segOption}>
          <Text style={[styles.segLabel, { color: value === v ? C.textPrimary : C.textSecondary, fontWeight: value === v ? "600" : "500" }]}>
            {v === "trending" ? "Trending" : "Discover"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function CultureTab() {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const { saveItem, unsaveItem, isSaved, panelOpen, closePanel } = useSaved();
  const [tab, setTab] = useState("trending");
  const [cycleIdx, setCycleIdx] = useState(0);

  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 80;

  const handleBookmark = (item: typeof DISCOVER[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSaved(item.id)) {
      unsaveItem(item.id);
    } else {
      saveItem({ id: item.id, name: item.name, category: item.category, type: "venue", meta: item.distance });
    }
  };

  const handleTrendingBookmark = (item: typeof TRENDING[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSaved(item.id)) {
      unsaveItem(item.id);
    } else {
      saveItem({ id: item.id, name: item.name, category: item.category, type: "venue", meta: item.trendLabel });
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <SharedHeader />

      <View style={[styles.subheaderRow, { borderBottomColor: C.border }]}>
        <Text style={[styles.subheaderText, { color: C.textSecondary }]}>What's happening in Chicago?</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <SegmentControl value={tab} onChange={setTab} />

        {tab === "trending" && (
          <View style={styles.section}>
            {TRENDING.map((item) => (
              <View key={item.id} style={[styles.trendCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                <View style={[styles.trendIcon, { backgroundColor: item.iconBg }]}>
                  <Text style={styles.trendIconEmoji}>{item.icon}</Text>
                </View>
                <View style={styles.trendInfo}>
                  <Text style={[styles.trendName, { color: C.textPrimary }]}>{item.name}</Text>
                  <Text style={[styles.trendCat, { color: C.textTertiary }]}>{item.category}</Text>
                  <Text style={[styles.trendLabel, { color: TREND_COLORS[item.trend] }]}>{item.trendLabel}</Text>
                </View>
                <View style={styles.trendRight}>
                  <Sparkline data={item.sparkData} color={TREND_COLORS[item.trend]} />
                  <Pressable
                    onPress={() => handleTrendingBookmark(item)}
                    style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginTop: 6 }]}
                  >
                    <Ionicons name={isSaved(item.id) ? "bookmark" : "bookmark-outline"} size={16} color={isSaved(item.id) ? "#E8533A" : C.textTertiary} />
                  </Pressable>
                </View>
              </View>
            ))}
            <Text style={[styles.refreshHint, { color: C.textTertiary }]}>Signals update every 90 seconds</Text>
          </View>
        )}

        {tab === "discover" && (
          <View style={styles.section}>
            <View style={styles.discoverHeadingRow}>
              <Text style={[styles.discoverHeading, { color: C.textPrimary }]}>Worth finding tonight</Text>
              <Pressable
                onPress={() => {
                  setCycleIdx((prev) => (prev + 1) % TONIGHT_CYCLE.length);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={({ pressed }) => [styles.cycleBtn, { backgroundColor: C.border, opacity: pressed ? 0.7 : 1 }]}
              >
                <Ionicons name="refresh" size={14} color={C.textSecondary} />
              </Pressable>
            </View>

            <View style={[styles.featuredPick, { backgroundColor: "#FEF0ED", borderColor: "#E8533A" }]}>
              <Text style={styles.featuredPickEmoji}>✨</Text>
              <Text style={styles.featuredPickText}>{TONIGHT_CYCLE[cycleIdx]}</Text>
            </View>

            {DISCOVER.map((item) => (
              <View key={item.id} style={[styles.discoverCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                <View style={styles.discoverCardTop}>
                  <View style={[styles.catPill, item.featured && styles.catPillFeatured, !item.featured && { backgroundColor: C.border }]}>
                    <Text style={[styles.catPillText, item.featured ? styles.catPillTextFeatured : { color: C.textSecondary }]}>{item.category}</Text>
                  </View>
                  <Pressable
                    onPress={() => handleBookmark(item)}
                    style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                  >
                    <Ionicons name={isSaved(item.id) ? "bookmark" : "bookmark-outline"} size={18} color={isSaved(item.id) ? "#E8533A" : C.textTertiary} />
                  </Pressable>
                </View>
                <Text style={[styles.discoverName, { color: C.textPrimary }]}>{item.name}</Text>
                <Text style={[styles.discoverDesc, { color: C.textSecondary }]}>{item.description}</Text>
                <View style={styles.discoverMeta}>
                  <View style={[styles.metaChip, { backgroundColor: C.border }]}>
                    <Text style={[styles.metaChipText, { color: C.textSecondary }]}>{item.distance}</Text>
                  </View>
                  <View style={[styles.metaChip, { backgroundColor: C.border }]}>
                    <Text style={[styles.metaChipText, { color: C.textSecondary }]}>{item.price}</Text>
                  </View>
                  <View style={[styles.metaChip, { backgroundColor: "#EDF7F2" }]}>
                    <Text style={[styles.metaChipText, { color: "#16A34A" }]}>{item.open}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <SavedPanel isOpen={panelOpen} onClose={closePanel} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  subheaderRow: { paddingHorizontal: 20, paddingBottom: 10, borderBottomWidth: 1 },
  subheaderText: { fontSize: 14 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  segContainer: { flexDirection: "row", borderRadius: 10, height: 38, marginBottom: 20, position: "relative", overflow: "hidden" },
  segPill: {
    position: "absolute", top: 3, bottom: 3, width: "48%",
    borderRadius: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
  },
  segOption: { flex: 1, alignItems: "center", justifyContent: "center", zIndex: 1 },
  segLabel: { fontSize: 14 },
  section: { gap: 12 },
  trendCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1.5,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  trendIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  trendIconEmoji: { fontSize: 20 },
  trendInfo: { flex: 1, gap: 2 },
  trendName: { fontSize: 14, fontWeight: "700" },
  trendCat: { fontSize: 10, fontWeight: "600", letterSpacing: 0.5 },
  trendLabel: { fontSize: 12 },
  trendRight: { alignItems: "flex-end", gap: 2 },
  refreshHint: { fontSize: 11, textAlign: "center", marginTop: 4 },
  discoverHeadingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  discoverHeading: { fontSize: 16, fontWeight: "700", flex: 1 },
  cycleBtn: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  featuredPick: { borderRadius: 12, borderWidth: 1.5, padding: 12, flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  featuredPickEmoji: { fontSize: 16 },
  featuredPickText: { flex: 1, fontSize: 13, fontWeight: "500", color: "#E8533A", lineHeight: 18 },
  discoverCard: {
    borderRadius: 16, borderWidth: 1.5, padding: 16, gap: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  discoverCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  catPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  catPillFeatured: { backgroundColor: "#E8533A" },
  catPillText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  catPillTextFeatured: { color: "#FFFFFF" },
  discoverName: { fontSize: 16, fontWeight: "700" },
  discoverDesc: { fontSize: 12, lineHeight: 17 },
  discoverMeta: { flexDirection: "row", gap: 6, marginTop: 4 },
  metaChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  metaChipText: { fontSize: 11, fontWeight: "500" },
});
