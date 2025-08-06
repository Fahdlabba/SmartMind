import { Colors } from "@/app/(tabs)/_layout"; // Note the path to _layout
import { VoiceNote } from "@/types/VoiceNote";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

// --- NEW HELPER COMPONENT FOR HIGHLIGHTING ---
const HighlightedText = ({
  text,
  keyPoints,
  actions,
  tags,
}: {
  text: string;
  keyPoints: string[];
  actions: string[];
  tags: string[];
}) => {
  const parts = useMemo(() => {
    if (!text) return [];

    const allKeywords = [
      ...keyPoints.map((kp) => ({ text: kp, type: "keyPoint" })),
      ...actions.map((a) => ({ text: a, type: "action" })),
      ...tags.map((t) => ({ text: t, type: "tag" })),
    ];

    if (allKeywords.length === 0) return [text];

    // Create a regex that finds any of the keywords, case-insensitively
    const regex = new RegExp(
      `(${allKeywords.map((k) => k.text).join("|")})`,
      "gi"
    );
    const splitText = text.split(regex);

    return splitText.filter(Boolean); // Filter out empty strings
  }, [text, keyPoints, actions, tags]);

  const getStyleForPart = (part: string) => {
    const lowerPart = part.toLowerCase();
    if (keyPoints.some((kp) => kp.toLowerCase() === lowerPart))
      return styles.keyPointHighlight;
    if (actions.some((a) => a.toLowerCase() === lowerPart))
      return styles.actionHighlight;
    if (tags.some((t) => t.toLowerCase() === lowerPart))
      return styles.tagHighlight;
    return null;
  };

  return (
    <Text style={styles.pointText}>
      {parts.map((part, index) => {
        const highlightStyle = getStyleForPart(part);
        return (
          <Text key={index} style={highlightStyle}>
            {part}
          </Text>
        );
      })}
    </Text>
  );
};

const Shimmer = () => (
  <LinearGradient
    colors={["#1E1E1E", "#2A2A2A", "#1E1E1E"]}
    start={{ x: 0, y: 0.5 }}
    end={{ x: 1, y: 0.5 }}
    style={StyleSheet.absoluteFillObject}
  />
);

