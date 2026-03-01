import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "chicago_pulse_profile";

export interface LoopProfile {
  name: string;
  personas: string[];
  university?: string;
  sportsNotifications?: boolean;
  interests?: string[];
  homeZone: string;
  currentZone: string;
  safetyAlerts?: boolean;
  emergencyContact?: { name: string; phone: string } | null;
  trainAlerts?: boolean;
  onboardedAt: string;
  notifySafety?: boolean;
  notifyEvents?: boolean;
}

interface ProfileContextValue {
  profile: LoopProfile | null;
  isLoading: boolean;
  saveProfile: (profile: LoopProfile) => Promise<void>;
  updateProfile: (partial: Partial<LoopProfile>) => Promise<void>;
  clearProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<LoopProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setProfile(JSON.parse(stored));
        } else {
          const legacy = await AsyncStorage.getItem("loop_pulse_profile");
          if (legacy) {
            setProfile(JSON.parse(legacy));
          }
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const saveProfile = async (p: LoopProfile) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    setProfile(p);
  };

  const updateProfile = async (partial: Partial<LoopProfile>) => {
    const next = { ...(profile ?? ({} as LoopProfile)), ...partial };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setProfile(next as LoopProfile);
  };

  const clearProfile = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem("loop_pulse_profile");
    setProfile(null);
  };

  const value = useMemo(
    () => ({ profile, isLoading, saveProfile, updateProfile, clearProfile }),
    [profile, isLoading]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
