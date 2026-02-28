# Loop Pulse — replit.md

## Overview

Loop Pulse is a mobile-first city lifestyle app targeting Chicago's Loop neighborhood. It helps users (students, commuters, residents, visitors) track local events, food, safety, and zone-specific activity. The app is built with Expo (React Native) and includes a lightweight Express backend. The core user flow is:

1. **Onboarding** — Collect name, personas, interests, university, and home zone (2 steps)
2. **Home** — Personalized feed based on the user's zone and interests

The app stores profile data locally via AsyncStorage and also has a PostgreSQL database available via Drizzle ORM for server-side persistence.

---

## User Preferences

Preferred communication style: Simple, everyday language.

---

## System Architecture

### Frontend (React Native / Expo)

- **Framework**: Expo SDK ~54 with `expo-router` for file-based navigation
- **Navigation**: Stack navigator defined in `app/_layout.tsx`. Routes include `/` (gate), `/onboarding/step1`, `/onboarding/step2`, and `/home`
- **State Management**: React Context (`context/profile.tsx`) wraps the app with `ProfileProvider`, exposing profile CRUD methods. TanStack React Query (`@tanstack/react-query`) is set up for server data fetching via `lib/query-client.ts`
- **Local Storage**: `@react-native-async-storage/async-storage` stores the user profile under the key `loop_pulse_profile`. The index screen reads this to decide whether to show onboarding or home
- **Fonts**: DM Sans (body) and DM Mono (labels/timestamps) loaded via `@expo-google-fonts`
- **UI Patterns**:
  - Design tokens centralized in `constants/colors.ts` (background `#F7F6F3`, accent `#E8533A` coral, surface `#FFFFFF`, etc.)
  - Animated pill buttons with haptic feedback (`expo-haptics`) for persona/interest/zone selection
  - `KeyboardAwareScrollViewCompat` wraps forms — uses `react-native-keyboard-controller` on native, plain `ScrollView` on web
  - `ErrorBoundary` + `ErrorFallback` for graceful crash recovery
  - `GestureHandlerRootView` + `KeyboardProvider` wrap the entire app

### Backend (Express)

- **Framework**: Express 5 running via `server/index.ts`
- **API Routes**: Defined in `server/routes.ts` — currently a placeholder; all routes should be prefixed with `/api`
- **Storage Layer**: `server/storage.ts` currently uses in-memory `MemStorage`. Designed around an `IStorage` interface for easy swap to database-backed storage
- **CORS**: Configured to allow Replit dev/deployment domains and localhost origins dynamically using environment variables (`REPLIT_DEV_DOMAIN`, `REPLIT_DOMAINS`)
- **Build**: Bundled with `esbuild` for production (`server_dist/`). Development uses `tsx` for hot reloading

### Database

- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: `shared/schema.ts` defines a `users` table with `id` (UUID), `username`, and `password`. Zod schemas auto-generated via `drizzle-zod`
- **Config**: `drizzle.config.ts` reads `DATABASE_URL` from environment
- **Migrations**: Output to `./migrations`, applied with `drizzle-kit push`
- **Note**: The current server storage layer (`MemStorage`) does NOT yet use Drizzle/Postgres. The database infrastructure is set up but the storage implementation needs to be wired in

### Routing / API Communication

- The mobile app communicates with the Express backend via `lib/query-client.ts`
- `EXPO_PUBLIC_DOMAIN` env var sets the API base URL (auto-set in dev via `REPLIT_DEV_DOMAIN`)
- `apiRequest()` utility handles fetch with JSON content-type and credential inclusion

### Onboarding Flow

- **Step 1** (`app/onboarding/step1.tsx`): Name input + persona multi-select (max 2) + interests multi-select (max 3). Passes data to step 2 via route params
- **Step 2** (`app/onboarding/step2.tsx`): University selection (5 options including DePaul with blue accent) + home zone selection. On completion, saves full profile via `ProfileProvider.saveProfile()` and navigates to `/home`
- **Gate** (`app/index.tsx`): Checks profile and `onboardedAt` field — routes to onboarding or home accordingly

---

## External Dependencies

| Dependency | Purpose |
|---|---|
| `expo-router` | File-based navigation for React Native |
| `@tanstack/react-query` | Server state fetching and caching |
| `@react-native-async-storage/async-storage` | Local profile persistence |
| `drizzle-orm` + `drizzle-zod` | PostgreSQL ORM + schema validation |
| `pg` | PostgreSQL client for Node.js |
| `express` | Backend HTTP server |
| `expo-haptics` | Tactile feedback on pill selection |
| `expo-image-picker` | Image selection (available, not yet used in visible screens) |
| `expo-location` | Location access (available, not yet used in visible screens) |
| `expo-linear-gradient` | Gradient UI elements |
| `react-native-reanimated` | Advanced animations |
| `react-native-gesture-handler` | Gesture support |
| `react-native-keyboard-controller` | Keyboard-aware scroll behavior on native |
| `react-native-safe-area-context` | Safe area insets across devices |
| `@expo-google-fonts/dm-sans` + `dm-mono` | Custom fonts |
| `@expo/vector-icons` (Feather, MaterialIcons) | Icon sets |
| `http-proxy-middleware` | Dev proxy for Replit environment |

### Environment Variables Required

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string for Drizzle |
| `EXPO_PUBLIC_DOMAIN` | API base URL used by the mobile app |
| `REPLIT_DEV_DOMAIN` | Auto-set by Replit for CORS and proxy config |
| `REPLIT_DOMAINS` | Comma-separated production domains for CORS |
| `REPLIT_INTERNAL_APP_DOMAIN` | Used in build scripts for deployment domain detection |