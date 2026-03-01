import React, { useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      router.replace("/onboarding/step1");
    });
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      <View style={[styles.content, { paddingTop: topPad, paddingBottom: bottomPad + 40 }]}>
        <View style={styles.top}>
          <View style={styles.iconCircle}>
            <Ionicons name="pulse" size={28} color="#FFFFFF" />
          </View>

          <Text style={styles.appName}>Chicago Atlas</Text>

          <View style={styles.taglineBlock}>
            <Text style={styles.tagline}>Know your city.</Text>
            <Text style={styles.tagline}>Find your culture.</Text>
          </View>
        </View>

        <Pressable onPress={handleGetStarted} style={styles.btnWrapper}>
          <Animated.View style={[styles.btn, { transform: [{ scale: btnScale }] }]}>
            <Text style={styles.btnText}>Get Started →</Text>
          </Animated.View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0F0F0F",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 32,
  },
  top: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#E8533A",
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.96,
  },
  taglineBlock: {
    alignItems: "center",
    gap: 4,
  },
  tagline: {
    fontSize: 18,
    color: "#7C7870",
    lineHeight: 28,
    textAlign: "center",
  },
  btnWrapper: {
    width: "80%",
  },
  btn: {
    backgroundColor: "#E8533A",
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
});
