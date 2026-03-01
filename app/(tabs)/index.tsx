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
  student: ["What should I do tonight?", "Is it safe to walk to the Blue Line?", "Cheapest food open near me", "What's worth going to this week?"],
  commuter: ["What should I do tonight?", "Is it safe to walk to the Blue Line?", "Cheapest food open near me", "What's worth going to this week?"],
  local: ["What should I do tonight?", "Is it safe to walk to the Blue Line?", "Cheapest food open near me", "What's worth going to this week?"],
  visitor: ["What should I do tonight?", "Is it safe to walk to the Blue Line?", "Cheapest food open near me", "What's worth going to this week?"],
  default: ["What should I do tonight?", "Is it safe to walk to the Blue Line?", "Cheapest food open near me", "What's worth going to this week?"],
};

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Source label mapping with icons
function getSourceInfo(source: string): { label: string; icon: string } {
  const s = source.toLowerCase();
  if (s.includes("yelp") || s.includes("spots") || s.includes("google maps")) {
    return { label: "Yelp", icon: "🟡" };
  }
  if (s.includes("ticketmaster") || s.includes("events")) {
    return { label: "Events", icon: "🔵" };
  }
  if (s.includes("safety") || s.includes("crimes") || s.includes("cpd") || s.includes("311")) {
    return { label: "Safety", icon: "🔴" };
  }
  if (s.includes("cta") || s.includes("transit") || s.includes("transitapp")) {
    return { label: "Transit", icon: "🟢" };
  }
  if (s.includes("weather") || s.includes("nws")) {
    return { label: "Weather", icon: "⚪" };
  }
  if (s.includes("air") || s.includes("aqi")) {
    return { label: "Air", icon: "🟢" };
  }
  if (s.includes("perplexity") || s.includes("discovery")) {
    return { label: "Discovery", icon: "🟣" };
  }
  return { label: source, icon: "⚪" };
}

function SourceChip({ label }: { label: string }) {
  const { icon, label: cleanLabel } = getSourceInfo(label);
  return (
    <View style={styles.sourceChip}>
      <Text style={styles.sourceChipIcon}>{icon}</Text>
      <Text style={styles.sourceChipText}>{cleanLabel}</Text>
    </View>
  );
}

// Harold avatar component
function HaroldAvatar() {
  return (
    <View style={styles.haroldAvatar}>
      <Text style={styles.haroldAvatarText}>H</Text>
    </View>
  );
}

// Pulse dot component for header
function PulseDot() {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
  );
}

// Minimal header component
function MinimalHeader() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.minimalHeader, { paddingTop: topPad + 8 }]}>
      <View style={styles.headerLeft}>
        <PulseDot />
        <Text style={styles.headerText}>Chicago Pulse</Text>
      </View>
    </View>
  );
}

