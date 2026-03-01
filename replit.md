# Chicago Pulse

A mobile PWA built with Expo Router (React Native), Express backend, and AsyncStorage for local persistence. Built for DemonHacks 2026.

## Architecture

- **Frontend**: Expo Router (file-based routing), React Native Web for browser
- **Backend**: Express on port 5000 (serves landing page + API)
- **Frontend dev server**: Expo Metro on port 8081
- **State**: AsyncStorage via ProfileContext + ThemeContext, React Query for server data

## Design System

### Light Mode (default)
- Background: `#F7F6F3` | Surface: `#FFFFFF` | Border: `#E8E5DF`
- Text: `#1C1B18` (primary), `#7C7870` (secondary), `#B5B0A7` (tertiary)

### Dark Mode
- Background: `#0F0F0F` | Surface: `#1A1A1A` | Border: `#2A2A2A`
- Text: `#F7F6F3` (primary), `#7C7870` (secondary), `#4A4A4A` (tertiary)

### Shared Tokens
- Accent (coral): `#E8533A` | Success: `#16A34A` | Danger: `#C8303A`
- Fonts: System default (San Francisco on iOS, system font on web/Android)
- Card radius: 16px | Pills: 24px

## File Structure

```
app/
  _layout.tsx              # Root layout: providers (Query, Profile, Theme), Stack nav
  index.tsx                # Routing gate: checks profile → splash or tabs
  splash.tsx               # Screen 0: dark splash with "Get Started" CTA
  settings.tsx             # Full settings screen (push from any tab)
  onboarding/
    step1.tsx              # Who are you? Name + persona pills (max 2)
    step1b.tsx             # Which school? (only if Student selected)
    step2.tsx              # Interests: multi-select pills (max 3)
    step3.tsx              # Where are you based? Zone selection
    step4.tsx              # Safety + emergency contact + train alerts → saves profile
  (tabs)/
    _layout.tsx            # Tab bar: Ask / Signals / Culture
    index.tsx              # Ask tab — Harold chat (streaming-ready, mock by default)
    signals.tsx            # Signals tab — widget cards, map placeholder, bottom drawer
    culture.tsx            # Culture tab — Trending/Discover segmented sections

context/
  profile.tsx              # ProfileProvider + useProfile hook
  theme.tsx                # ThemeProvider + useTheme hook (persists to AsyncStorage)

constants/
  colors.ts                # Light + Dark color tokens (Colors, DarkColors)
  config.ts                # Feature flags, BACKEND_URL, mock data (MOCK_SCORE, MOCK_FEED, MOCK_REPORTS)

server/
  index.ts                 # Express setup, CORS, static serving
  routes.ts                # API routes
  storage.ts               # DB helpers
```

## Profile Shape (AsyncStorage key: `chicago_pulse_profile`)

```json
{
  "name": "string",
  "personas": ["student", "commuter", "local", "visitor"],
  "university": "depaul | iit | columbia | roosevelt | uic | other | \"\"",
  "sportsNotifications": false,
  "interests": ["food", "events", "sports", "live_music", "outdoor", "hidden_gems", "transit", "arts"],
  "homeZone": "north_side | near_campus | loop | south_side | west_side | gps",
  "currentZone": "string",
  "safetyAlerts": false,
  "emergencyContact": { "name": "string", "phone": "string" } | null,
  "trainAlerts": false,
  "onboardedAt": "ISO string"
}
```

## Zone Label Map (ZONE_LABELS)

```
north_side → "North Side"
near_campus → "Near Campus"
loop → "The Loop"
south_side → "South Side"
west_side → "West Side"
gps → "My Location"
```

## Feature Flags (constants/config.ts)

- `USE_MOCK_DATA: true` — all data uses MOCK_SCORE/MOCK_FEED/MOCK_REPORTS
- `USE_REAL_CHAT: false` — flip to use streaming POST /api/chat (BACKEND_URL)
- `USE_REAL_MAP: false` — flip to use Azure Maps (currently shows placeholder)
- `SHOW_EMERGENCY: true` — emergency contact button in Signals drawer
- `SHOW_REPORTS: true` — report-an-incident in Signals drawer
- `BACKEND_URL = 'https://chicago-pulse.vercel.app'` — update when deployed

## Onboarding Flow

1. App loads → `app/index.tsx` checks AsyncStorage
2. No profile → `/splash` (dark screen, "Get Started →")
3. Splash → `/onboarding/step1` (persona + name)
4. If Student → `/onboarding/step1b` (university + sports toggle)
5. → `/onboarding/step2` (interests, max 3)
6. → `/onboarding/step3` (home zone)
7. → `/onboarding/step4` (safety/emergency/train → saves profile → tabs)

## AI Chat (Harold)

- Mock mode: keyword-matching responses covering safety, food, transit, crowds, events, coffee, weather
- Real mode (USE_REAL_CHAT=true): streams from POST /api/chat with history + profile
- Quick prompts personalized by persona (student/commuter/local/visitor)
- Source chips appear below every Harold message

## Known Warnings (non-blocking)

- `shadow*` style props deprecated on web → use `boxShadow`
- `useNativeDriver` not supported on web → JS animation fallback
- `props.pointerEvents` deprecated → internal React Native web warning
