// App.tsx
import "./global.css";
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./src/config/firebaseConfig";
import LoginScreen from "./src/screens/LoginScreen";
import { View, Text, ActivityIndicator } from "react-native";

const Stack = createNativeStackNavigator();

function HomeScreen() {
  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-xl">Welcome to Dashboard!</Text>
    </View>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for user login state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // If user is logged in, show Home (Dashboard)
          <Stack.Screen name="Home" component={HomeScreen} />
        ) : (
          // If user is NOT logged in, show Login
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}