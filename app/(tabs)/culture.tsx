import React, { useState, useRef, useEffect } from "react";
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

const FEED_URL = "https://loop-pulse.vercel.app/api/feed?filter=all";

type FeedItem = {
  type: string;
  title: string;
  description: string;
  meta?: string;
  time?: string;
  tag?: string;
  id?: string;
};

const TREND_COLORS: Record<string, string> = { up: "#16A34A", steady: "#7C7870", down: "#B5B0A7" };
const TYPE_ICONS: Record<string, { icon: string; bg: string }> = {
  event: { icon: "🎵", bg: "#5856D6" },
  transit: { icon: "🚇", bg: "#16A34A" },
  food: { icon: "🍜", bg: "#FF9500" },
  safety: { icon: "🛡️", bg: "#E8533A" },
};

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
  const [trendingItems, setTrendingItems] = useState<FeedItem[]>([]);
  const [discoverItems, setDiscoverItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await fetch(FEED_URL);
        if (res.ok) {
          const data = (await res.json()) as FeedItem[];
          const trending = data.filter((i) => i.type === "event" || i.type === "transit");
          const discover = data.filter((i) => i.type === "food" || i.type === "safety");
          setTrendingItems(trending.map((i, idx) => ({ ...i, id: i.id ?? `trend-${idx}-${i.title}` })));
          setDiscoverItems(discover.map((i, idx) => ({ ...i, id: i.id ?? `disc-${idx}-${i.title}` })));
        }
      } catch {
        // keep previous data on error
      }
    };
    fetchFeed();
  }, []);

  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 80;

  const handleBookmark = (item: FeedItem) => {
    const id = item.id ?? item.title;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSaved(id)) {
      unsaveItem(id);
    } else {
      saveItem({ id, name: item.title, category: item.tag ?? item.type, type: "venue", meta: item.meta ?? item.description });
    }
  };

  const handleTrendingBookmark = (item: FeedItem) => {
    const id = item.id ?? item.title;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSaved(id)) {
      unsaveItem(id);
    } else {
      saveItem({ id, name: item.title, category: item.tag ?? item.type, type: "venue", meta: item.description ?? item.meta });
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
            {trendingItems.map((item) => {
              const id = item.id ?? item.title;
              const { icon, bg } = TYPE_ICONS[item.type] ?? { icon: "📍", bg: "#7C7870" };
              return (
                <View key={id} style={[styles.trendCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                  <View style={[styles.trendIcon, { backgroundColor: bg }]}>
                    <Text style={styles.trendIconEmoji}>{icon}</Text>
                  </View>
                  <View style={styles.trendInfo}>
                    <Text style={[styles.trendName, { color: C.textPrimary }]}>{item.title}</Text>
                    <Text style={[styles.trendCat, { color: C.textTertiary }]}>{item.tag ?? item.type.toUpperCase()}</Text>
                    <Text style={[styles.trendLabel, { color: TREND_COLORS.steady }]}>{item.description}</Text>
                  </View>
                  <View style={styles.trendRight}>
                    <Sparkline data={[3, 4, 5, 6, 7, 8, 9, 10, 9, 8]} color={TREND_COLORS.steady} />
                    <Pressable
                      onPress={() => handleTrendingBookmark(item)}
                      style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginTop: 6 }]}
                    >
                      <Ionicons name={isSaved(id) ? "bookmark" : "bookmark-outline"} size={16} color={isSaved(id) ? "#E8533A" : C.textTertiary} />
                    </Pressable>
                  </View>
                </View>
              );
            })}
            <Text style={[styles.refreshHint, { color: C.textTertiary }]}>Signals update every 90 seconds</Text>
          </View>
        )}

        {tab === "discover" && (
          <View style={styles.section}>
            <Text style={[styles.discoverHeading, { color: C.textPrimary, marginBottom: 10 }]}>Worth finding tonight</Text>

            {discoverItems.map((item) => {
              const id = item.id ?? item.title;
              return (
                <View key={id} style={[styles.discoverCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                  <View style={styles.discoverCardTop}>
                    <View style={[styles.catPill, { backgroundColor: C.border }]}>
                      <Text style={[styles.catPillText, { color: C.textSecondary }]}>{item.tag ?? item.type.toUpperCase()}</Text>
                    </View>
                    <Pressable
                      onPress={() => handleBookmark(item)}
                      style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                    >
                      <Ionicons name={isSaved(id) ? "bookmark" : "bookmark-outline"} size={18} color={isSaved(id) ? "#E8533A" : C.textTertiary} />
                    </Pressable>
                  </View>
                  <Text style={[styles.discoverName, { color: C.textPrimary }]}>{item.title}</Text>
                  <Text style={[styles.discoverDesc, { color: C.textSecondary }]}>{item.description}</Text>
                  <View style={styles.discoverMeta}>
                    {item.meta && (
                      <View style={[styles.metaChip, { backgroundColor: C.border }]}>
                        <Text style={[styles.metaChipText, { color: C.textSecondary }]}>{item.meta}</Text>
                      </View>
                    )}
                    {item.tag && (
                      <View style={[styles.metaChip, { backgroundColor: C.border }]}>
                        <Text style={[styles.metaChipText, { color: C.textSecondary }]}>{item.tag}</Text>
                      </View>
                    )}
                    {item.time && (
                      <View style={[styles.metaChip, { backgroundColor: "#EDF7F2" }]}>
                        <Text style={[styles.metaChipText, { color: "#16A34A" }]}>{item.time}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
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
