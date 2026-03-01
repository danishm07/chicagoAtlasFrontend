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
  KeyboardAvoidingView,
  Keyboard,
  Linking,
  Image,
  ImageBackground,
} from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { useProfile } from "@/context/profile";
import { useSaved } from "@/context/saved";
import { useColors } from "@/context/theme";
import { FLAGS, BACKEND_URL, AZURE_MAPS_KEY } from "@/constants/config";
import SavedPanel from "@/components/SavedPanel";

type Message = {
  id: string;
  role: "user" | "ai" | "typing";
  text: string;
  sources?: string[];
  timestamp: Date;
  isVoice?: boolean;
};

function getMockResponse(input: string): { text: string; sources: string[] } {
  const responses = [
    {
      text: "Four events happening tonight, thirty eight spots open nearby, all CTA lines are running normally, and air quality is good at AQI thirty seven. What do you want to know more about? ||MAP:Fairgrounds Coffee, Chicago||",
      sources: ["Chicago 311", "Yelp", "CTA Alerts", "Weather"],
    },
    {
      text: "I found several great coffee shops for you. The best one is Intelligentsia Coffee which has no wait right now. ||MAP:Intelligentsia Coffee, Millennium Park|| ||SOURCES:Yelp,Google Maps||",
      sources: ["Yelp", "Google Maps"],
    },
    {
      text: "There's a live music venue starting soon. Three Top Lounge has Fess Grandiose performing at 8:30PM. ||MAP:Three Top Lounge, Chicago|| ||SOURCES:Ticketmaster,Events||",
      sources: ["Ticketmaster", "Events"],
    }
  ];
  
  // Return different responses based on input to test various scenarios
  if (input.toLowerCase().includes('coffee')) {
    return responses[1];
  } else if (input.toLowerCase().includes('music')) {
    return responses[2];
  }
  return responses[0];
}

const QUICK_PROMPTS = [
  "What should I do tonight?",
  "Is it safe to walk to the Blue Line?",
  "Cheapest food open near me",
  "What's worth going to this week?",
];

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getSourceInfo(source: string): { label: string; icon: string } {
  const s = source.toLowerCase();
  if (s.includes("yelp") || s.includes("spots")) return { label: "Yelp", icon: "🟡" };
  if (s.includes("ticketmaster") || s.includes("events")) return { label: "Events", icon: "🔵" };
  if (s.includes("safety") || s.includes("crimes") || s.includes("311") || s.includes("cpd")) return { label: "Safety", icon: "🔴" };
  if (s.includes("cta") || s.includes("transit")) return { label: "Transit", icon: "🟢" };
  if (s.includes("weather")) return { label: "Weather", icon: "⚪" };
  if (s.includes("air") || s.includes("aqi")) return { label: "Air", icon: "🟢" };
  if (s.includes("perplexity") || s.includes("discovery")) return { label: "Discovery", icon: "🟣" };
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

function HaroldAvatar() {
  return (
    <View style={styles.haroldAvatar}>
      <Text style={styles.haroldAvatarText}>H</Text>
    </View>
  );
}

function PulseDot() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);
  return <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />;
}

