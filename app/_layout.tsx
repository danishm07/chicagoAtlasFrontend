import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { ProfileProvider } from "@/context/profile";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  useFonts as useDMSans,
} from "@expo-google-fonts/dm-sans";
import {
  DMMono_400Regular,
  DMMono_500Medium,
  useFonts as useDMMono,
} from "@expo-google-fonts/dm-mono";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding/step1" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="onboarding/step2" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="home" />
    </Stack>
  );
}

export default function RootLayout() {
  const [dmSansLoaded] = useDMSans({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  const [dmMonoLoaded] = useDMMono({
    DMMono_400Regular,
    DMMono_500Medium,
  });

  useEffect(() => {
    if (dmSansLoaded && dmMonoLoaded) {
      SplashScreen.hideAsync();
    }
  }, [dmSansLoaded, dmMonoLoaded]);

  if (!dmSansLoaded || !dmMonoLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ProfileProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <RootLayoutNav />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </ProfileProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
