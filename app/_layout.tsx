import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { ProfileProvider, useProfile } from "@/context/profile";
import {
  DM_Sans_400Regular,
  DM_Sans_500Medium,
  DM_Sans_600SemiBold,
  DM_Sans_700Bold,
  useFonts as useDMSans,
} from "@expo-google-fonts/dm-sans";
import {
  DM_Mono_400Regular,
  DM_Mono_500Medium,
  useFonts as useDMMono,
} from "@expo-google-fonts/dm-mono";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { profile, isLoading } = useProfile();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
      if (profile && profile.onboardedAt) {
        router.replace("/home");
      } else {
        router.replace("/onboarding/step1");
      }
    }
  }, [isLoading, profile]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="onboarding/step1" />
      <Stack.Screen name="onboarding/step2" />
      <Stack.Screen name="home" />
    </Stack>
  );
}

export default function RootLayout() {
  const [dmSansLoaded] = useDMSans({
    DM_Sans_400Regular,
    DM_Sans_500Medium,
    DM_Sans_600SemiBold,
    DM_Sans_700Bold,
  });

  const [dmMonoLoaded] = useDMMono({
    DM_Mono_400Regular,
    DM_Mono_500Medium,
  });

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
