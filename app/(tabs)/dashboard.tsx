import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../src/config/firebaseConfig";

export default function Dashboard() {
  const [userName, setUserName] = useState("Student");

  useEffect(() => {
    if (auth.currentUser?.email) {
      setUserName(auth.currentUser.email.split("@")[0]); 
    }
  }, []);

  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-white">
      <Text className="text-2xl font-bold mb-2 text-black">Welcome back,</Text>
      <Text className="text-xl text-blue-600 font-bold mb-8">{userName}!</Text>
      
      <Text className="text-gray-400">Select a tab below to start.</Text>
    </SafeAreaView>
  );
}