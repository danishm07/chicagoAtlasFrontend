import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ScrollView,
  StyleSheet,
  Platform,
  Animated,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useProfile } from "@/context/profile";
import { useColors } from "@/context/theme";
import { useSaved } from "@/context/saved";
import { FLAGS, BACKEND_URL } from "@/constants/config";
import SharedHeader from "@/components/SharedHeader";
import SavedPanel from "@/components/SavedPanel";

type Message = {
  id: string;
  role: "user" | "ai" | "typing";
  text: string;
  sources?: string[];
  timestamp: Date;
};

function getMockResponse(input: string): { text: string; sources: string[] } {
  const q = input.toLowerCase();
  if (q.includes("safe") || q.includes("walk") || q.includes("danger")) {
    return {
      text: "Safety snapshot for your area:\n\n🟢 No active incidents within 0.5 mi\n🟡 Moderate foot traffic on State St\n🟢 CTA lines running normally\n\nOverall: Safe to walk right now.",
      sources: ["Chicago 311", "CTA Alerts", "CPD Feed"],
    };
  }
  if (q.includes("food") || q.includes("eat") || q.includes("hungry") || q.includes("lunch") || q.includes("dinner")) {
    return {
      text: "Best spots near you right now:\n\n🍜 Eleven City Diner — 10 min wait, burgers from $13\n☕ Intelligentsia Coffee — No wait, open late\n🍱 Wow Bao — No wait, everything under $10\n\nAll within a 5 min walk.",
      sources: ["Yelp Fusion", "Google Maps"],
    };
  }
  if (q.includes("commute") || q.includes("cta") || q.includes("train") || q.includes("delay")) {
    return {
      text: "CTA Status right now:\n\n🟢 Red Line — All clear\n🟢 Blue Line — On time\n🟡 Brown Line — 4 min delay at Belmont\n🟢 Green Line — Normal service\n\nNo major delays reported.",
      sources: ["CTA Alerts", "Transitapp"],
    };
  }
  if (q.includes("busy") || q.includes("crowd") || q.includes("loop")) {
    return {
      text: "Chicago Loop density report:\n\n📍 Millennium Park: 3× normal traffic\n📍 State St: Moderate\n📍 Michigan Ave: Busy\n\nBest time to move: after 8 PM.",
      sources: ["Chicago 311", "Google Density"],
    };
  }
  if (q.includes("event") || q.includes("tonight") || q.includes("do") || q.includes("free")) {
    return {
      text: "What I'd do tonight:\n\n🎭 Chicago Cultural Center — Free admission, closing exhibit\n🏀 United Center — Bulls game 7:30PM\n🎵 Andy's Jazz Club — Live set 9PM, $10 cover\n\nAll reachable by CTA in under 20 min.",
      sources: ["Ticketmaster", "Yelp Fusion", "Chicago 311"],
    };
  }
  if (q.includes("coffee") || q.includes("cafe")) {
    return {
      text: "Best coffee near you:\n\n☕ Intelligentsia Coffee — No wait, 0.1 mi\n🟢 Open until 9 PM\n\nSecond floor window seats are usually free on weekday evenings.",
      sources: ["Yelp Fusion", "Google Maps"],
    };
  }
  if (q.includes("weather") || q.includes("cold") || q.includes("rain") || q.includes("snow")) {
    return {
      text: "Chicago weather right now:\n\n🌤️ 34°F · Feels like 27°F\n☁️ Overcast, low chance of precipitation\n💨 Wind: 12 mph from the lake\n\nDress warm — it's a classic Chicago winter day.",
      sources: ["NWS Chicago", "Weather.gov"],
    };
  }
  return {
    text: "Here's your Chicago snapshot:\n\n📊 City activity: Moderate\n🎭 4 events happening tonight\n🍽️ 38 spots open nearby\n🚇 CTA: All lines normal\n🌿 AQI: 37 — Good\n\nWhat do you want to dig into?",
    sources: ["Chicago 311", "Yelp Fusion", "CTA Alerts", "Weather"],
  };
}

