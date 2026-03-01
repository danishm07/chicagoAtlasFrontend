import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { ProfileProvider } from "@/context/profile";
import { ThemeProvider } from "@/context/theme";
import { SavedProvider } from "@/context/saved";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="splash" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="settings" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="onboarding/step1" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="onboarding/step1b" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="onboarding/step2" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="onboarding/step3" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="onboarding/step4" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ProfileProvider>
          <ThemeProvider>
            <SavedProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </SavedProvider>
          </ThemeProvider>
        </ProfileProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
