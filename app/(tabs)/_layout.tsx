import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        // Active Color: Blue-600
        tabBarActiveTintColor: "#2563eb", 
        
        // Inactive Color: Lighter Gray in Dark, Darker Gray in Light
        tabBarInactiveTintColor: isDark ? "#9ca3af" : "#6b7280",
        
        headerShown: false,
        
        // Dynamic Background & Border Colors
        tabBarStyle: {
          backgroundColor: isDark ? "#1f2937" : "#ffffff", // gray-800 vs white
          borderTopColor: isDark ? "#374151" : "#e5e7eb", // gray-700 vs gray-200
          height: 60, 
          paddingBottom: 5,
          paddingTop: 5,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="timer"
        options={{
          title: "Focus",
          tabBarIcon: ({ color }) => <Ionicons name="stopwatch" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: "Planner",
          tabBarIcon: ({ color }) => <Ionicons name="calendar" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="subjects"
        options={{
          title: "Subjects",
          tabBarIcon: ({ color }) => <Ionicons name="book" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}