const QUICK_PROMPTS_BY_PERSONA: Record<string, string[]> = {
  student: ["What's happening near campus?", "Cheapest food open right now?", "Is it safe to walk tonight?", "Any free events today?"],
  commuter: ["CTA delays right now?", "Fastest route to the Loop?", "Is the Red Line running?", "Parking near downtown?"],
  local: ["What's buzzing tonight?", "Any crowd spikes nearby?", "Best new spots this week?", "Neighborhood safety update?"],
  visitor: ["Best things to do today?", "Chicago must-eats near me?", "Is Millennium Park busy?", "How do I use the CTA?"],
  default: ["What's happening tonight?", "Is it safe to walk?", "Best food nearby?", "CTA status?"],
};

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function SourceChip({ label }: { label: string }) {
  const C = useColors();
  return (
    <View style={[styles.sourceChip, { backgroundColor: C.surface, borderColor: C.border }]}>
      <Text style={[styles.sourceChipText, { color: C.textSecondary }]}>{label}</Text>
    </View>
  );
}

function TypingDots() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;
  const C = useColors();

  useEffect(() => {
    const anim = (d: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(d, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ])
      );
    const a1 = anim(dot1, 0);
    const a2 = anim(dot2, 150);
    const a3 = anim(dot3, 300);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={[styles.aiBubble, { backgroundColor: C.surface }]}>
      <View style={{ flexDirection: "row", gap: 5, paddingVertical: 4 }}>
        {[dot1, dot2, dot3].map((d, i) => (
          <Animated.View key={i} style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.textTertiary, opacity: d }} />
        ))}
      </View>
    </View>
  );
}

