import { VoiceNoteCard } from "@/components/VoiceNoteCard";
import { VoiceNote } from "@/types/VoiceNote";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  LayoutAnimation,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Colors } from "./_layout";

export default function ExploreScreen() {
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useFocusEffect(
    useCallback(() => {
      loadVoiceNotes();
    }, [])
  );

  const loadVoiceNotes = async () => {
    const storedNotes = await AsyncStorage.getItem("voiceNotes");
    console.log("Loaded voice notes:", storedNotes);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setVoiceNotes(storedNotes ? JSON.parse(storedNotes) : []);
  };

  const deleteVoiceNote = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const updatedNotes = voiceNotes.filter((note) => note.id !== id);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setVoiceNotes(updatedNotes);
    await AsyncStorage.setItem("voiceNotes", JSON.stringify(updatedNotes));
  };

  const filteredNotes = voiceNotes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.transcription?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="file-tray-outline"
        size={60}
        color={Colors.textSecondary}
      />
      <Text style={styles.emptyTitle}>Your Library is Empty</Text>
      <Text style={styles.emptyText}>
        Tap the 'Record' tab to create your first note.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={Colors.textSecondary}
            style={{ marginLeft: 8 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VoiceNoteCard
            note={item}
            onDelete={() => deleteVoiceNote(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 70,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 16, color: Colors.text, padding: 12 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
});
