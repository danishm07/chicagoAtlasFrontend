import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useColors, useTheme } from "@/context/theme";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "bubble.left", selected: "bubble.left.fill" }} />
        <Label>Ask</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="signals">
        <Icon sf={{ default: "antenna.radiowaves.left.and.right", selected: "antenna.radiowaves.left.and.right" }} />
        <Label>Signals</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="culture">
        <Icon sf={{ default: "flame", selected: "flame.fill" }} />
        <Label>Culture</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const C = useColors();
  const { isDark, isVivid } = useTheme();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const isDim = isDark || isVivid;
  const blurTint = isDim ? "dark" : "light";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.textTertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: -2,
        },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : C.background,
          borderTopWidth: 1,
          borderTopColor: C.border,
          elevation: 0,
          height: isWeb ? 84 : 72,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={80} tint={blurTint} style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: C.background }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Ask",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="signals"
        options={{
          title: "Signals",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="radio-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="culture"
        options={{
          title: "Culture",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flame-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
