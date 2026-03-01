import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "loop_pulse_saved";

export interface SavedItem {
  id: string;
  name: string;
  category: string;
  type: string;
  meta: string;
}

interface SavedContextValue {
  savedItems: SavedItem[];
  saveItem: (item: SavedItem) => Promise<void>;
  unsaveItem: (id: string) => Promise<void>;
  isSaved: (id: string) => boolean;
  panelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
}

const SavedContext = createContext<SavedContextValue | null>(null);

export function SavedProvider({ children }: { children: ReactNode }) {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setSavedItems(JSON.parse(stored));
      } catch { }
    })();
  }, []);

  const persist = async (items: SavedItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch { }
  };

  const saveItem = async (item: SavedItem) => {
    setSavedItems((prev) => {
      if (prev.find((x) => x.id === item.id)) return prev;
      const next = [...prev, item];
      persist(next);
      return next;
    });
  };

  const unsaveItem = async (id: string) => {
    setSavedItems((prev) => {
      const next = prev.filter((x) => x.id !== id);
      persist(next);
      return next;
    });
  };

  const isSaved = (id: string) => savedItems.some((x) => x.id === id);

  const value = useMemo(
    () => ({ savedItems, saveItem, unsaveItem, isSaved, panelOpen, openPanel: () => setPanelOpen(true), closePanel: () => setPanelOpen(false) }),
    [savedItems, panelOpen]
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSaved must be used within SavedProvider");
  return ctx;
}
