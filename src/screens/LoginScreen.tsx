import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebaseConfig";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isRegistering) {
        // Register new user
        await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert("Success", "Account created! You can now log in.");
      } else {
        // Login existing user
        await signInWithEmailAndPassword(auth, email, password);
        // We will navigate to Dashboard later
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-gray-100 px-6">
      <Text className="text-4xl font-bold text-blue-600 mb-2">Studymor</Text>
      <Text className="text-gray-500 mb-8">Study Smarter, Not Harder</Text>

      {/* Input Fields */}
      <TextInput
        className="w-full bg-white p-4 rounded-xl mb-4 border border-gray-200"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        className="w-full bg-white p-4 rounded-xl mb-6 border border-gray-200"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Main Button */}
      <TouchableOpacity
        onPress={handleAuth}
        className="w-full bg-blue-600 p-4 rounded-xl items-center"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-bold text-lg">
            {isRegistering ? "Sign Up" : "Log In"}
          </Text>
        )}
      </TouchableOpacity>

      {/* Toggle Login/Register */}
      <TouchableOpacity
        onPress={() => setIsRegistering(!isRegistering)}
        className="mt-4"
      >
        <Text className="text-blue-500">
          {isRegistering
            ? "Already have an account? Log In"
            : "Don't have an account? Sign Up"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}