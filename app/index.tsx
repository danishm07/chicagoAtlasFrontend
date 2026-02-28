import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useProfile } from "@/context/profile";
import Colors from "@/constants/colors";

export default function IndexGate() {
  const { profile, isLoading } = useProfile();

  useEffect(() => {
    if (isLoading) return;
    if (profile && profile.onboardedAt) {
      router.replace("/(tabs)");
    } else {
      router.replace("/onboarding/step1");
    }
  }, [isLoading, profile]);

  return (
    <View style={styles.root}>
      <ActivityIndicator color={Colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
