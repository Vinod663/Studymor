import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../src/config/firebaseConfig"; 
import { View, ActivityIndicator } from "react-native";
import "../global.css"; 

export default function RootLayout() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user === undefined) return;
    const inTabsGroup = segments[0] === "(tabs)";
    if (user && !inTabsGroup) {
      router.replace("/dashboard" as any);
    } else if (!user && inTabsGroup) {
      router.replace("/" as any);
    }
  }, [user, segments]);

  if (user === undefined) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}