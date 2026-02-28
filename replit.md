# Loop Pulse

A mobile PWA built with Expo Router (React Native), Express backend, and AsyncStorage for local persistence.

## Architecture

- **Frontend**: Expo Router (file-based routing), React Native Web for browser
- **Backend**: Express on port 5000 (serves landing page + API)
- **Frontend dev server**: Expo Metro on port 8081
- **State**: AsyncStorage via ProfileContext, React Query for server data

## Design System

- Background: `#F7F6F3` | Surface: `#FFFFFF` | Border: `#E8E5DF`
- Text: `#1C1B18` (primary), `#7C7870` (secondary), `#B5B0A7` (tertiary)
- Accent (coral): `#E8533A` | Success: `#16A34A` | Danger: `#C8303A` | Warning: `#B8860B`
- DePaul blue: `#005596`
- Fonts: DM Sans (`DMSans_400Regular/500Medium/600SemiBold/700Bold`) + DM Mono (`DMMono_400Regular/500Medium`)
- Card radius: 16px | Hero: 24px | Pills: 20px
- All styles in `constants/colors.ts`

## File Structure

```
app/
  _layout.tsx              # Root layout: fonts, providers, Stack nav
  index.tsx                # Routing gate: checks profile → onboarding or tabs
  onboarding/
    step1.tsx              # Name, persona (max 2), interests (max 3)
    step2.tsx              # University, home zone → saves to AsyncStorage
  (tabs)/
    _layout.tsx            # Tab bar: Pulse / Feed / Chat (NativeTabs or classic)
    index.tsx              # Pulse home screen (full prompt 2 layout)
    feed.tsx               # Feed placeholder
    chat.tsx               # Chat placeholder

context/
  profile.tsx              # ProfileProvider + useProfile hook + AsyncStorage

constants/
  colors.ts                # Full design system color tokens

server/
  index.ts                 # Express setup, CORS, static serving
  routes.ts                # API routes (currently empty)
  storage.ts               # DB helpers
```

## Profile Shape (localStorage key: `loop_pulse_profile`)

```json
{
  "name": "string",
  "personas": ["Student", "Commuter"],
  "interests": ["Food & Drinks", "Events & Shows"],
  "university": "depaul | uic | iit | columbia | roosevelt | none",
  "homeZone": "north | depaul_loop | west | south | gps",
  "currentZone": "string",
  "onboardedAt": "ISO string"
}
```

## Onboarding Logic

- On app load: `app/index.tsx` checks AsyncStorage for `loop_pulse_profile`
- If `onboardedAt` is set → redirect to `/(tabs)` (home)
- Otherwise → redirect to `/onboarding/step1`

## Completed Prompts

- **Prompt 1**: Design system, onboarding steps 1 & 2, profile persistence, routing gate
- **Prompt 2**: Full home screen (hero ring, data grid, game card, trending, alerts, chat preview, alert banner), tab navigation (Pulse/Feed/Chat), UIC added to university list

## Known Warnings (non-blocking)

- `shadow*` style props deprecated on web → use `boxShadow` (harmless warning)
- `useNativeDriver` not supported on web → falls back to JS animations (normal)
- `props.pointerEvents` deprecated → internal React Native web warning
