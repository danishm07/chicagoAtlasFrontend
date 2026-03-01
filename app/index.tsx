import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useProfile } from "@/context/profile";

export default function IndexGate() {
  const { profile, isLoading } = useProfile();

  useEffect(() => {
    if (isLoading) return;
    if (profile && profile.onboardedAt) {
      router.replace("/(tabs)");
    } else {
      router.replace("/splash");
    }
  }, [isLoading, profile]);

  return (
    <View style={styles.root}>
      <ActivityIndicator color="#E8533A" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0F0F0F",
    alignItems: "center",
    justifyContent: "center",
  },
});
