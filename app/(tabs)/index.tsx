import { extractKeyPoints, transcribeAudio } from "@/services/aiService";
import { VoiceNote } from "@/types/VoiceNote";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "./_layout";

export default function HomeScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const router = useRouter();

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Audio.requestPermissionsAsync();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      // Start pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      // Start timer
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      return () => {
        pulseAnimation.stop();
        clearInterval(interval);
      };
    } else {
      pulseAnim.setValue(1);
      setRecordingTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const startRecording = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRecording(true);
    try {
      // Configure recording options for better Whisper compatibility
      const recordingOptions = {
        android: {
          extension: ".m4a",
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 64000,
        },
        ios: {
          extension: ".wav",
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: "audio/webm",
          bitsPerSecond: 128000,
        },
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(recording);
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert("Error", "Failed to start recording.");
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRecording(false);
    setIsProcessing(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) await processVoiceNote(uri);
    } catch (error) {
      console.error("Failed to stop recording:", error);
    } finally {
      setIsProcessing(false);
      setRecording(null);
    }
  };

  const processVoiceNote = async (audioUri: string) => {
    const timestamp = Date.now();

    try {
      // Create permanent file first
      const permanentUri = `${FileSystem.documentDirectory}voice_note_${timestamp}.m4a`;
      await FileSystem.copyAsync({ from: audioUri, to: permanentUri });

      // Show processing status
      console.log("🎤 Transcribing audio with Groq Whisper...");

      // Real AI transcription
      const transcription = await transcribeAudio(permanentUri);
      console.log(
        "📝 Transcription completed:",
        transcription.substring(0, 100) + "..."
      );

      // Real AI analysis
      console.log("🧠 Extracting insights with AI...");
      const analysis = await extractKeyPoints(transcription);
      console.log("✨ Analysis completed:", analysis);

      const finalNote: VoiceNote = {
        id: timestamp.toString(),
        title:
          analysis.title ||
          `Voice Note - ${new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}`,
        audioUri: permanentUri,
        transcription: transcription,
        keyPoints: analysis.keyPoints || ["No key points identified"],
        actions: analysis.actions || ["No actions identified"],
        tags: analysis.tags || ["General"],
        createdAt: new Date(),
        duration: recordingTime,
        ...(analysis.calendarEvents && { calendarEvents: analysis.calendarEvents })
      };

      // Get current notes and add the new one
      const storedNotes = await AsyncStorage.getItem("voiceNotes");
      const notes = storedNotes ? JSON.parse(storedNotes) : [];
      const updatedNotes = [finalNote, ...notes];

      await AsyncStorage.setItem("voiceNotes", JSON.stringify(updatedNotes));

      // Navigate to explore tab to see the new note
      router.push("/explore");
    } catch (error) {
      console.error("Failed to process voice note:", error);
      Alert.alert("Error", "Failed to process voice note. Please try again.");
    }
  };

  const formatTime = (seconds: number) =>
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
      seconds % 60
    ).padStart(2, "0")}`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>
          {isRecording ? formatTime(recordingTime) : "Ready to Record"}
        </Text>
        <Text style={styles.subtitle}>
          {isProcessing ? "Saving note..." : "Tap the button to start"}
        </Text>
      </View>
      <View style={styles.recordingSection}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordingButton]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            {isProcessing ? (
              <ActivityIndicator size="large" color={Colors.text} />
            ) : (
              <Ionicons
                name="mic"
                size={60}
                color={isRecording ? Colors.secondary : Colors.text}
              />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: { position: "absolute", top: 100, alignItems: "center" },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    fontFamily: "monospace",
    color: Colors.text,
  },
  subtitle: { fontSize: 18, color: Colors.textSecondary, marginTop: 8 },
  recordingSection: { flex: 1, justifyContent: "center", alignItems: "center" },
  recordButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowColor: Colors.primary,
    shadowRadius: 20,
    shadowOpacity: 0.5,
  },
  recordingButton: {
    backgroundColor: Colors.card,
    borderWidth: 4,
    borderColor: Colors.secondary,
    shadowColor: Colors.secondary,
  },
});
