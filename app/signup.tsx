import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../src/config/firebaseConfig";
import { setDoc, doc } from "firebase/firestore";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        createdAt: new Date(),
        dailyGoal: 60
      });

      Alert.alert("Success", "Account created!");
      router.replace("/dashboard");
    } catch (error: any) {
      Alert.alert("Sign Up Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#111827', '#115e59', '#111827']} 
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ 
            flexGrow: 1, 
            justifyContent: 'center', 
            alignItems: 'center', 
            paddingHorizontal: 20, 
            paddingBottom: 40 
          }}
          keyboardShouldPersistTaps="handled"
        >
        
          {/* HEADER */}
          <Animated.View entering={FadeInUp.delay(200).duration(1000)} style={{ alignItems: 'center', marginBottom: 40 }}>
             {/* Teal Icon Background */}
             <View className="bg-teal-600/20 p-5 rounded-full mb-4 border border-teal-500/30">
              <Ionicons name="person-add" size={50} color="#2dd4bf" /> 
            </View>
            <Text className="text-4xl font-bold text-white">Join Studymor</Text>
            <Text className="text-gray-400 text-lg mt-2">Start your journey today</Text>
          </Animated.View>

          {/* DARK GLASS CARD */}
          <Animated.View 
            entering={FadeInDown.delay(400).duration(1000)} 
            className="bg-gray-800/90 p-8 rounded-3xl w-full shadow-2xl border border-gray-700"
          >
            {/* Email Input */}
            <View className="flex-row items-center bg-gray-700/50 p-4 rounded-xl mb-4 border border-gray-600">
              <Ionicons name="mail-outline" size={20} color="#9ca3af" />
              <TextInput
                className="flex-1 ml-3 text-white text-base"
                placeholder="Email Address"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Password Input */}
            <View className="flex-row items-center bg-gray-700/50 p-4 rounded-xl mb-6 border border-gray-600">
              <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />
              <TextInput
                className="flex-1 ml-3 text-white text-base"
                placeholder="Password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* Sign Up Button (TEAL) */}
            <TouchableOpacity
              onPress={handleSignUp}
              disabled={loading}
              className="bg-teal-600 p-4 rounded-xl items-center shadow-lg active:bg-teal-700 mb-4"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Back to Login */}
            <TouchableOpacity onPress={() => router.back()} className="mt-2">
              <Text className="text-gray-400 text-center">
                Already have an account? <Text className="text-teal-400 font-bold">Log In</Text>
              </Text>
            </TouchableOpacity>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}