export const FLAGS = {
  USE_MOCK_DATA: true,
  USE_REAL_CHAT: true,
  USE_REAL_MAP: false,
  SHOW_EMERGENCY: true,
  SHOW_REPORTS: true,
} as const;

export const BACKEND_URL = "https://loop-pulse.vercel.app";

export const AZURE_MAPS_KEY = process.env.AZURE_MAPS_KEY || "demo-key";

export const MOCK_SCORE = {
  score: 74,
  weather: { temp: "34°F", feelsLike: "27°F", condition: "Overcast" },
  safety: { score: 88, incidents: 2, recommendation: "Safe to walk" },
  events: 4,
  transit: { status: "All lines running normally", alerts: [] as string[] },
  air: { aqi: 37, category: "Good" },
};

export const MOCK_FEED = [
  {
    id: "1",
    type: "event",
    title: "Three Top Lounge",
    description: "Fess Grandiose · Live Tonight · 8:30PM",
    meta: "0.6 mi",
    tag: "Live Music",
  },
  {
    id: "2",
    type: "food",
    title: "Intelligentsia Coffee",
    description: "Coffee · $ · No wait right now",
    meta: "0.1 mi",
    tag: "Food",
  },
  {
    id: "3",
    type: "safety",
    title: "All clear nearby",
    description: "0 incidents in last 6 hours",
    meta: "800m radius",
    tag: "Safety",
  },
  {
    id: "4",
    type: "event",
    title: "Chicago Cultural Center",
    description: "Free admission · Open until 8PM",
    meta: "0.2 mi",
    tag: "Free",
  },
];

export const MOCK_REPORTS = [
  {
    id: "r1",
    severity: "medium" as const,
    description: "Traffic blocked on State St",
    time: "Just now",
  },
  {
    id: "r2",
    severity: "low" as const,
    description: "Noise complaint near DePaul",
    time: "12 min ago",
  },
  {
    id: "r3",
    severity: "high" as const,
    description: "Fire alarm on Wabash",
    time: "18 min ago",
  },
];
