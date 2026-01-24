import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#2563eb", headerShown: false }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="subjects"
        options={{
          title: "Subjects",
          tabBarIcon: ({ color }) => <Ionicons name="book" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}