function TypingDots() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = (d: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(d, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      );
    const a1 = anim(dot1, 0);
    const a2 = anim(dot2, 200);
    const a3 = anim(dot3, 400);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={styles.aiRow}>
      <HaroldAvatar />
      <View style={styles.typingContainer}>
        <View style={styles.typingDotsRow}>
          {[dot1, dot2, dot3].map((d, i) => (
            <Animated.View key={i} style={[styles.typingDot, { opacity: d }]} />
          ))}
        </View>
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
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const scrollOffsetRef = useRef(0);
  
  // Waveform animations
  const waveform1 = useRef(new Animated.Value(12)).current;
  const waveform2 = useRef(new Animated.Value(20)).current;
  const waveform3 = useRef(new Animated.Value(16)).current;

  const greetingOpacity = useRef(new Animated.Value(1)).current;
  const greetingY = useRef(new Animated.Value(0)).current;
  const chipsOpacity = useRef(new Animated.Value(1)).current;
  const chipsY = useRef(new Animated.Value(0)).current;
  const emptyOpacity = useRef(new Animated.Value(1)).current;
  const inputBarOpacity = useRef(new Animated.Value(0)).current;

  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 80;

  // Animate waveform when in voice mode
  useEffect(() => {
    if (isVoiceMode) {
      const animateBar = (bar: Animated.Value, baseHeight: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(bar, {
              toValue: baseHeight * 0.4,
              duration: 300 + Math.random() * 200,
              useNativeDriver: false,
            }),
            Animated.timing(bar, {
              toValue: baseHeight * 1.5,
              duration: 300 + Math.random() * 200,
              useNativeDriver: false,
            }),
            Animated.timing(bar, {
              toValue: baseHeight,
              duration: 300 + Math.random() * 200,
              useNativeDriver: false,
            }),
          ])
        );
      };
      const a1 = animateBar(waveform1, 12);
      const a2 = animateBar(waveform2, 20);
      const a3 = animateBar(waveform3, 16);
      a1.start();
      a2.start();
      a3.start();
      return () => {
        a1.stop();
        a2.stop();
        a3.stop();
        waveform1.setValue(12);
        waveform2.setValue(20);
        waveform3.setValue(16);
      };
    }
  }, [isVoiceMode]);

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    if (messages.length > 0 && !isTyping) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        setShowNewMessageIndicator(false);
      }, 100);
    }
  }, [messages.length, isTyping]);

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
          Animated.timing(inputBarOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
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

  const handleScroll = (event: any) => {
    const offset = event.nativeEvent.contentOffset.y;
    scrollOffsetRef.current = offset;
    // Show indicator if scrolled up more than 100px
    if (offset > 100) {
      setShowNewMessageIndicator(true);
    } else {
      setShowNewMessageIndicator(false);
    }
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    setShowNewMessageIndicator(false);
  };

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
        <HaroldAvatar />
        <View style={styles.aiMessageContainer}>
          <Text style={styles.aiBubbleText}>{item.text}</Text>
          {item.sources && item.sources.length > 0 && (
            <View style={styles.sourceRow}>
              {item.sources.slice(0, 3).map((s, idx) => (
                <SourceChip key={idx} label={s} />
              ))}
              {item.sources.length > 3 && (
                <View style={styles.sourceChip}>
                  <Text style={styles.sourceChipText}>+{item.sources.length - 3}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <MinimalHeader />

      <View style={styles.mainArea}>
        {hasStarted && (
          <>
            <FlatList
              ref={flatListRef}
              data={isTyping ? [{ id: "typing", role: "typing" as const, text: "", timestamp: new Date() }, ...messages] : messages}
              inverted
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={messages.length > 0}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            />
            {showNewMessageIndicator && (
              <Pressable style={styles.newMessageIndicator} onPress={scrollToBottom}>
                <Text style={styles.newMessageText}>↓ new message</Text>
              </Pressable>
            )}
          </>
        )}

        {emptyMounted && (
          <Animated.View
            style={[styles.emptyOverlay, { opacity: emptyOpacity }]}
            pointerEvents={hasStarted ? "none" : "auto"}
          >
            <Animated.View
              style={[styles.greeting, { opacity: greetingOpacity, transform: [{ translateY: greetingY }] }]}
            >
              <Text style={styles.greetingName}>
                Hey {firstName}.
              </Text>
              <Text style={styles.greetingSub}>
                Ask me anything about Chicago.
              </Text>
            </Animated.View>

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
                    style={({ pressed }) => [styles.quickChip, { opacity: pressed ? 0.7 : 1 }]}
                  >
                    <Text style={styles.quickChipText}>{prompt}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>
          </Animated.View>
        )}
      </View>

      <Animated.View style={[{ opacity: inputBarOpacity, backgroundColor: "#111111" }, { pointerEvents: hasStarted ? "auto" : "none" } as any]}>
        <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={0}>
          <View style={styles.inputBar}>
            {isVoiceMode ? (
              <View style={styles.voiceModeContainer}>
                <View style={styles.waveformContainer}>
                  <Animated.View style={[styles.waveformBar, { height: waveform1 }]} />
                  <Animated.View style={[styles.waveformBar, { height: waveform2 }]} />
                  <Animated.View style={[styles.waveformBar, { height: waveform3 }]} />
                </View>
                <Text style={styles.listeningText}>Listening...</Text>
                <Pressable onPress={() => setIsVoiceMode(false)} style={styles.cancelVoiceBtn}>
                  <Text style={styles.cancelVoiceText}>Cancel</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Pressable
                  onPress={() => setIsVoiceMode(true)}
                  style={styles.micButton}
                >
                  <Ionicons name="mic-outline" size={24} color="#555" />
                </Pressable>
                <TextInput
                  style={styles.input}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Ask Harold..."
                  placeholderTextColor="#444"
                  multiline
                  maxLength={500}
                  returnKeyType="send"
                  onSubmitEditing={() => sendMessage(inputText)}
                />
                {inputText.trim() && (
                  <Pressable
                    onPress={() => sendMessage(inputText)}
                    style={({ pressed }) => [
                      styles.sendBtn,
                      { opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
                  </Pressable>
                )}
              </>
            )}
          </View>
          <View style={{ height: bottomPad + 16 }} />
        </KeyboardAvoidingView>
      </Animated.View>

      <SavedPanel isOpen={panelOpen} onClose={closePanel} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000000" },
  mainArea: { flex: 1, position: "relative" },

  // Minimal header
  minimalHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E8533A",
  },
  headerText: {
    fontSize: 13,
    color: "#888",
    fontFamily: Platform.select({ ios: "SF Pro Text", default: "System" }),
  },

  // Empty state
  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 60,
    gap: 20,
  },
  greeting: { alignItems: "center", gap: 8 },
  greetingName: { fontSize: 36, fontWeight: "700", letterSpacing: -0.8, textAlign: "center", color: "#FFFFFF" },
  greetingSub: { fontSize: 17, textAlign: "center", lineHeight: 24, color: "#888888" },

  chipScroll: { gap: 8, paddingHorizontal: 0, paddingVertical: 2 },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#1A1A1A",
  },
  quickChipText: { fontSize: 14, color: "#FFFFFF", fontWeight: "500" },

  // Messages
  messageList: { paddingHorizontal: 20, paddingVertical: 12, gap: 16 },
  userRow: { alignItems: "flex-end", marginBottom: 4 },
  userBubble: {
    backgroundColor: "#1E1E1E",
    borderRadius: 18,
    borderBottomRightRadius: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: "75%",
  },
  userBubbleText: { color: "#F5F5F5", fontSize: 15, lineHeight: 22 },

  aiRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  haroldAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E8533A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginTop: 2,
  },
  haroldAvatarText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  aiMessageContainer: {
    flex: 1,
    maxWidth: "85%",
  },
  aiBubbleText: {
    color: "#E8E8E8",
    fontSize: 15,
    lineHeight: 24,
  },
  sourceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  sourceChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#333",
    backgroundColor: "transparent",
    gap: 4,
  },
  sourceChipIcon: {
    fontSize: 8,
  },
  sourceChipText: {
    fontSize: 11,
    color: "#555",
  },

  // Typing indicator
  typingContainer: {
    flex: 1,
    maxWidth: "85%",
  },
  typingDotsRow: {
    flexDirection: "row",
    gap: 5,
    paddingVertical: 4,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#888",
  },

  // New message indicator
  newMessageIndicator: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    backgroundColor: "#E8533A",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newMessageText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
  },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#222",
    backgroundColor: "#111111",
  },
  micButton: {
    padding: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#F5F5F5",
    paddingVertical: 8,
    maxHeight: 120,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8533A",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceModeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginBottom: 8,
    height: 24,
  },
  waveformBar: {
    width: 4,
    backgroundColor: "#E8533A",
    borderRadius: 2,
  },
  listeningText: {
    color: "#555",
    fontSize: 13,
    marginBottom: 8,
  },
  cancelVoiceBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  cancelVoiceText: {
    color: "#888",
    fontSize: 13,
  },
});
