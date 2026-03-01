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
import Colors from "@/constants/colors";
import { useProfile } from "@/context/profile";
import { router } from "expo-router";
import { FLAGS, BACKEND_URL } from "@/constants/config";

const ZONE_LABELS: Record<string, string> = {
  north_side: "North Side",
  near_campus: "Near Campus",
  loop: "The Loop",
  south_side: "South Side",
  west_side: "West Side",
  gps: "My Location",
  north: "North Loop",
  depaul_loop: "DePaul Loop",
  west: "West Loop",
  south: "South Loop",
};

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
  student: [
    "What's happening near campus?",
    "Cheapest food open right now?",
    "Is it safe to walk tonight?",
    "Any free events today?",
  ],
  commuter: [
    "How's my commute looking?",
    "Any CTA delays right now?",
    "Quick lunch near me under $15?",
    "Is the Loop busy right now?",
  ],
  local: [
    "What's actually worth doing tonight?",
    "Any hidden gems open right now?",
    "What's trending in my neighborhood?",
    "Best bar with no wait right now?",
  ],
  visitor: [
    "What should I do in Chicago today?",
    "What's uniquely Chicago right now?",
    "Is it safe to explore tonight?",
    "Best neighborhood to walk around?",
  ],
};

const DEFAULT_PROMPTS = [
  "What's happening tonight?",
  "Is it safe to walk right now?",
  "Best coffee nearby?",
  "How's the CTA running?",
];

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      );
    const a1 = pulse(dot1, 0);
    const a2 = pulse(dot2, 200);
    const a3 = pulse(dot3, 400);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={styles.aiBubbleRow}>
      <View style={styles.aiBubble}>
        <View style={styles.typingDots}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View
              key={i}
              style={[
                styles.typingDot,
                {
                  opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
                  transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function LiveDot() {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.6, duration: 700, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={styles.liveDotWrapper}>
      <Animated.View style={[styles.liveDotRing, { transform: [{ scale }] }]} />
      <View style={styles.liveDot} />
    </View>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const timeStr = msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (msg.role === "typing") return <TypingIndicator />;

  return (
    <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAI]}>
      {isUser ? (
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{msg.text}</Text>
          <Text style={[styles.timestamp, styles.timestampUser]}>{timeStr}</Text>
        </View>
      ) : (
        <View style={styles.aiGroup}>
          <View style={styles.aiBubble}>
            <Text style={styles.aiText}>{msg.text}</Text>
          </View>
          {msg.sources && msg.sources.length > 0 && (
            <View style={styles.sourcesRow}>
              {msg.sources.map((src) => (
                <View key={src} style={styles.sourceChip}>
                  <Text style={styles.sourceChipText}>{src}</Text>
                </View>
              ))}
            </View>
          )}
          <Text style={[styles.timestamp, styles.timestampAI]}>{timeStr}</Text>
        </View>
      )}
    </View>
  );
}

const makeId = () => Date.now().toString() + Math.random().toString(36).substr(2, 6);

export default function AskScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 80;

  const displayName = profile?.name || "there";
  const zone = ZONE_LABELS[profile?.homeZone ?? ""] ?? "Chicago";
  const firstPersona = profile?.personas?.[0] ?? "visitor";
  const persona = firstPersona.charAt(0).toUpperCase() + firstPersona.slice(1);

  const quickPrompts = QUICK_PROMPTS_BY_PERSONA[firstPersona] ?? DEFAULT_PROMPTS;

  const openingMessage: Message = {
    id: "opening",
    role: "ai",
    text: `Hey ${displayName} 👋\nI'm plugged into live Chicago data right now — what do you want to know?`,
    sources: ["Chicago 311", "Yelp", "CTA", "Weather"],
    timestamp: new Date(Date.now() - 180000),
  };

  const [messages, setMessages] = useState<Message[]>([openingMessage]);
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const handleSend = useCallback(
    (text?: string) => {
      const msg = (text ?? input).trim();
      if (!msg || isSending) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setInput("");
      setIsSending(true);

      const userMsg: Message = { id: makeId(), role: "user", text: msg, timestamp: new Date() };
      const typingMsg: Message = { id: "typing", role: "typing", text: "", timestamp: new Date() };

      setMessages((prev) => [typingMsg, userMsg, ...prev]);

      if (FLAGS.USE_REAL_CHAT) {
        const history = messagesRef.current.slice(0, 6).map((m) => ({
          role: m.role === "ai" ? "assistant" : "user",
          content: m.text,
        }));
        let fullText = "";
        const aiMsgId = makeId();

        (async () => {
          try {
            const response = await fetch(BACKEND_URL + "/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: msg, history, profile }),
            });
            const reader = response.body!.getReader();
            const decoder = new TextDecoder();

            const streamingMsg: Message = {
              id: aiMsgId,
              role: "ai",
              text: "",
              sources: [],
              timestamp: new Date(),
            };
            setMessages((prev) => [streamingMsg, ...prev.filter((m) => m.id !== "typing")]);

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              fullText += decoder.decode(value);
              setMessages((prev) =>
                prev.map((m) => m.id === aiMsgId ? { ...m, text: fullText } : m)
              );
            }

            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId
                  ? { ...m, text: fullText, sources: ["Chicago 311", "Yelp", "CTA"] }
                  : m
              )
            );
          } catch {
            const errMsg: Message = {
              id: makeId(),
              role: "ai",
              text: "I couldn't reach live data right now. Try again in a moment.",
              sources: [],
              timestamp: new Date(),
            };
            setMessages((prev) => [errMsg, ...prev.filter((m) => m.id !== "typing" && m.id !== aiMsgId)]);
          } finally {
            setIsSending(false);
            inputRef.current?.focus();
          }
        })();
      } else {
        setTimeout(() => {
          const { text: responseText, sources } = getMockResponse(msg);
          const aiMsg: Message = { id: makeId(), role: "ai", text: responseText, sources, timestamp: new Date() };
          setMessages((prev) => [aiMsg, ...prev.filter((m) => m.id !== "typing")]);
          setIsSending(false);
          inputRef.current?.focus();
        }, 1400);
      }
    },
    [input, isSending, profile]
  );

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: topPad }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>H</Text>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Harold</Text>
            <View style={styles.headerStatusRow}>
              <LiveDot />
              <Text style={styles.headerStatus}>Connected to live Chicago data</Text>
            </View>
          </View>
        </View>
        <Pressable style={styles.settingsBtn} onPress={() => router.push("/settings")}>
          <Ionicons name="settings-outline" size={22} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.contextRow}>
        <View style={styles.contextPill}>
          <Text style={styles.contextText}>
            📍 {zone} · {persona} · 4 sources active
          </Text>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble msg={item} />}
        inverted
        contentContainerStyle={styles.messageList}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.quickArea}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickScroll}
          keyboardShouldPersistTaps="handled"
        >
          {quickPrompts.map((qp) => (
            <Pressable
              key={qp}
              style={({ pressed }) => [
                styles.quickChip,
                { backgroundColor: pressed ? "#FEF0ED" : Colors.surface },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleSend(qp);
              }}
            >
              <Text style={styles.quickChipText}>{qp}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={[styles.inputRow, { paddingBottom: bottomPad }]}>
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          placeholder="Ask Harold anything..."
          placeholderTextColor={Colors.textTertiary}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
          blurOnSubmit={false}
          multiline={false}
        />
        <Pressable
          style={({ pressed }) => [
            styles.sendBtn,
            {
              backgroundColor:
                input.trim().length > 0
                  ? pressed
                    ? Colors.accent
                    : Colors.textPrimary
                  : Colors.border,
            },
          ]}
          onPress={() => handleSend()}
          disabled={isSending}
        >
          <Ionicons
            name="arrow-up"
            size={18}
            color={input.trim().length > 0 ? "#FFFFFF" : Colors.textTertiary}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  headerCenter: { gap: 2 },
  headerTitle: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary, letterSpacing: -0.2 },
  headerStatusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDotWrapper: { width: 10, height: 10, alignItems: "center", justifyContent: "center" },
  liveDotRing: {
    position: "absolute",
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.success, opacity: 0.35,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  headerStatus: { fontSize: 10, color: Colors.success },
  settingsBtn: { padding: 6 },

  contextRow: { paddingHorizontal: 16, paddingVertical: 8, alignItems: "center" },
  contextPill: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: "#F0EEE9", borderRadius: 20,
  },
  contextText: { fontSize: 11, color: Colors.textTertiary },

  messageList: { paddingHorizontal: 16, paddingVertical: 8, gap: 12 },
  messageRow: { flexDirection: "row" },
  messageRowUser: { justifyContent: "flex-end" },
  messageRowAI: { justifyContent: "flex-start" },

  userBubble: {
    maxWidth: "78%",
    backgroundColor: Colors.textPrimary,
    borderRadius: 16, borderBottomRightRadius: 4,
    padding: 14, gap: 4,
  },
  userText: { fontSize: 14, color: "#FFFFFF", lineHeight: 20 },

  aiGroup: { maxWidth: "82%", gap: 6 },
  aiBubbleRow: { flexDirection: "row", justifyContent: "flex-start" },
  aiBubble: {
    backgroundColor: Colors.surface,
    borderRadius: 16, borderBottomLeftRadius: 4,
    padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  aiText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 22 },

  sourcesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  sourceChip: {
    paddingHorizontal: 8, paddingVertical: 4,
    backgroundColor: "#F0EEE9", borderRadius: 6,
  },
  sourceChipText: { fontSize: 10, color: Colors.textSecondary },

  timestamp: { fontSize: 10, color: Colors.textTertiary },
  timestampUser: { textAlign: "right" },
  timestampAI: { textAlign: "left" },

  typingDots: { flexDirection: "row", gap: 4, alignItems: "center", paddingHorizontal: 4, paddingVertical: 2 },
  typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.textTertiary },

  quickArea: {
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingVertical: 10, backgroundColor: Colors.background,
  },
  quickScroll: { paddingHorizontal: 16, gap: 8 },
  quickChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border,
  },
  quickChipText: { fontSize: 13, color: Colors.textSecondary },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 10,
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  textInput: {
    flex: 1, height: 44,
    backgroundColor: Colors.background,
    borderRadius: 22,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 16,
    fontSize: 14, color: Colors.textPrimary,
  },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
});
