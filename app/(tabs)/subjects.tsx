import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; 
import { db, auth } from "../../src/config/firebaseConfig";
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

interface Subject {
  id: string;
  name: string;
}

export default function SubjectsScreen() {
  const [subjectName, setSubjectName] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "subjects"), 
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Subject[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setSubjects(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addSubject = async () => {
    if (subjectName.trim() === "") return;
    try {
      await addDoc(collection(db, "subjects"), {
        name: subjectName,
        userId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
      });
      setSubjectName("");
    } catch (error) {
      Alert.alert("Error", "Could not add subject");
    }
  };

  const deleteSubject = async (id: string) => {
    try {
      await deleteDoc(doc(db, "subjects", id));
    } catch (error) {
      Alert.alert("Error", "Could not delete subject");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 p-4">
      <Text className="text-2xl font-bold text-gray-800 dark:text-white mb-6 mt-2">My Subjects</Text>

      {/* Input Section */}
      <View className="flex-row gap-2 mb-6">
        <TextInput
          className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-black dark:text-white"
          placeholder="New Subject..."
          placeholderTextColor="#9ca3af"
          value={subjectName}
          onChangeText={setSubjectName}
        />
        <TouchableOpacity 
          onPress={addSubject}
          className="bg-blue-600 justify-center items-center w-14 rounded-xl"
        >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
      </View>

      {/* List Section */}
      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" />
      ) : (
        <FlatList
          data={subjects}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="flex-row justify-between items-center bg-white dark:bg-gray-800 p-4 mb-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <Text className="text-lg text-gray-700 dark:text-gray-200">{item.name}</Text>
              <TouchableOpacity onPress={() => deleteSubject(item.id)}>
                <Ionicons name="trash-outline" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}