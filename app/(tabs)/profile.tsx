import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, Alert, ActivityIndicator, Image, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../src/config/firebaseConfig";
import { signOut } from "firebase/auth";
import { collection, query, where, orderBy, onSnapshot, doc, setDoc, getDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from "nativewind"; 

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
  
  //DARK MODE HOOK
  const { colorScheme, toggleColorScheme } = useColorScheme();

  useEffect(() => {
    if (!user) return;

    const loadProfileImage = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().profileImage) {
          setPhotoURL(userDoc.data().profileImage);
        }
      } catch (e) { console.log(e); }
    };
    loadProfileImage();

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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      saveImageToDatabase(result.assets[0].base64);
    }
  };

  const saveImageToDatabase = async (base64: string) => {
    if (!user) return;
    setUploading(true);
    try {
      const imageString = `data:image/jpeg;base64,${base64}`;
      await setDoc(doc(db, "users", user.uid), { profileImage: imageString }, { merge: true });
      setPhotoURL(imageString);
      Alert.alert("Success", "Profile picture updated!");
    } catch (error) {
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
  const todayMinutes = sessions.filter(s => s.date === todayDate).reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const todayH = Math.floor(todayMinutes / 60);
  const todayM = Math.floor(todayMinutes % 60);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      
      {/* HEADER: dark:bg-gray-800 dark:border-gray-700 */}
      <View className="bg-white dark:bg-gray-800 p-6 mb-4 border-b border-gray-200 dark:border-gray-700">
        
        {/* ROW: Profile + Theme Toggle */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={pickImage} className="mr-4 relative">
              {uploading ? (
                <View className="w-16 h-16 bg-gray-100 rounded-full justify-center items-center">
                  <ActivityIndicator color="#2563eb" />
                </View>
              ) : photoURL ? (
                <Image source={{ uri: photoURL }} className="w-16 h-16 rounded-full border-2 border-blue-100" />
              ) : (
                <View className="w-16 h-16 bg-blue-100 rounded-full justify-center items-center">
                  <Ionicons name="person" size={32} color="#2563eb" />
                </View>
              )}
              <View className="absolute bottom-0 right-0 bg-blue-600 w-6 h-6 rounded-full justify-center items-center border-2 border-white">
                <Ionicons name="camera" size={12} color="white" />
              </View>
            </TouchableOpacity>

            <View>
              {/* TEXT: dark:text-white */}
              <Text className="text-xl font-bold text-gray-800 dark:text-white">My Profile</Text>
              <Text className="text-gray-500 dark:text-gray-400 text-xs">{user?.email}</Text>
            </View>
          </View>

          {/*THEME SWITCH */}
          <View className="items-end">
            <Text className="text-xs text-gray-400 mb-1">Dark Mode</Text>
            <Switch 
              value={colorScheme === 'dark'} 
              onValueChange={toggleColorScheme}
              trackColor={{ false: "#767577", true: "#2563eb" }}
              thumbColor={colorScheme === 'dark' ? "#f4f3f4" : "#f4f3f4"}
            />
          </View>
        </View>


        <View className="flex-row justify-between bg-blue-50 dark:bg-gray-700 p-4 rounded-xl border border-blue-100 dark:border-gray-600">
          <View className="items-center flex-1">
            <Text className="text-xl font-bold text-green-600 dark:text-green-400">{todayH}h {todayM}m</Text>
            <Text className="text-[10px] text-gray-500 dark:text-gray-300 uppercase font-bold">Today</Text>
          </View>
          <View className="w-[1px] bg-blue-200 dark:bg-gray-500" />
          <View className="items-center flex-1">
            <Text className="text-xl font-bold text-blue-600 dark:text-blue-400">{hours}h {mins}m</Text>
            <Text className="text-[10px] text-gray-500 dark:text-gray-300 uppercase">Total</Text>
          </View>
          <View className="w-[1px] bg-blue-200 dark:bg-gray-500" />
          <View className="items-center flex-1">
            <Text className="text-xl font-bold text-gray-700 dark:text-white">{totalSessions}</Text>
            <Text className="text-[10px] text-gray-500 dark:text-gray-300 uppercase">Sessions</Text>
          </View>
        </View>
      </View>

      {/* HISTORY LIST */}
      <View className="flex-1 px-4">
        <Text className="text-lg font-bold text-gray-800 dark:text-white mb-3 ml-1">Study History</Text>
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
              <View className="bg-white dark:bg-gray-800 p-4 mb-3 rounded-xl border border-gray-100 dark:border-gray-700 flex-row justify-between items-center shadow-sm">
                <View>
                  <Text className="text-base font-bold text-gray-800 dark:text-gray-100">{item.subjectName}</Text>
                  <Text className="text-xs text-gray-400">{item.date}</Text>
                </View>
                <View className="bg-green-50 dark:bg-gray-700 px-3 py-1 rounded-full border border-green-100 dark:border-gray-600">
                  <Text className="text-green-700 dark:text-green-400 font-bold text-xs">
                    {Math.round(item.durationMinutes)} min
                  </Text>
                </View>
              </View>
            )}
            ListFooterComponent={<View className="h-20" />}
          />
        )}
      </View>

      {/* LOGOUT */}
      <View className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <TouchableOpacity onPress={handleLogout} className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl flex-row justify-center items-center border border-red-100 dark:border-red-900/50">
          <Ionicons name="log-out-outline" size={20} color="#dc2626" />
          <Text className="text-red-600 font-bold ml-2">Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}