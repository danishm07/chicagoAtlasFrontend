import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useProfile } from "@/context/profile";
import { useColors } from "@/context/theme";
import { useSaved } from "@/context/saved";
import { CHICAGO_SIDES, ZONE_LABEL_MAP } from "@/constants/colors";

interface SharedHeaderProps {
  onBookmarkPress?: () => void;
}

export default function SharedHeader({ onBookmarkPress }: SharedHeaderProps) {
  const { profile, updateProfile } = useProfile();
  const C = useColors();
  const { savedItems, openPanel } = useSaved();
  const [zonePickerOpen, setZonePickerOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const firstName = profile?.name?.split(" ")[0] ?? "";
  const zoneId = profile?.homeZone ?? "";
  const zoneLabel = ZONE_LABEL_MAP[zoneId] ?? "Chicago";

  const handleSelectZone = (id: string) => {
    updateProfile({ homeZone: id, currentZone: id });
    setZonePickerOpen(false);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: C.background }]}>
        <View style={styles.left}>
          {!!firstName && (
            <Text style={[styles.name, { color: C.textPrimary }]}>{firstName}</Text>
          )}
          <Pressable
            onPress={() => setZonePickerOpen(true)}
            style={({ pressed }) => [styles.locationPill, { backgroundColor: C.surface, borderColor: C.border, opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={styles.locationPin}>📍</Text>
            <Text style={[styles.locationText, { color: C.textSecondary }]}>{zoneLabel}</Text>
            <Ionicons name="chevron-down" size={12} color={C.textTertiary} />
          </Pressable>
        </View>

        <View style={styles.right}>
          <Pressable
            onPress={onBookmarkPress ?? openPanel}
            style={({ pressed }) => [styles.iconBtn, { backgroundColor: C.surface, borderColor: C.border, opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name={savedItems.length > 0 ? "bookmark" : "bookmark-outline"} size={18} color={savedItems.length > 0 ? "#E8533A" : C.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/settings")}
            style={({ pressed }) => [styles.iconBtn, { backgroundColor: C.surface, borderColor: C.border, opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="settings-outline" size={18} color={C.textSecondary} />
          </Pressable>
        </View>
      </View>

      <Modal
        visible={zonePickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setZonePickerOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setZonePickerOpen(false)} />
        <View style={[styles.pickerSheet, { backgroundColor: C.surface }]}>
          <View style={[styles.pickerHandle, { backgroundColor: C.border }]} />
          <Text style={[styles.pickerTitle, { color: C.textPrimary }]}>Your Chicago Side</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.pickerScroll}>
            {CHICAGO_SIDES.map((z) => {
              const selected = zoneId === z.id;
              return (
                <Pressable
                  key={z.id}
                  onPress={() => handleSelectZone(z.id)}
                  style={({ pressed }) => [
                    styles.pickerRow,
                    { borderColor: C.border, opacity: pressed ? 0.7 : 1 },
                    selected && { backgroundColor: "#FEF0ED", borderColor: "#E8533A" },
                  ]}
                >
                  <View style={[styles.dot, { backgroundColor: z.color }]} />
                  <Text style={[styles.pickerLabel, { color: selected ? "#E8533A" : C.textPrimary }]}>{z.label}</Text>
                  {selected && <Ionicons name="checkmark" size={16} color="#E8533A" />}
                </Pressable>
              );
            })}
            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  left: { flex: 1, gap: 6 },
  name: { fontSize: 28, fontWeight: "700", letterSpacing: -0.6, lineHeight: 32 },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  locationPin: { fontSize: 12 },
  locationText: { fontSize: 13, fontWeight: "500" },
  right: { flexDirection: "row", gap: 8, paddingBottom: 2 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  pickerSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: "70%",
  },
  pickerHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  pickerTitle: { fontSize: 17, fontWeight: "700", marginBottom: 16, letterSpacing: -0.3 },
  pickerScroll: {},
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  pickerLabel: { flex: 1, fontSize: 15, fontWeight: "500" },
});