export default function AskTab() {
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const C = useColors();
  const { panelOpen, closePanel } = useSaved();

  const firstName = profile?.name?.split(" ")[0] ?? "there";
  const personas = profile?.personas ?? [];
  const primaryPersona = personas[0] ?? "default";
  const quickPrompts = QUICK_PROMPTS_BY_PERSONA[primaryPersona] ?? QUICK_PROMPTS_BY_PERSONA.default;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [emptyMounted, setEmptyMounted] = useState(true);

  const greetingOpacity = useRef(new Animated.Value(1)).current;
  const greetingY = useRef(new Animated.Value(0)).current;
  const chipsOpacity = useRef(new Animated.Value(1)).current;
  const chipsY = useRef(new Animated.Value(0)).current;
  const emptyOpacity = useRef(new Animated.Value(1)).current;

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (!hasStarted) {
        setHasStarted(true);
        Animated.parallel([
          Animated.timing(greetingOpacity, { toValue: 0, duration: 260, useNativeDriver: true }),
          Animated.timing(greetingY, { toValue: -48, duration: 300, useNativeDriver: true }),
          Animated.timing(chipsOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(chipsY, { toValue: 36, duration: 220, useNativeDriver: true }),
          Animated.timing(emptyOpacity, { toValue: 0, duration: 320, useNativeDriver: true }),
        ]).start(() => setEmptyMounted(false));
      }

      const userMsg: Message = { id: genId(), role: "user", text: trimmed, timestamp: new Date() };
      setMessages((prev) => [userMsg, ...prev]);
      setInputText("");
      setIsTyping(true);

      if (FLAGS.USE_REAL_CHAT) {
        try {
          const res = await fetch(`${BACKEND_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: trimmed, profile }),
          });
          const data = await res.json();
          setIsTyping(false);
          const aiMsg: Message = { id: genId(), role: "ai", text: data.response ?? data.message, sources: data.sources ?? [], timestamp: new Date() };
          setMessages((prev) => [aiMsg, ...prev]);
        } catch {
          setIsTyping(false);
          const errMsg: Message = { id: genId(), role: "ai", text: "Couldn't reach Chicago data right now. Try again.", sources: [], timestamp: new Date() };
          setMessages((prev) => [errMsg, ...prev]);
        }
      } else {
        await new Promise((r) => setTimeout(r, 900 + Math.random() * 700));
        setIsTyping(false);
        const { text: responseText, sources } = getMockResponse(trimmed);
        const aiMsg: Message = { id: genId(), role: "ai", text: responseText, sources, timestamp: new Date() };
        setMessages((prev) => [aiMsg, ...prev]);
      }
    },
    [hasStarted, profile]
  );

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.role === "typing") return <TypingDots />;
    if (item.role === "user") {
      return (
        <View style={styles.userRow}>
          <View style={styles.userBubble}>
            <Text style={styles.userBubbleText}>{item.text}</Text>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.aiRow}>
        <View style={[styles.aiBubble, { backgroundColor: C.surface }]}>
          <Text style={[styles.aiBubbleText, { color: C.textPrimary }]}>{item.text}</Text>
        </View>
        {item.sources && item.sources.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sourceRow} contentContainerStyle={{ gap: 6 }}>
            {item.sources.map((s) => <SourceChip key={s} label={s} />)}
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <SharedHeader />

      <View style={styles.mainArea}>
        {hasStarted && (
          <FlatList
            data={isTyping ? [{ id: "typing", role: "typing" as const, text: "", timestamp: new Date() }, ...messages] : messages}
            inverted
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={messages.length > 0}
          />
        )}

        {emptyMounted && (
          <Animated.View
            style={[styles.emptyOverlay, { opacity: emptyOpacity }]}
            pointerEvents={hasStarted ? "none" : "auto"}
          >
            <Animated.View
              style={[styles.greeting, { opacity: greetingOpacity, transform: [{ translateY: greetingY }] }]}
            >
              <Text style={[styles.greetingName, { color: C.textPrimary }]}>
                Hey {firstName}.
              </Text>
              <Text style={[styles.greetingSub, { color: C.textSecondary }]}>
                Ask me anything about Chicago.
              </Text>
            </Animated.View>

            <View style={[styles.emptyInputRow, { backgroundColor: C.surface, borderColor: C.border }]}>
              <TextInput
                style={[styles.emptyInput, { color: C.textPrimary }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask about Chicago..."
                placeholderTextColor={C.textTertiary}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={() => sendMessage(inputText)}
              />
              <Pressable
                onPress={() => sendMessage(inputText)}
                disabled={!inputText.trim()}
                style={({ pressed }) => [
                  styles.sendBtn,
                  { backgroundColor: inputText.trim() ? (pressed ? "#E8533A" : "#1C1B18") : C.border },
                ]}
              >
                <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
              </Pressable>
            </View>

            <Animated.View style={{ opacity: chipsOpacity, transform: [{ translateY: chipsY }], width: "100%" }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipScroll}
              >
                {quickPrompts.map((prompt) => (
                  <Pressable
                    key={prompt}
                    onPress={() => sendMessage(prompt)}
                    style={({ pressed }) => [styles.quickChip, { backgroundColor: C.background, borderColor: C.border, opacity: pressed ? 0.7 : 1 }]}
                  >
                    <Text style={[styles.quickChipText, { color: C.textSecondary }]}>{prompt}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>
          </Animated.View>
        )}
      </View>

      {hasStarted && (
        <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={0} style={{ backgroundColor: C.background }}>
          <View style={[styles.inputBar, { borderTopColor: C.border }]}>
            <TextInput
              style={[styles.input, { backgroundColor: C.surface, borderColor: C.border, color: C.textPrimary }]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about Chicago..."
              placeholderTextColor={C.textTertiary}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage(inputText)}
            />
            <Pressable
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim()}
              style={({ pressed }) => [
                styles.sendBtn,
                { backgroundColor: inputText.trim() ? (pressed ? "#E8533A" : "#1C1B18") : C.border },
              ]}
            >
              <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
          <View style={{ height: bottomPad + 16 }} />
        </KeyboardAvoidingView>
      )}

      <SavedPanel isOpen={panelOpen} onClose={closePanel} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  mainArea: { flex: 1, position: "relative" },

  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 60,
    gap: 20,
  },
  greeting: { alignItems: "center", gap: 8 },
  greetingName: { fontSize: 36, fontWeight: "700", letterSpacing: -0.8, textAlign: "center" },
  greetingSub: { fontSize: 17, textAlign: "center", lineHeight: 24 },

  emptyInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    width: "100%",
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  emptyInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    maxHeight: 120,
  },

  chipScroll: { gap: 8, paddingHorizontal: 0, paddingVertical: 2 },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  quickChipText: { fontSize: 13, fontWeight: "500" },

  messageList: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  userRow: { alignItems: "flex-end" },
  userBubble: {
    backgroundColor: "#1C1B18",
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "78%",
  },
  userBubbleText: { color: "#FFFFFF", fontSize: 15, lineHeight: 22 },
  aiRow: { alignItems: "flex-start", gap: 6 },
  aiBubble: {
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  aiBubbleText: { fontSize: 15, lineHeight: 22 },
  sourceRow: {},
  sourceChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  sourceChipText: { fontSize: 11, fontWeight: "500" },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
    lineHeight: 22,
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});
