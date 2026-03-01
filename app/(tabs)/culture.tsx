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
import Colors from "@/constants/colors";
import { router } from "expo-router";

// TODO: GET /api/feed?filter=all — refresh every 90 seconds

const TRENDING = [
  {
    id: "t1",
    icon: "🔥",
    iconBg: Colors.accent,
    name: "Millennium Park",
    category: "OUTDOOR",
    trend: "up" as const,
    trendLabel: "↑ 3× normal traffic",
    sparkData: [2, 3, 4, 5, 6, 7, 8, 9, 10, 9],
  },
  {
    id: "t2",
    icon: "🎵",
    iconBg: "#5856D6",
    name: "Three Top Lounge",
    category: "LIVE MUSIC",
    trend: "up" as const,
    trendLabel: "↑ Fess Grandiose 8:30PM",
    sparkData: [3, 3, 4, 5, 5, 6, 8, 9, 9, 10],
  },
  {
    id: "t3",
    icon: "🍜",
    iconBg: "#FF9500",
    name: "Gyu-Kaku Loop",
    category: "RESTAURANT",
    trend: "steady" as const,
    trendLabel: "→ 20min wait, busy tonight",
    sparkData: [6, 7, 6, 7, 6, 7, 6, 7, 6, 7],
  },
  {
    id: "t4",
    icon: "🏀",
    iconBg: "#C8303A",
    name: "United Center",
    category: "SPORTS",
    trend: "up" as const,
    trendLabel: "↑ Bulls game 7:30PM",
    sparkData: [1, 2, 3, 4, 5, 6, 8, 9, 10, 10],
  },
];

const DISCOVER = [
  {
    id: "d1",
    featured: true,
    category: "FEATURED",
    name: "Intelligentsia Coffee",
    description: "Quieter than usual for a Saturday — no wait right now",
    distance: "0.1 mi",
    price: "$",
    open: "Open now",
  },
  {
    id: "d2",
    featured: false,
    category: "CULTURE",
    name: "Chicago Cultural Center",
    description: "Free admission, current exhibit closing this week",
    distance: "0.2 mi",
    price: "Free",
    open: "Open until 8PM",
  },
  {
    id: "d3",
    featured: false,
    category: "BAR",
    name: "Berghoff Bar",
    description: "Historic Chicago spot — shorter wait than usual tonight",
    distance: "0.3 mi",
    price: "$$",
    open: "Open now",
  },
  {
    id: "d4",
    featured: false,
    category: "MUSIC",
    name: "Andy's Jazz Club",
    description: "Live set starts in 45 min — still seats available",
    distance: "0.4 mi",
    price: "$$",
    open: "Open now",
  },
];

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 40;
  const H = 28;
  const stepX = W / (data.length - 1);

  return (
    <View style={{ width: W, height: H, overflow: "hidden" }}>
      {data.slice(0, -1).map((val, i) => {
        const x1 = i * stepX;
        const y1 = H - ((val - min) / range) * H;
        const x2 = (i + 1) * stepX;
        const y2 = H - ((data[i + 1] - min) / range) * H;
        const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              left: x1,
              top: y1,
              width: length,
              height: 1.5,
              backgroundColor: Colors.accent,
              transformOrigin: "left center",
              transform: [{ rotate: `${angle}deg` }],
            }}
          />
        );
      })}
    </View>
  );
}

