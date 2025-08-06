import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

// Define our color palette
export const Colors = {
  background: "#121212",
  primary: "#32CD32", // Lime Green
  secondary: "#FF2D55", // Hot Pink
  text: "#FFFFFF",
  textSecondary: "#a1a1a1",
  card: "#1E1E1E",
  border: "rgba(255, 255, 255, 0.1)",
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: "rgba(30, 30, 30, 0.95)",
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Record",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mic" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Notes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="albums" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
