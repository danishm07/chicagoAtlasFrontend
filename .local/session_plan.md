# Objective
Fix 5 quality issues across the app:
1. step1b CTA button width misaligned
2. GPS option removed from step3 location picker — restore as default
3. Chat transition jarring + input bar cut off by tab bar
4. Signals widget icons are colorful emoji — replace with monochrome Ionicons
5. Culture Discover refresh only updates the featured banner — make it refresh all 4 cards

---

# Tasks

### T001: Fix step1b CTA button alignment
- **Blocked By**: []
- **Details**:
  - File: `app/onboarding/step1b.tsx` line 123
  - Current: `<Pressable onPress={handleContinue}>` — Pressable has no width, shrinks to content
  - Fix: Add `style={{ width: "100%" }}` to that Pressable (exactly as step3.tsx line 95 does)
  - Acceptance: Continue button is full width, identical to every other onboarding step

### T002: Restore GPS as default in step3 location picker
- **Blocked By**: []
- **Details**:
  - File: `app/onboarding/step3.tsx`
  - Add a dedicated GPS card at the **top** of the list (above the 9 Chicago sides)
  - GPS card layout: pulsing coral dot (Animated.loop scale) + "Use my GPS" bold label + "Detect my neighborhood automatically" sub-text
  - Change `useState("")` → `useState("gps")` so GPS is pre-selected on arrival
  - GPS card gets the same selected styling (coral border, light pink bg) as any other card
  - Continue button is immediately enabled since GPS is the default
  - Passes `homeZone: "gps"` downstream — already handled in ZONE_LABEL_MAP → "My Location"
  - Acceptance: GPS option at top, pre-selected, Continue active immediately, pulsing dot visible

### T003: Fix Ask tab — input bar cutoff + smooth transition
- **Blocked By**: []
- **Details**:
  - File: `app/(tabs)/index.tsx`
  - **Fix 1 — input bar cutoff**: Change `bottomPad = Platform.OS === "web" ? 34 : insets.bottom` to `Platform.OS === "web" ? 84 : insets.bottom + 80` (matches signals.tsx and culture.tsx)
  - **Fix 2 — jarring transition**: Currently the pinned input bar is `{hasStarted && <KeyboardAvoidingView>...}` — it pops in instantly when `hasStarted` flips. Instead:
    - Add `inputBarOpacity = useRef(new Animated.Value(0)).current`
    - Always render the pinned input (remove the `{hasStarted && ...}` conditional)
    - Use `style={{ pointerEvents: hasStarted ? "auto" : "none" }}` on the outer container
    - On first send, animate `inputBarOpacity` 0→1 over 250ms in parallel with the empty state fade-out
    - Wrap the inputBar View in `<Animated.View style={{ opacity: inputBarOpacity }}>`
  - Acceptance: No layout pop on first message; input bar clears the tab bar on web and native

### T004: Replace Signals widget emoji icons with monochrome Ionicons
- **Blocked By**: []
- **Details**:
  - File: `app/(tabs)/signals.tsx`
  - In `WIDGETS` array, rename `icon` field values from emoji to Ionicons names:
    - safety `"🛡️"` → `"shield-outline"`
    - transit `"🚇"` → `"train-outline"`
    - air `"🌿"` → `"leaf-outline"`
    - weather `"☀️"` → `"partly-sunny-outline"`
    - crowds `"👥"` → `"people-outline"`
    - events `"🎟️"` → `"calendar-outline"`
    - reports `"⚠️"` → `"alert-circle-outline"`
  - In the widget card render: replace `<Text style={styles.widgetIcon}>{widget.icon}</Text>` → `<Ionicons name={widget.icon as any} size={22} color={C.textPrimary} />`
  - In `SlotPicker`: replace `<Text style={styles.slotIcon}>{current.icon}</Text>` → `<Ionicons name={current.icon as any} size={26} color={C.textPrimary} />`
  - Remove the `widgetIcon` and `slotIcon` text styles from StyleSheet
  - Acceptance: All widget icons and slot picker icons are clean, monochrome, line-style icons

### T005: Culture Discover refresh rotates all cards
- **Blocked By**: []
- **Details**:
  - File: `app/(tabs)/culture.tsx`
  - Add `discoverVersion` state (0, 1, 2) alongside `cycleIdx`
  - Create `DISCOVER_SETS: typeof DISCOVER[][]` — 3 full arrays of 4 cards, same venues but different descriptions/status reflecting different moments in time:
    - Set 0 (current): existing descriptions
    - Set 1: "20 min wait", "last day of exhibit", "happy hour ending soon", "doors open at 8"
    - Set 2: "no wait now", "sold out tomorrow", "mellow tonight", "late set at 11PM"
  - The rendered cards use `DISCOVER_SETS[discoverVersion]` instead of the static `DISCOVER`
  - The ↻ button handler: advance both `cycleIdx` and `discoverVersion` (each mod their array length)
  - Acceptance: Tapping ↻ visibly changes ALL 4 discover card descriptions simultaneously