export default function CultureScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 72;

  const [activeTab, setActiveTab] = useState<"trending" | "discover">("trending");
  const slideAnim = useRef(new Animated.Value(0)).current;

  const switchTab = (tab: "trending" | "discover") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
    Animated.spring(slideAnim, {
      toValue: tab === "trending" ? 0 : 1,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  };

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Culture</Text>
          <Text style={styles.headerSub}>What's moving in Chicago right now</Text>
        </View>
        <Pressable style={styles.settingsBtn} onPress={() => router.push("/settings")}>
          <Ionicons name="settings-outline" size={22} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.segmentWrap}>
        <View style={styles.segmentTrack}>
          <Animated.View
            style={[
              styles.segmentPill,
              {
                left: slideAnim.interpolate({ inputRange: [0, 1], outputRange: ["2%", "50%"] }),
              },
            ]}
          />
          <Pressable style={styles.segmentBtn} onPress={() => switchTab("trending")}>
            <Text style={[styles.segmentText, activeTab === "trending" && styles.segmentTextActive]}>
              Trending
            </Text>
          </Pressable>
          <Pressable style={styles.segmentBtn} onPress={() => switchTab("discover")}>
            <Text style={[styles.segmentText, activeTab === "discover" && styles.segmentTextActive]}>
              Discover
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "trending" ? (
          <>
            {TRENDING.map((item) => (
              <View key={item.id} style={styles.trendCard}>
                <View style={[styles.trendIcon, { backgroundColor: item.iconBg }]}>
                  <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                </View>
                <View style={styles.trendCenter}>
                  <Text style={styles.trendName}>{item.name}</Text>
                  <Text style={styles.trendCategory}>{item.category}</Text>
                  <Text
                    style={[
                      styles.trendLabel,
                      item.trend === "up"
                        ? styles.trendUp
                        : item.trend === "steady"
                        ? styles.trendSteady
                        : styles.trendDown,
                    ]}
                  >
                    {item.trendLabel}
                  </Text>
                </View>
                <View style={styles.sparkWrap}>
                  <Sparkline data={item.sparkData} />
                </View>
              </View>
            ))}
            <Text style={styles.updateFooter}>Signals update every 90 seconds</Text>
          </>
        ) : (
          <>
            <Text style={styles.discoverHeader}>Worth finding tonight</Text>
            {DISCOVER.map((item) => (
              <View key={item.id} style={styles.discoverCard}>
                <View style={styles.discoverTop}>
                  <View style={[styles.categoryPill, item.featured && styles.categoryPillFeatured]}>
                    <Text style={[styles.categoryPillText, item.featured && styles.categoryPillTextFeatured]}>
                      {item.category}
                    </Text>
                  </View>
                </View>
                <Text style={styles.discoverName}>{item.name}</Text>
                <Text style={styles.discoverDesc}>{item.description}</Text>
                <View style={styles.discoverChips}>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{item.distance}</Text>
                  </View>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{item.price}</Text>
                  </View>
                  <View style={[styles.chip, styles.chipGreen]}>
                    <Text style={[styles.chipText, styles.chipTextGreen]}>{item.open}</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: Colors.textPrimary, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  settingsBtn: { padding: 6, marginTop: 2 },

  segmentWrap: { paddingHorizontal: 20, paddingVertical: 12 },
  segmentTrack: {
    flexDirection: "row",
    backgroundColor: Colors.border,
    borderRadius: 12,
    padding: 3,
    position: "relative",
  },
  segmentPill: {
    position: "absolute",
    top: 3,
    bottom: 3,
    width: "48%",
    backgroundColor: Colors.surface,
    borderRadius: 10,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
      : { shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 }),
  },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: "center" },
  segmentText: { fontSize: 14, fontWeight: "500", color: Colors.textTertiary },
  segmentTextActive: { color: Colors.textPrimary, fontWeight: "600" },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 4 },

  trendCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 1px 3px rgba(28,27,24,0.06)" }
      : { shadowColor: "#1C1B18", shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 }),
  },
  trendIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  trendCenter: { flex: 1, gap: 2 },
  trendName: { fontSize: 14, fontWeight: "700", color: Colors.textPrimary },
  trendCategory: { fontSize: 10, fontWeight: "600", color: Colors.textTertiary, letterSpacing: 0.5 },
  trendLabel: { fontSize: 12, marginTop: 2 },
  trendUp: { color: Colors.success },
  trendSteady: { color: Colors.textSecondary },
  trendDown: { color: Colors.textTertiary },
  sparkWrap: { alignItems: "flex-end", gap: 4 },
  updateFooter: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: "center",
    paddingVertical: 12,
  },

  discoverHeader: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
    paddingVertical: 12,
  },
  discoverCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 1px 3px rgba(28,27,24,0.06)" }
      : { shadowColor: "#1C1B18", shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 }),
  },
  discoverTop: { flexDirection: "row" },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  categoryPillFeatured: { backgroundColor: Colors.accent },
  categoryPillText: { fontSize: 10, fontWeight: "700", color: Colors.textSecondary, letterSpacing: 0.5 },
  categoryPillTextFeatured: { color: "#FFFFFF" },
  discoverName: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  discoverDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  discoverChips: { flexDirection: "row", gap: 6, marginTop: 4 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipGreen: { backgroundColor: Colors.successBg, borderColor: Colors.success },
  chipText: { fontSize: 12, color: Colors.textSecondary },
  chipTextGreen: { color: Colors.success, fontWeight: "600" },
});
