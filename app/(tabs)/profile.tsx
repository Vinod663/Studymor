import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, Alert, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../src/config/firebaseConfig"; // Removed 'storage'
import { signOut } from "firebase/auth";
import { collection, query, where, orderBy, onSnapshot, doc, setDoc, getDoc } from "firebase/firestore"; // Added doc, setDoc, getDoc
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker'; 

interface StudySession {
  id: string;
  subjectName: string;
  durationMinutes: number;
  date: string;
}

export default function ProfileScreen() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const user = auth.currentUser;
  
  const [photoURL, setPhotoURL] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // 1. Load Profile Picture from Firestore (Database)
    const loadProfileImage = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().profileImage) {
          setPhotoURL(userDoc.data().profileImage);
        }
      } catch (e) {
        console.log("Error loading image", e);
      }
    };
    loadProfileImage();

    // 2. Load Study History
    const q = query(
      collection(db, "study_sessions"),
      where("userId", "==", user.uid),
      orderBy("completedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedSessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StudySession[];
      setSessions(loadedSessions);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 📸 1. PICK IMAGE & CONVERT TO TEXT
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your gallery!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2, // <--- CRITICAL: Keep quality low (0.2) to fit in Database
      base64: true, // <--- We ask for the "Text Code" of the image
    });

    if (!result.canceled && result.assets[0].base64) {
      saveImageToDatabase(result.assets[0].base64);
    }
  };

  // ☁️ 2. SAVE TEXT TO FIRESTORE
  const saveImageToDatabase = async (base64: string) => {
    if (!user) return;
    setUploading(true);

    try {
      // Create the data URL (Header + Code)
      const imageString = `data:image/jpeg;base64,${base64}`;

      // Save to "users" collection in Database
      await setDoc(doc(db, "users", user.uid), {
        profileImage: imageString
      }, { merge: true }); // 'merge' means don't delete other user data

      setPhotoURL(imageString); // Update UI instantly
      Alert.alert("Success", "Profile picture updated!");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save image.");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: () => signOut(auth) }
    ]);
  };

  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.floor(totalMinutes % 60);

  const todayDate = new Date().toISOString().split('T')[0];
  const todayMinutes = sessions
    .filter(s => s.date === todayDate)
    .reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const todayH = Math.floor(todayMinutes / 60);
  const todayM = Math.floor(todayMinutes % 60);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white p-6 mb-4 border-b border-gray-200">
        <View className="flex-row items-center mb-6">
          
          {/* PROFILE PICTURE */}
          <TouchableOpacity onPress={pickImage} className="mr-4 relative">
            {uploading ? (
              <View className="w-20 h-20 bg-gray-100 rounded-full justify-center items-center">
                <ActivityIndicator color="#2563eb" />
              </View>
            ) : photoURL ? (
              <Image 
                source={{ uri: photoURL }} 
                className="w-20 h-20 rounded-full border-2 border-blue-100" 
              />
            ) : (
              <View className="w-20 h-20 bg-blue-100 rounded-full justify-center items-center">
                <Ionicons name="person" size={40} color="#2563eb" />
              </View>
            )}
            
            <View className="absolute bottom-0 right-0 bg-blue-600 w-7 h-7 rounded-full justify-center items-center border-2 border-white">
              <Ionicons name="camera" size={14} color="white" />
            </View>
          </TouchableOpacity>

          <View>
            <Text className="text-xl font-bold text-gray-800">My Profile</Text>
            <Text className="text-gray-500">{user?.email}</Text>
            <Text className="text-xs text-blue-600 mt-1">Tap photo to edit</Text>
          </View>
        </View>

        {/* STATS CARD */}
        <View className="flex-row justify-between bg-blue-50 p-4 rounded-xl border border-blue-100">
          <View className="items-center flex-1">
            <Text className="text-2xl font-bold text-green-600">{todayH}h {todayM}m</Text>
            <Text className="text-xs text-gray-500 uppercase font-bold">Today</Text>
          </View>
          <View className="w-[1px] bg-blue-200" />
          <View className="items-center flex-1">
            <Text className="text-2xl font-bold text-blue-600">{hours}h {mins}m</Text>
            <Text className="text-xs text-gray-500 uppercase">Total Time</Text>
          </View>
          <View className="w-[1px] bg-blue-200" />
          <View className="items-center flex-1">
            <Text className="text-2xl font-bold text-gray-700">{totalSessions}</Text>
            <Text className="text-xs text-gray-500 uppercase">Sessions</Text>
          </View>
        </View>
      </View>

      {/* HISTORY LIST */}
      <View className="flex-1 px-4">
        <Text className="text-lg font-bold text-gray-800 mb-3 ml-1">Study History</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" />
        ) : sessions.length === 0 ? (
          <View className="items-center justify-center py-10">
            <Ionicons name="time-outline" size={48} color="#ccc" />
            <Text className="text-gray-400 mt-2">No study sessions yet.</Text>
          </View>
        ) : (
          <FlatList
            data={sessions}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View className="bg-white p-4 mb-3 rounded-xl border border-gray-100 flex-row justify-between items-center shadow-sm">
                <View>
                  <Text className="text-base font-bold text-gray-800">{item.subjectName}</Text>
                  <Text className="text-xs text-gray-400">{item.date}</Text>
                </View>
                <View className="bg-green-50 px-3 py-1 rounded-full border border-green-100">
                  <Text className="text-green-700 font-bold text-xs">
                    {Math.round(item.durationMinutes)} min
                  </Text>
                </View>
              </View>
            )}
            ListFooterComponent={<View className="h-20" />}
          />
        )}
      </View>

      <View className="p-4 bg-white border-t border-gray-200">
        <TouchableOpacity onPress={handleLogout} className="bg-red-50 p-4 rounded-xl flex-row justify-center items-center border border-red-100">
          <Ionicons name="log-out-outline" size={20} color="#dc2626" />
          <Text className="text-red-600 font-bold ml-2">Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}