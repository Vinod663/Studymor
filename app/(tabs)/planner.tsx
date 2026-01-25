import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, Modal, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { db, auth } from "../../src/config/firebaseConfig";
import { collection, addDoc, query, where, onSnapshot, orderBy, deleteDoc, updateDoc, doc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

interface Session {
  id: string;
  subjectName: string;
  date: any; // Firestore Timestamp
}

interface Subject {
  id: string;
  name: string;
}

export default function PlannerScreen() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [date, setDate] = useState(new Date());
  
  // UI States
  const [showPickerIOS, setShowPickerIOS] = useState(false);
  const [subjectModalVisible, setSubjectModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  // 1. Load Data
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const subQ = query(collection(db, "subjects"), where("userId", "==", user.uid));
    const unsubSub = onSnapshot(subQ, (snap) => {
      setSubjects(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
    });

    // Order by Date Ascending (Oldest/Expired first, then Upcoming)
    const sessQ = query(
      collection(db, "sessions"), 
      where("userId", "==", user.uid),
      orderBy("date", "asc")
    );
    const unsubSess = onSnapshot(sessQ, (snap) => {
      setSessions(snap.docs.map(d => ({ 
        id: d.id, 
        subjectName: d.data().subjectName,
        date: d.data().date 
      })));
    });

    return () => { unsubSub(); unsubSess(); };
  }, []);

  // 2. Date Picker Logic (Reused for Create AND Update)
  const showDatepicker = (currentValue: Date, isUpdate: boolean = false) => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: currentValue,
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            const currentDate = selectedDate;
            DateTimePickerAndroid.open({
              value: currentDate,
              onChange: async (_, selectedTime) => {
                 if (selectedTime) {
                   const finalDate = new Date(currentDate);
                   finalDate.setHours(selectedTime.getHours());
                   finalDate.setMinutes(selectedTime.getMinutes());
                   
                   if (isUpdate && selectedSession) {
                     // If updating, save immediately
                     await updateSessionDate(selectedSession.id, finalDate);
                   } else {
                     // If creating, just set state
                     setDate(finalDate);
                   }
                 }
              },
              mode: 'time',
              is24Hour: true,
            });
          }
        },
        mode: 'date',
        is24Hour: true,
      });
    } else {
      setShowPickerIOS(true); // iOS logic requires separate handling for updates, keeping simple for now
    }
  };

  // 3. CRUD Operations
  const handleSchedule = async () => {
    if (!selectedSubject) {
      Alert.alert("Error", "Please select a subject first!");
      return;
    }
    try {
      await addDoc(collection(db, "sessions"), {
        userId: auth.currentUser?.uid,
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.name,
        date: date,
        completed: false
      });
      Alert.alert("Success", "Session Scheduled!");
      setSelectedSubject(null);
    } catch (error) {
      Alert.alert("Error", "Could not schedule session");
    }
  };

  const deleteSession = async (id: string) => {
    try {
      await deleteDoc(doc(db, "sessions", id));
      setEditModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "Could not delete session");
    }
  };

  const updateSessionDate = async (id: string, newDate: Date) => {
    try {
      await updateDoc(doc(db, "sessions", id), { date: newDate });
      setEditModalVisible(false);
      Alert.alert("Success", "Session Rescheduled!");
    } catch (error) {
      Alert.alert("Error", "Could not update session");
    }
  };

  // Helper to check expiry
  const isExpired = (sessionDate: any) => {
    const now = new Date();
    const sDate = new Date(sessionDate.seconds * 1000);
    return sDate < now;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold text-gray-800 mb-6">Study Planner</Text>

      {/* --- CREATE NEW SESSION --- */}
      <View className="bg-white p-4 rounded-2xl shadow-sm mb-6">
        <Text className="text-gray-500 font-bold mb-2">SCHEDULE NEW SESSION</Text>
        
        <TouchableOpacity 
          onPress={() => setSubjectModalVisible(true)}
          className="bg-gray-100 p-4 rounded-xl mb-3 border border-gray-200"
        >
          <Text className={selectedSubject ? "text-black" : "text-gray-400"}>
            {selectedSubject ? selectedSubject.name : "Select a Subject..."}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => showDatepicker(date)}
          className="bg-gray-100 p-4 rounded-xl mb-4 border border-gray-200 flex-row justify-between"
        >
          <Text>{date.toLocaleString()}</Text>
          <Ionicons name="calendar-outline" size={20} color="gray" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSchedule} className="bg-blue-600 p-4 rounded-xl items-center">
          <Text className="text-white font-bold text-lg">Schedule Session</Text>
        </TouchableOpacity>
      </View>

      {/* --- SESSION LIST --- */}
      <Text className="text-xl font-bold text-gray-800 mb-4">Your Schedule</Text>
      <FlatList 
        data={sessions}
        keyExtractor={i => i.id}
        renderItem={({ item }) => {
            const expired = isExpired(item.date);
            return (
              <TouchableOpacity 
                onPress={() => {
                  setSelectedSession(item);
                  setEditModalVisible(true);
                }}
                className={`p-4 mb-3 rounded-xl border flex-row justify-between items-center ${expired ? "bg-gray-100 border-gray-200" : "bg-white border-gray-100"}`}
              >
                <View>
                  <Text className={`text-lg font-bold ${expired ? "text-gray-400" : "text-blue-600"}`}>
                    {item.subjectName} {expired && "(Expired)"}
                  </Text>
                  <Text className="text-gray-500">
                    {new Date(item.date.seconds * 1000).toLocaleString()}
                  </Text>
                </View>
                <Ionicons 
                  name={expired ? "alert-circle-outline" : "create-outline"} 
                  size={24} 
                  color="gray" 
                />
              </TouchableOpacity>
            );
        }}
      />

      {/* --- SUBJECT SELECTION MODAL --- */}
      <Modal visible={subjectModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white p-6 rounded-t-3xl h-1/2">
            <Text className="text-xl font-bold mb-4 text-center">Pick a Subject</Text>
            <FlatList
              data={subjects}
              keyExtractor={i => i.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  className="p-4 border-b border-gray-100"
                  onPress={() => { setSelectedSubject(item); setSubjectModalVisible(false); }}
                >
                  <Text className="text-lg text-center">{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setSubjectModalVisible(false)} className="mt-4 bg-gray-200 p-4 rounded-xl">
              <Text className="text-center font-bold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- EDIT/DELETE MODAL --- */}
      <Modal visible={editModalVisible} animationType="fade" transparent>
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-white p-6 rounded-2xl w-full max-w-sm">
            <Text className="text-xl font-bold mb-2 text-center">Manage Session</Text>
            <Text className="text-center text-gray-500 mb-6">
              {selectedSession?.subjectName}
            </Text>

            {/* Reschedule Button */}
            <TouchableOpacity 
              onPress={() => {
                // Open Date Picker in "Update Mode"
                if (selectedSession) {
                   showDatepicker(new Date(selectedSession.date.seconds * 1000), true);
                }
              }}
              className="bg-blue-600 p-4 rounded-xl mb-3"
            >
              <Text className="text-white text-center font-bold">Reschedule Time</Text>
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity 
              onPress={() => selectedSession && deleteSession(selectedSession.id)}
              className="bg-red-100 p-4 rounded-xl mb-3"
            >
              <Text className="text-red-600 text-center font-bold">Delete Session</Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity onPress={() => setEditModalVisible(false)} className="p-4">
              <Text className="text-gray-500 text-center font-bold">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}