export const VoiceNoteCard: React.FC<{
  note: VoiceNote;
  onDelete: () => void;
}> = ({ note, onDelete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      sound?.unloadAsync();
    };
  }, [sound]);

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const playPauseAudio = async () => {
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync({
          uri: note.audioUri,
        });
        setSound(newSound);
        await newSound.playAsync();
        setIsPlaying(true);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      }
    } catch (error) {
      console.error("Failed to play audio:", error);
      Alert.alert("Error", "Failed to play audio.");
    }
  };

  const handleDelete = () =>
    Alert.alert("Delete Note", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onDelete },
    ]);
  const formatDuration = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <Pressable onPress={toggleExpanded} style={styles.card}>
      <View style={styles.header}>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            playPauseAudio();
          }}
          style={[
            styles.playButton,
            { backgroundColor: isPlaying ? Colors.secondary : Colors.primary },
          ]}
        >
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={20}
            color={Colors.text}
          />
        </Pressable>
        <View style={styles.titleSection}>
          <Text style={styles.title} numberOfLines={1}>
            {note.title}
          </Text>
          <Text style={styles.metaInfo}>
            {new Date(note.createdAt).toLocaleDateString()} •{" "}
            {formatDuration(note.duration)}
          </Text>
        </View>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={24}
          color={Colors.textSecondary}
        />
      </View>

      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* KEY POINTS - PRIMARY FOCUS */}
          {note.keyPoints?.length > 0 && (
            <View style={styles.primarySection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bulb" size={16} color={Colors.primary} />
                <Text style={styles.primarySectionTitle}>Key Points</Text>
              </View>
              <View style={styles.keyPointsContainer}>
                {note.keyPoints.map((point, index) => (
                  <LinearGradient
                    key={index}
                    colors={[
                      "rgba(50, 205, 50, 0.15)",
                      "rgba(50, 205, 50, 0.05)",
                    ]}
                    style={styles.keyPointCard}
                  >
                    <View style={styles.keyPointBullet} />
                    <Text style={styles.keyPointText}>{point}</Text>
                  </LinearGradient>
                ))}
              </View>
            </View>
          )}

          {/* ACTIONS - PRIMARY FOCUS */}
          {note.actions?.length > 0 && (
            <View style={styles.primarySection}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={Colors.secondary}
                />
                <Text style={styles.primarySectionTitle}>Action Items</Text>
              </View>
              <View style={styles.actionsContainer}>
                {note.actions.map((action, index) => (
                  <LinearGradient
                    key={index}
                    colors={[
                      "rgba(255, 45, 85, 0.15)",
                      "rgba(255, 45, 85, 0.05)",
                    ]}
                    style={styles.actionCard}
                  >
                    <Ionicons
                      name="arrow-forward"
                      size={14}
                      color={Colors.secondary}
                    />
                    <Text style={styles.actionText}>{action}</Text>
                  </LinearGradient>
                ))}
              </View>
            </View>
          )}

          {/* TRANSCRIPTION - SECONDARY */}
          <View style={styles.secondarySection}>
            <Text style={styles.secondarySectionTitle}>Full Transcription</Text>
            <View style={styles.transcriptionContainer}>
              <HighlightedText
                text={note.transcription || "No transcription available."}
                keyPoints={note.keyPoints || []}
                actions={note.actions || []}
                tags={note.tags || []}
              />
            </View>
          </View>

          {/* TAGS - TERTIARY */}
          {note.tags?.length > 0 && (
            <View style={styles.tertiarySection}>
              <Text style={styles.tertiarySectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {note.tags.map((tag) => (
                  <LinearGradient
                    key={tag}
                    colors={[
                      "rgba(0, 122, 255, 0.2)",
                      "rgba(0, 122, 255, 0.1)",
                    ]}
                    style={styles.tag}
                  >
                    <Text style={styles.tagText}>#{tag}</Text>
                  </LinearGradient>
                ))}
              </View>
            </View>
          )}

          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={16} color={Colors.secondary} />
            <Text style={styles.deleteText}>Delete Note</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  header: { flexDirection: "row", alignItems: "center", gap: 16 },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  titleSection: { flex: 1 },
  title: { fontSize: 18, fontWeight: "600", color: Colors.text },
  metaInfo: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  expandedContent: {
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },

  // PRIMARY SECTIONS (Key Points & Actions)
  primarySection: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  primarySectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // KEY POINTS STYLES
  keyPointsContainer: { gap: 8 },
  keyPointCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    gap: 10,
  },
  keyPointBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  keyPointText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: "500",
    flex: 1,
    lineHeight: 20,
  },

  // ACTIONS STYLES
  actionsContainer: { gap: 8 },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
    gap: 10,
  },
  actionText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: "500",
    flex: 1,
    lineHeight: 20,
  },

  // SECONDARY SECTIONS (Transcription)
  secondarySection: { marginBottom: 16, marginTop: 8 },
  secondarySectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  transcriptionContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  pointText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },

  // TERTIARY SECTIONS (Tags)
  tertiarySection: { marginBottom: 16 },
  tertiarySectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontSize: 11, color: Colors.text, fontWeight: "600" },

  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 45, 85, 0.1)",
    marginTop: 16,
  },
  deleteText: { color: Colors.secondary, marginLeft: 8, fontWeight: "600" },

  // HIGHLIGHT STYLES (for transcription)
  keyPointHighlight: {
    backgroundColor: "rgba(50, 205, 50, 0.25)",
    borderRadius: 4,
    paddingHorizontal: 2,
  },
  actionHighlight: {
    backgroundColor: "rgba(255, 45, 85, 0.25)",
    borderRadius: 4,
    paddingHorizontal: 2,
  },
  tagHighlight: {
    backgroundColor: "rgba(0, 122, 255, 0.25)",
    borderRadius: 4,
    paddingHorizontal: 2,
  },
});