function TypingDots() {
  const C = useColors();
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
            <Animated.View key={i} style={[styles.typingDot, { backgroundColor: C.textTertiary, opacity: d }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

export default function AskTab() {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const { profile } = useProfile();
  const { panelOpen, closePanel } = useSaved();

  const firstName = profile?.name?.split(" ")[0] ?? "there";

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [emptyMounted, setEmptyMounted] = useState(true);

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  };
  
  const timeOfDay = getTimeOfDay();
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);
  
  // Audio State
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceMode, setVoiceMode] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Initialize audio mode on component mount
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        await Audio.requestPermissionsAsync();
      } catch (err) {
        console.error('Failed to initialize audio mode:', err);
      }
    };
    
    initializeAudio();
  }, []);
  
  // Keyboard listener to fix Tab Bar overlap
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const greetingOpacity = useRef(new Animated.Value(1)).current;
  const greetingY = useRef(new Animated.Value(0)).current;
  const chipsOpacity = useRef(new Animated.Value(1)).current;
  const chipsY = useRef(new Animated.Value(0)).current;
  const emptyOpacity = useRef(new Animated.Value(1)).current;
  const micPulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const kbdShow = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () => setKeyboardVisible(true));
    const kbdHide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setKeyboardVisible(false));
    return () => { kbdShow.remove(); kbdHide.remove(); }
  }, []);

  // Mic pulse animation
  useEffect(() => {
    if (isRecording) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(micPulseAnim, { toValue: 1.6, duration: 1000, useNativeDriver: true }),
          Animated.timing(micPulseAnim, { toValue: 1, duration: 0, useNativeDriver: true })
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    } else {
      micPulseAnim.setValue(1);
    }
  }, [isRecording]);

  // Bulletproof audio playback function to prevent -1008 errors
  const playVoice = async (text: string) => {
    try {
      const encodedText = encodeURIComponent(text.slice(0, 400));
      const url = `${BACKEND_URL}/api/tts?text=${encodedText}`;
      
      // Create a temporary file path
      const tempFile = `${FileSystem.cacheDirectory}harold.mp3`;
      
      // Download the audio first
      const downloadResult = await FileSystem.downloadAsync(url, tempFile);
      
      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status: ${downloadResult.status}`);
      }
      
      // Only after the download finishes, create the sound from local file
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: tempFile },
        { shouldPlay: false } // Don't play yet!
      );

      soundRef.current = newSound;

      // Wait for the buffer to actually be ready
      const status = await newSound.getStatusAsync();
      if (status.isLoaded) {
        await newSound.playAsync();
      }
      
      // Clean up temp file after playback starts
      setTimeout(() => {
        FileSystem.deleteAsync(tempFile, { idempotent: true }).catch(() => {
          // Ignore cleanup errors
        });
      }, 5000); // Give it 5 seconds before cleanup
    } catch (err) {
      console.log("Audio load failed, likely network/rate limit:", err);
    }
  };

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
        ]).start(() => setEmptyMounted(false));
      }

      const userMsg: Message = {
        id: genId(),
        role: "user",
        text: trimmed,
        timestamp: new Date(),
        isVoice: voiceMode,
      };
      setMessages((prev) => [userMsg, ...prev]);
      setInputText("");
      setIsTyping(true);

      if (FLAGS.USE_REAL_CHAT) {
        try {
          const res = await fetch(`${BACKEND_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: trimmed,
              profile: {
                name: profile?.name ?? "User",
                personas: profile?.personas ?? [],
                university: profile?.university ?? "",
                interests: profile?.interests ?? [],
                currentZone: profile?.currentZone ?? "loop",
              },
              history: [...messages]
                .reverse()
                .filter(m => m.role !== "typing")
                .slice(-6)
                .map(m => ({
                  role: m.role === "ai" ? "assistant" : "user",
                  content: m.text,
                })),
            }),
          });

          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const streamId = genId();
          setIsTyping(false);
          setMessages(prev => [{
            id: streamId,
            role: "ai",
            text: "",
            sources: [],
            timestamp: new Date(),
            isVoice: voiceMode,
          }, ...prev]);

          if (res.body) {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let fullText = "";
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              fullText += decoder.decode(value, { stream: true });
              setMessages(prev => prev.map(m =>
                m.id === streamId ? { ...m, text: fullText } : m
              ));
            }
            
            // Play TTS audio if voice mode is enabled
            if (voiceMode && fullText.trim()) {
              try {
                const cleanText = fullText.split('||SOURCES:')[0].trim();
                
                // Set audio mode for louder output (bottom speaker)
                await Audio.setAudioModeAsync({ 
                  allowsRecordingIOS: false, 
                  playsInSilentModeIOS: true, 
                  shouldDuckAndroid: true, 
                  playThroughEarpieceAndroid: false 
                });
                
                // Clean up previous sound if exists
                if (soundRef.current) {
                  await soundRef.current.unloadAsync();
                }
                
                // Set up playback status tracking
                const playVoiceWithTracking = async (text: string) => {
                  try {
                    await playVoice(text);
                    if (soundRef.current) {
                      soundRef.current.setOnPlaybackStatusUpdate((status) => {
                        if (status.isLoaded && status.didJustFinish) {
                          setIsPlaying(false);
                          soundRef.current?.unloadAsync();
                          soundRef.current = null;
                        }
                      });
                      setIsPlaying(true);
                    }
                  } catch (err) {
                    console.error('Audio setup failed:', err);
                    setIsPlaying(false); // <--- Add this to prevent the UI from getting stuck
                  }
                };
                
                await playVoiceWithTracking(cleanText);
              } catch (err) {
                console.error('TTS playback failed:', err);
                setIsPlaying(false);
                // Don't show error to user, just fail silently
              }
            }
          } else {
            const text = await res.text();
            setMessages(prev => prev.map(m =>
              m.id === streamId ? { ...m, text } : m
            ));
            
            // Play TTS audio if voice mode is enabled
            if (voiceMode && text.trim()) {
              try {
                const cleanText = text.split('||SOURCES:')[0].trim();
                
                // Set audio mode for louder output (bottom speaker)
                await Audio.setAudioModeAsync({ 
                  allowsRecordingIOS: false, 
                  playsInSilentModeIOS: true, 
                  shouldDuckAndroid: true, 
                  playThroughEarpieceAndroid: false 
                });
                
                // Clean up previous sound if exists
                if (soundRef.current) {
                  await soundRef.current.unloadAsync();
                }
                
                // Set up playback status tracking
                const playVoiceWithTracking = async (text: string) => {
                  try {
                    await playVoice(text);
                    if (soundRef.current) {
                      soundRef.current.setOnPlaybackStatusUpdate((status) => {
                        if (status.isLoaded && status.didJustFinish) {
                          setIsPlaying(false);
                          soundRef.current?.unloadAsync();
                          soundRef.current = null;
                        }
                      });
                      setIsPlaying(true);
                    }
                  } catch (err) {
                    console.error('Audio setup failed:', err);
                    setIsPlaying(false); // <--- Add this to prevent the UI from getting stuck
                  }
                };
                
                await playVoiceWithTracking(cleanText);
              } catch (err) {
                console.error('TTS playback failed:', err);
                setIsPlaying(false);
                // Don't show error to user, just fail silently
              }
            }
          }
        } catch (err) {
          console.log("[CHAT ERROR]", err);
          setIsTyping(false);
          setMessages((prev) => [
            {
              id: genId(),
              role: "ai",
              text: "Couldn't reach Chicago data right now. Try again.",
              sources: [],
              timestamp: new Date(),
            },
            ...prev,
          ]);
        }
      } else {
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
        setIsTyping(false);
        const { text: responseText, sources } = getMockResponse(trimmed);
        setMessages((prev) => [
          {
            id: genId(),
            role: "ai",
            text: responseText,
            sources,
            timestamp: new Date(),
            isVoice: voiceMode,
          },
          ...prev,
        ]);
        
        // Play TTS audio if voice mode is enabled (mock response)
        if (voiceMode && responseText.trim()) {
          try {
            const cleanText = responseText.split('||SOURCES:')[0].trim();
            
            // Set audio mode for louder output (bottom speaker)
            await Audio.setAudioModeAsync({ 
              allowsRecordingIOS: false, 
              playsInSilentModeIOS: true, 
              shouldDuckAndroid: true, 
              playThroughEarpieceAndroid: false 
            });
            
            // Clean up previous sound if exists
            if (soundRef.current) {
              await soundRef.current.unloadAsync();
            }
            
            // Set up playback status tracking
            const playVoiceWithTracking = async (text: string) => {
              try {
                await playVoice(text);
                if (soundRef.current) {
                  soundRef.current.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && status.didJustFinish) {
                      setIsPlaying(false);
                      soundRef.current?.unloadAsync();
                      soundRef.current = null;
                    }
                  });
                  setIsPlaying(true);
                }
              } catch (err) {
                console.error('Audio setup failed:', err);
                setIsPlaying(false); // <--- Add this to prevent the UI from getting stuck
              }
            };
            
            await playVoiceWithTracking(cleanText);
          } catch (err) {
            console.error('TTS playback failed:', err);
            setIsPlaying(false);
            // Don't show error to user, just fail silently
          }
        }
      }
    },
    [hasStarted, profile, messages]
  );

  const startRecording = async () => {
    try {
      // Initialize audio mode before requesting permissions
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access microphone was denied');
        return;
      }

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (uri) {
        // Show typing indicator while transcribing
        setIsTyping(true);
        const formData = new FormData();
        formData.append('audio', {
          uri,
          type: 'audio/m4a',
          name: 'recording.m4a',
        } as any);

        try {
          const response = await fetch(`${BACKEND_URL}/api/transcribe`, {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const { text } = await response.json();
            setIsTyping(false);
            if (text && text.trim()) {
              sendMessage(text);
            }
          } else {
            console.error('Transcription failed:', response.status);
            setIsTyping(false);
          }
        } catch (err) {
          console.error('Error sending audio for transcription:', err);
          setIsTyping(false);
        }
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      setIsTyping(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const stopHarold = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setIsPlaying(false);
      } catch (err) {
        console.error('Error stopping audio:', err);
      }
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.role === "typing") return <TypingDots />;
    if (item.role === "user") {
      return (
        <View style={styles.userRow}>
          <View style={styles.userBubble}>
            <Text style={[styles.userBubbleText, item.isVoice && { fontStyle: 'italic' }]}>
              {item.text}
            </Text>
          </View>
        </View>
      );
    }

    let displayText = item.text;
    let parsedSources = item.sources || [];
    let mapQuery = "";

    if (displayText.includes('||SOURCES:')) {
      const parts = displayText.split('||SOURCES:');
      displayText = parts[0].trim(); 
      
      if (parts[1] && parts[1].includes('||')) {
        const sourceString = parts[1].split('||')[0];
        parsedSources = sourceString.split(',').map(s => s.trim());
      }
    }

    if (displayText.includes('||MAP:')) {
      const mapMatch = displayText.match(/\|\|MAP:(.*?)\|\|/);
      if (mapMatch) {
        mapQuery = mapMatch[1].trim();
        displayText = displayText.replace(/\|\|MAP:.*?\|\|/, '').trim();
      }
    }

    return (
      <View style={styles.aiRow}>
        <HaroldAvatar />
        <View style={styles.aiMessageContainer}>
          <Text style={[styles.aiBubbleText, { color: C.textPrimary }, item.isVoice && { fontStyle: 'italic' }]}>
            {displayText}
          </Text>
          {parsedSources && parsedSources.length > 0 && (
            <View style={styles.sourceRow}>
              {parsedSources.slice(0, 4).map((s, idx) => (
                <SourceChip key={idx} label={s} />
              ))}
              {parsedSources.length > 4 && (
                <View style={[styles.userBubble, { backgroundColor: C.accent }]}>
                  <Text style={[styles.messageText, { color: "#FFFFFF" }]}>{`+${parsedSources.length - 4}`}</Text>
                </View>
              )}
            </View>
          )}
          {mapQuery && (
            <Pressable 
              style={[styles.mapCard, { 
                marginTop: 10, 
                backgroundColor: C.surface, 
                borderRadius: 12, 
                borderWidth: 1, 
                borderColor: C.border, 
                height: 120,
                overflow: 'hidden',
                padding: 0,
                position: 'relative'
              }]}
              onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`)}
            >
              <Image
                source={{ uri: "https://atlas.microsoft.com/map/static/png?api-version=1.0&style=main&layer=basic&zoom=14&center=-87.6298,41.8781&height=150&width=300&subscription-key=" + AZURE_MAPS_KEY }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: '100%',
                  height: '100%',
                }}
                resizeMode="cover"
              />
              <View style={{
                position: 'absolute',
                bottom: 0,
                width: '100%',
                backgroundColor: 'rgba(26, 26, 26, 0.9)',
                padding: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10
              }}>
                <Ionicons name="location" size={20} color="#4285F4" />
                <Text style={{ 
                  color: '#FFFFFF', 
                  fontSize: 14, 
                  fontWeight: "600",
                  flex: 1
                }}>{mapQuery}</Text>
              </View>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  const TAB_BAR_HEIGHT = 84; 
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 100;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.background }]} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: C.border }]}>
          <View style={styles.headerLeft}>
            <PulseDot />
            <Text style={[styles.headerText, { color: C.textSecondary }]}>Chicago Atlas</Text>
          </View>
          {isKeyboardVisible && (
            <Pressable onPress={Keyboard.dismiss} style={[styles.dismissBtn, { backgroundColor: C.surface }]}>
              <Ionicons name="chevron-down" size={18} color={C.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Main content */}
        <View style={styles.mainArea}>
          {hasStarted && (
            <>
              <FlatList
                ref={flatListRef}
                data={
                  isTyping
                    ? [
                        { id: "typing", role: "typing" as const, text: "", timestamp: new Date() },
                        ...messages,
                      ]
                    : messages
                }
                inverted
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messageList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                onScroll={(e) =>
                  setShowNewMessageIndicator(
                    e.nativeEvent.contentOffset.y > 100
                  )
                }
                scrollEventThrottle={16}
              />
              {showNewMessageIndicator && (
                <Pressable
                  style={styles.newMessageIndicator}
                  onPress={() => {
                    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                    setShowNewMessageIndicator(false);
                  }}
                >
                  <View style={[styles.newMessageIndicator, { backgroundColor: C.accent }]}>
                    <Text style={styles.newMessageText}>New messages below</Text>
                  </View>
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
                style={[
                  styles.greeting,
                  {
                    opacity: greetingOpacity,
                    transform: [{ translateY: greetingY }],
                  },
                ]}
              >
                <View style={styles.greetingWrapper}>
                  <Text style={[styles.greeting, { color: C.textPrimary }]}>Good {timeOfDay}, {firstName}.</Text>
                  <Text style={[styles.subGreeting, { color: C.textSecondary }]}>What can I help you with today?</Text>
                </View>
              </Animated.View>

              <Animated.View
                style={{
                  opacity: chipsOpacity,
                  transform: [{ translateY: chipsY }],
                  width: "100%",
                }}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipScroll}
                >
                  {QUICK_PROMPTS.map((prompt, i) => (
                    <Pressable
                      key={i}
                      onPress={() => sendMessage(prompt)}
                      style={[styles.quickChip, { backgroundColor: C.accent }]}
                    >
                      <Text style={styles.quickChipText}>{prompt}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </Animated.View>

              <View style={[styles.centeredInputWrap, { borderColor: C.border, backgroundColor: C.surface }]}>
                <Pressable onPress={() => setVoiceMode(!voiceMode)} style={styles.voiceToggle}>
                  <Ionicons name={voiceMode ? "volume-high" : "volume-mute-outline"} size={22} color={voiceMode ? "#E8533A" : "#666"} />
                </Pressable>
                <TextInput
                  style={[styles.centeredInput, { color: C.textPrimary }]}
                  placeholder="Ask anything about Chicago..."
                  placeholderTextColor={C.textTertiary}
                  value={inputText}
                  onChangeText={setInputText}
                  returnKeyType="send"
                  blurOnSubmit
                  onSubmitEditing={() => {
                    if (inputText.trim()) sendMessage(inputText);
                  }}
                />
                {inputText.trim() ? (
                  <Pressable
                    onPress={() => sendMessage(inputText)}
                    style={[styles.sendBtn, { backgroundColor: C.accent, opacity: inputText.trim() ? 1 : 0.5 }]}
                    disabled={!inputText.trim()}
                  >
                    <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
                  </Pressable>
                ) : (
                  <Pressable onPress={toggleRecording} style={styles.micIcon}>
                    <Animated.View
                      style={[
                        styles.micPulse,
                        {
                          transform: [{ scale: micPulseAnim }],
                          opacity: isRecording ? micPulseAnim.interpolate({
                            inputRange: [1, 1.6],
                            outputRange: [0.6, 0]
                          }) : 0,
                        },
                      ]}
                    />
                    <Ionicons name={isRecording ? "square" : "mic-outline"} size={isRecording ? 16 : 22} color={isRecording ? "#E8533A" : "#555"} />
                  </Pressable>
                )}
              </View>
            </Animated.View>
          )}
        </View>

        {/* Dynamic Input Bar Container */}
        {hasStarted && (
          <View style={[styles.inputBarContainer, { paddingBottom: bottomPad }]}>
            <View style={[styles.inputPill, { borderColor: C.border, backgroundColor: C.surface }]}>
              <Pressable
                onPress={() => {
                  if (voiceMode && isPlaying) {
                    stopHarold();
                  } else {
                    setVoiceMode(!voiceMode);
                  }
                }}
                style={styles.voiceToggle}
              >
                <Ionicons 
                  name={
                    voiceMode && isPlaying 
                      ? "stop" 
                      : voiceMode 
                        ? "volume-high" 
                        : "volume-mute-outline"
                  } 
                  size={22} 
                  color={
                    voiceMode && isPlaying 
                      ? "#E8533A" 
                      : voiceMode 
                        ? "#E8533A" 
                        : "#666"
                  } 
                />
              </Pressable>
              <TextInput
                style={[styles.input, { color: C.textPrimary }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask Harold..."
                placeholderTextColor={C.textTertiary}
                multiline
                maxLength={500}
                returnKeyType="send"
                blurOnSubmit={false}
                onSubmitEditing={() => {
                  if (inputText.trim()) sendMessage(inputText);
                }}
              />
              {inputText.trim() ? (
                <Pressable
                  onPress={() => sendMessage(inputText)}
                  style={({ pressed }) => [
                    styles.sendBtn,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
                </Pressable>
              ) : (
                <Pressable
                  onPress={toggleRecording}
                  style={styles.micIcon}
                >
                  <Animated.View
                    style={[
                      styles.micPulse,
                      {
                        transform: [{ scale: micPulseAnim }],
                        opacity: isRecording ? micPulseAnim.interpolate({
                          inputRange: [1, 1.6],
                          outputRange: [0.6, 0]
                        }) : 0,
                      },
                    ]}
                  />
                  <Ionicons 
                    name={isRecording ? "square" : "mic-outline"} 
                    size={isRecording ? 16 : 22} 
                    color={isRecording ? "#E8533A" : "#555"} 
                  />
                </Pressable>
              )}
            </View>
          </View>
        )}

        <SavedPanel isOpen={panelOpen} onClose={closePanel} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E8533A",
  },
  dismissBtn: {
    padding: 4,
  },
  headerText: {
    fontSize: 13,
    fontFamily: Platform.select({ ios: "SF Pro Text", default: "System" }),
  },
  themeToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  mainArea: {
    flex: 1,
    position: "relative",
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subGreeting: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    opacity: 0.7,
  },
  emptyOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 20,
  },
  greetingWrapper: {
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  greetingName: {
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: -0.8,
    textAlign: "center",
    color: "#FFFFFF",
  },
  chipScroll: {
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 4,
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  quickChipText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  centeredInputWrap: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginTop: 4,
  },
  centeredInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
  },
  centeredSendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  messageList: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  userRow: {
    alignItems: "flex-end",
    marginBottom: 4,
  },
  userBubble: {
    backgroundColor: "#1C1C1E",
    borderWidth: 1,
    borderColor: "#2C2C2E",
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: "75%",
  },
  userBubbleText: {
    color: "#F5F5F5",
    fontSize: 15,
    lineHeight: 22,
  },
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
    marginRight: 10,
    marginTop: 2, 
    flexShrink: 0,
  },
  haroldAvatarText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  aiMessageContainer: {
    flex: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  aiBubbleText: {
    fontSize: 15,
    lineHeight: 24,
    letterSpacing: 0.2,
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
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    backgroundColor: "#111",
    gap: 4,
  },
  sourceChipIcon: {
    fontSize: 10,
  },
  sourceChipText: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500",
  },
  typingContainer: {
    flex: 1,
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
  },
  newMessageIndicator: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newMessageText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
  },
  inputBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  inputPill: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 4, 
    maxHeight: 120,
    minHeight: 34,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  micIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  micPulse: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  voiceToggle: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  centeredVoiceToggle: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  mapCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    padding: 12,
    marginTop: 8,
    gap: 12,
  },
  mapCardText: {
    fontSize: 14,
    color: "#F5F5F5",
    flex: 1,
  },
});