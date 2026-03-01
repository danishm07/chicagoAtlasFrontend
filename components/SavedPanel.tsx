import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSaved } from "@/context/saved";
import { useColors } from "@/context/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PANEL_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 340);

interface SavedPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SavedPanel({ isOpen, onClose }: SavedPanelProps) {
  const { savedItems, unsaveItem } = useSaved();
  const C = useColors();
  const slideAnim = useRef(new Animated.Value(PANEL_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }),
        Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: PANEL_WIDTH, duration: 220, useNativeDriver: true }),
        Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isOpen ? "auto" : "none"}>
      <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.panel,
          { backgroundColor: C.surface, transform: [{ translateX: slideAnim }] },
        ]}
      >
        <View style={[styles.panelHeader, { borderBottomColor: C.border }]}>
          <Text style={[styles.panelTitle, { color: C.textPrimary }]}>Saved Places</Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="close" size={20} color={C.textSecondary} />
          </Pressable>
        </View>

        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {savedItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: C.textSecondary }]}>
                Nothing saved yet.{"\n"}Explore the Culture tab to find places.
              </Text>
            </View>
          ) : (
            savedItems.map((item) => (
              <View key={item.id} style={[styles.row, { borderBottomColor: C.border }]}>
                <View style={styles.rowIconWrap}>
                  <Text style={styles.rowIcon}>📍</Text>
                </View>
                <View style={styles.rowInfo}>
                  <Text style={[styles.rowName, { color: C.textPrimary }]}>{item.name}</Text>
                  <Text style={[styles.rowCat, { color: C.textSecondary }]}>{item.category}</Text>
                </View>
                <Pressable
                  onPress={() => unsaveItem(item.id)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                >
                  <Ionicons name="bookmark" size={20} color="#E8533A" />
                </Pressable>
              </View>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  panel: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: PANEL_WIDTH,
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  panelTitle: { fontSize: 18, fontWeight: "700", letterSpacing: -0.3 },
  closeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  list: { flex: 1 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyText: { fontSize: 14, lineHeight: 22, textAlign: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FEF0ED",
    alignItems: "center",
    justifyContent: "center",
  },
  rowIcon: { fontSize: 18 },
  rowInfo: { flex: 1, gap: 2 },
  rowName: { fontSize: 14, fontWeight: "600" },
  rowCat: { fontSize: 12 },
});
