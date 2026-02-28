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
import { Feather, MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useProfile } from "@/context/profile";

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  role: "user" | "ai" | "typing";
  text: string;
  sources?: string[];
  timestamp: Date;
};

// ─── Mock response logic ──────────────────────────────────────────────────────

function getMockResponse(input: string): { text: string; sources: string[] } {
  const q = input.toLowerCase();

  if (q.includes("safe") || q.includes("walk")) {
    return {
      text: "Current safety snapshot for DePaul Loop:\n\n🟢 No active incidents within 0.5 mi\n🟡 Wabash Ave has moderate foot traffic\n🟢 CTA Red Line running normally\n\nOverall: Safe to walk right now. Post-game traffic after 9 PM on Wabash.",
      sources: ["Chicago 311", "CTA Alerts", "CPD Feed"],
    };
  }
  if (q.includes("food") || q.includes("eat") || q.includes("cheap") || q.includes("hungry")) {
    return {
      text: "Best spots near DePaul Loop right now:\n\n🍜 Eleven City Diner — 10 min wait, burgers from $13\n☕ Intelligentsia Coffee — No wait, open late\n🍱 Wow Bao — No wait, everything under $10\n\nAll within a 5 min walk.",
      sources: ["Yelp Fusion", "Google Maps"],
    };
  }
  if (q.includes("busy") || q.includes("crowd") || q.includes("crowd")) {
    return {
      text: "Loop Density Report — right now:\n\n📍 Millennium Park: 3× normal traffic\n📍 State St: Moderate\n📍 DePaul Loop Campus area: Normal\n\nLoop Health Score: 87/100 — Moderately Busy. Best time to move: after 8 PM.",
      sources: ["Chicago 311", "Google Density", "CTA Alerts"],
    };
  }
  if (q.includes("event") || q.includes("do") || q.includes("tonight") || q.includes("under")) {
    return {
      text: "Here's what I'd do right now:\n\n🍜 Eleven City Diner — 10 min wait (shorter than usual). Burgers from $13.\n🎭 Chicago Cultural Center — free admission, great current exhibit, 0.1 mi away.\n🏀 DePaul vs Marquette tonight at 7PM — student rush $18 at the door.\n\nAll within a 12 min walk from DePaul Loop campus.",
      sources: ["Yelp Fusion", "Ticketmaster", "Chicago 311"],
    };
  }
  if (q.includes("coffee") || q.includes("cafe")) {
    return {
      text: "Best coffee near you right now:\n\n☕ Intelligentsia Coffee — No wait, 0.1 mi\n🟢 Open until 9 PM\n\nBest seat in the house is by the window on the second floor. Usually not crowded on weekday evenings.",
      sources: ["Yelp Fusion", "Google Maps"],
    };
  }
  return {
    text: "Here's your Loop snapshot right now:\n\n📊 Health Score: 87/100 — Moderately Busy\n🎭 4 events happening tonight\n🍽️ 38 spots open nearby\n🌿 AQI: 52 — Good\n\nAnything specific you want to dig into?",
    sources: ["Chicago 311", "Yelp Fusion", "CTA Alerts"],
  };
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

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
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, []);

  const dotStyle = (dot: Animated.Value) => ({
    opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [
      {
        translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }),
      },
    ],
  });

  return (
    <View style={styles.aiBubbleRow}>
      <View style={styles.aiBubble}>
        <View style={styles.typingDots}>
          <Animated.View style={[styles.typingDot, dotStyle(dot1)]} />
          <Animated.View style={[styles.typingDot, dotStyle(dot2)]} />
          <Animated.View style={[styles.typingDot, dotStyle(dot3)]} />
        </View>
      </View>
    </View>
  );
}

// ─── Live Dot ─────────────────────────────────────────────────────────────────

function LiveDot() {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.5, duration: 700, useNativeDriver: true }),
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

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const timeStr = msg.timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

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

// ─── Quick Chips ──────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  "What to do under $20?",
  "Is it safe to walk right now?",
  "Best coffee nearby?",
  "How busy is the Loop?",
  "Any free events today?",
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

