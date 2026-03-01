import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors, { DarkColors, VividColors, ColorTheme } from "@/constants/colors";

const DARK_KEY = "loop_pulse_darkmode";
const VIVID_KEY = "loop_pulse_vividmode";

interface ThemeContextValue {
  isDark: boolean;
  isVivid: boolean;
  toggle: () => void;
  toggleDark: () => void;
  toggleVivid: () => void;
  colors: ColorTheme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [isVivid, setIsVivid] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const dark = await AsyncStorage.getItem(DARK_KEY);
        const vivid = await AsyncStorage.getItem(VIVID_KEY);
        if (vivid === "true") { setIsVivid(true); setIsDark(false); }
        else if (dark === "true") { setIsDark(true); setIsVivid(false); }
      } catch { }
    })();
  }, []);

  const toggleDark = async () => {
    const next = !isDark;
    setIsDark(next);
    if (next) setIsVivid(false);
    try {
      await AsyncStorage.setItem(DARK_KEY, next ? "true" : "false");
      if (next) await AsyncStorage.setItem(VIVID_KEY, "false");
    } catch { }
  };

  const toggleVivid = async () => {
    const next = !isVivid;
    setIsVivid(next);
    if (next) setIsDark(false);
    try {
      await AsyncStorage.setItem(VIVID_KEY, next ? "true" : "false");
      if (next) await AsyncStorage.setItem(DARK_KEY, "false");
    } catch { }
  };

  const colors: ColorTheme = isVivid ? VividColors : isDark ? DarkColors : Colors;

  const value = useMemo(
    () => ({ isDark, isVivid, toggle: toggleDark, toggleDark, toggleVivid, colors }),
    [isDark, isVivid]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function useColors() {
  return useTheme().colors;
}