const makeId = () =>
  Date.now().toString() + Math.random().toString(36).substr(2, 6);

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const displayName = profile?.name || "there";
  const zone = profile?.homeZone
    ? profile.homeZone.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : "The Loop";
  const persona = profile?.personas?.[0] || "Visitor";

  // Newest-first for inverted FlatList
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "3",
      role: "ai",
      text: `Here's what I'd do right now:\n\n🍜 Eleven City Diner — 10 min wait (shorter than usual). Burgers from $13.\n🎭 Chicago Cultural Center — free admission, great current exhibit, 0.1 mi away.\n🏀 DePaul vs Marquette tonight at 7PM — student rush $18 at the door.\n\nAll within a 12 min walk from DePaul Loop campus.`,
      sources: ["Yelp Fusion", "Ticketmaster", "Chicago 311"],
      timestamp: new Date(Date.now() - 60000),
    },
    {
      id: "2",
      role: "user",
      text: "what should i do near depaul for 2 hours under $20",
      sources: [],
      timestamp: new Date(Date.now() - 120000),
    },
    {
      id: "1",
      role: "ai",
      text: `Hey ${displayName} 👋 I'm plugged into live Loop data. What do you want to know about the Loop right now?`,
      sources: ["Chicago 311", "Yelp", "CTA Alerts"],
      timestamp: new Date(Date.now() - 180000),
    },
  ]);

  // Use ref to avoid stale closure in async send
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const handleSend = useCallback(
    (text?: string) => {
      const msg = (text ?? input).trim();
      if (!msg || isSending) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setInput("");
      setIsSending(true);

      const userMsg: Message = {
        id: makeId(),
        role: "user",
        text: msg,
        timestamp: new Date(),
      };

      // Add user message + typing indicator (newest first)
      const typingMsg: Message = {
        id: "typing",
        role: "typing",
        text: "",
        timestamp: new Date(),
      };

      setMessages((prev) => [typingMsg, userMsg, ...prev]);

      // TODO: Replace mock responses with POST /api/chat
      // Body: { message, history, persona, university, currentZone, savedItems }
      // Response: streaming text from Groq Llama 3.3 70B
      // System prompt injects all live Chicago data as context
      setTimeout(() => {
        const { text: responseText, sources } = getMockResponse(msg);
        const aiMsg: Message = {
          id: makeId(),
          role: "ai",
          text: responseText,
          sources,
          timestamp: new Date(),
        };

        setMessages((prev) =>
          [aiMsg, ...prev.filter((m) => m.id !== "typing")]
        );
        setIsSending(false);
        inputRef.current?.focus();
      }, 1500);
    },
    [input, isSending]
  );

  const keyboardOffset = Platform.OS === "web" ? 0 : 0;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: topPad }]}
      behavior="padding"
      keyboardVerticalOffset={keyboardOffset}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerAvatar}>
          <MaterialIcons name="diamond" size={20} color={Colors.accent} />
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Pulse AI</Text>
          <View style={styles.headerStatusRow}>
            <LiveDot />
            <Text style={styles.headerStatus}>Live Chicago data active</Text>
          </View>
        </View>
      </View>

      {/* ── Context pill ── */}
      <View style={styles.contextRow}>
        <View style={styles.contextPill}>
          <Feather name="map-pin" size={10} color={Colors.textTertiary} />
          <Text style={styles.contextText}>
            {zone} · {persona} · 5 sources active
          </Text>
        </View>
      </View>

      {/* ── Messages ── */}
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

      {/* ── Quick prompts ── */}
      <View style={styles.quickArea}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickScroll}
          keyboardShouldPersistTaps="handled"
        >
          {QUICK_PROMPTS.map((qp) => (
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
              <Text
                style={[
                  styles.quickChipText,
                  { color: Colors.textSecondary },
                ]}
              >
                {qp}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* ── Input row ── */}
      <View style={[styles.inputRow, { paddingBottom: bottomPad + 8 }]}>
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          placeholder="Ask about the Loop right now..."
          placeholderTextColor={Colors.textTertiary}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
          blurOnSubmit={false}
          multiline={false}
          fontFamily="DMSans_400Regular"
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
          <Feather
            name="arrow-up"
            size={18}
            color={input.trim().length > 0 ? "#FFFFFF" : Colors.textTertiary}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.textPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, gap: 2 },
  headerTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 15,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  headerStatusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDotWrapper: {
    width: 10,
    height: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  liveDotRing: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
    opacity: 0.35,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  headerStatus: {
    fontFamily: "DMMono_400Regular",
    fontSize: 10,
    color: Colors.success,
    letterSpacing: 0.2,
  },

  // Context pill
  contextRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  contextPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F0EEE9",
    borderRadius: 20,
  },
  contextText: {
    fontFamily: "DMMono_400Regular",
    fontSize: 10,
    color: Colors.textTertiary,
    letterSpacing: 0.3,
  },

  // Messages
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  messageRow: { flexDirection: "row" },
  messageRowUser: { justifyContent: "flex-end" },
  messageRowAI: { justifyContent: "flex-start" },

  userBubble: {
    maxWidth: "78%",
    backgroundColor: Colors.textPrimary,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 14,
    gap: 4,
  },
  userText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: "#FFFFFF",
    lineHeight: 20,
  },

  aiGroup: { maxWidth: "80%", gap: 6 },
  aiBubbleRow: { flexDirection: "row", justifyContent: "flex-start" },
  aiBubble: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aiText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 22,
  },

  sourcesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  sourceChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#F0EEE9",
    borderRadius: 6,
  },
  sourceChipText: {
    fontFamily: "DMMono_400Regular",
    fontSize: 10,
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },

  timestamp: {
    fontFamily: "DMMono_400Regular",
    fontSize: 10,
    color: Colors.textTertiary,
  },
  timestampUser: { textAlign: "right" },
  timestampAI: { textAlign: "left" },

  // Typing indicator
  typingDots: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textTertiary,
  },

  // Quick chips
  quickArea: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: 10,
    backgroundColor: Colors.background,
  },
  quickScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  quickChipText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
  },

  // Input
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 10,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.background,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: Colors.textPrimary,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
});
