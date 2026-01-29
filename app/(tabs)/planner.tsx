import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, Modal, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { db, auth } from "../../src/config/firebaseConfig";
import { collection, addDoc, query, where, onSnapshot, orderBy, deleteDoc, updateDoc, doc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind"; 

interface Session {
  id: string;
  subjectName: string;
  date: any; 
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

  // Hook for icon colors
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#9ca3af" : "gray"; // Light gray in dark mode

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const subQ = query(collection(db, "subjects"), where("userId", "==", user.uid));
    const unsubSub = onSnapshot(subQ, (snap) => {
      setSubjects(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
    });

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
                     await updateSessionDate(selectedSession.id, finalDate);
                   } else {
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
      setShowPickerIOS(true);
    }
  };

  const handleSchedule = async () => {
    if (!selectedSubject) {
      Alert.alert("Error", "Please select a subject first!");
      return;
    }

    if (date < new Date()) {
       Alert.alert("Error", "You cannot schedule a session in the past!");
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

  const isExpired = (sessionDate: any) => {
    const now = new Date();
    const sDate = new Date(sessionDate.seconds * 1000);
    return sDate < now;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 p-4">
      <Text className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Study Planner</Text>

      {/* --- CREATE NEW SESSION CARD --- */}
      <View className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm mb-6">
        <Text className="text-gray-500 dark:text-gray-400 font-bold mb-2">SCHEDULE NEW SESSION</Text>
        
        {/* Subject Selector */}
        <TouchableOpacity 
          onPress={() => setSubjectModalVisible(true)}
          className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl mb-3 border border-gray-200 dark:border-gray-600"
        >
          <Text className={selectedSubject ? "text-black dark:text-white" : "text-gray-400 dark:text-gray-500"}>
            {selectedSubject ? selectedSubject.name : "Select a Subject..."}
          </Text>
        </TouchableOpacity>

        {/* Date Picker Trigger */}
        <TouchableOpacity 
          onPress={() => showDatepicker(date)}
          className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl mb-4 border border-gray-200 dark:border-gray-600 flex-row justify-between"
        >
          <Text className="text-black dark:text-white">{date.toLocaleString()}</Text>
          <Ionicons name="calendar-outline" size={20} color={iconColor} />
        </TouchableOpacity>

        {showPickerIOS && (
          <DateTimePicker 
            value={date}
            mode="datetime"
            display="default"
            onChange={(event, selectedDate) => {
              setShowPickerIOS(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        <TouchableOpacity onPress={handleSchedule} className="bg-blue-600 p-4 rounded-xl items-center">
          <Text className="text-white font-bold text-lg">Schedule Session</Text>
        </TouchableOpacity>
      </View>

      {/* --- LIST HEADER --- */}
      <Text className="text-xl font-bold text-gray-800 dark:text-white mb-4">Your Schedule</Text>
      
      {/* --- SCHEDULE LIST --- */}
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
                className={`p-4 mb-3 rounded-xl border flex-row justify-between items-center 
                  ${expired 
                    ? "bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700" 
                    : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700" 
                  }`}
              >
                <View>
                  <Text className={`text-lg font-bold ${expired ? "text-gray-400 dark:text-gray-500" : "text-blue-600 dark:text-blue-400"}`}>
                    {item.subjectName} {expired && "(Expired)"}
                  </Text>
                  <Text className="text-gray-500 dark:text-gray-400">
                    {new Date(item.date.seconds * 1000).toLocaleString()}
                  </Text>
                </View>
                <Ionicons 
                  name={expired ? "alert-circle-outline" : "create-outline"} 
                  size={24} 
                  color={iconColor} 
                />
              </TouchableOpacity>
            );
        }}
      />

      {/* --- SUBJECT SELECTION MODAL --- */}
      <Modal visible={subjectModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-gray-800 p-6 rounded-t-3xl h-1/2">
            <Text className="text-xl font-bold mb-4 text-center text-gray-800 dark:text-white">Pick a Subject</Text>
            <FlatList
              data={subjects}
              keyExtractor={i => i.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  className="p-4 border-b border-gray-100 dark:border-gray-700"
                  onPress={() => { setSelectedSubject(item); setSubjectModalVisible(false); }}
                >
                  <Text className="text-lg text-center text-gray-800 dark:text-gray-200">{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setSubjectModalVisible(false)} className="mt-4 bg-gray-200 dark:bg-gray-700 p-4 rounded-xl">
              <Text className="text-center font-bold text-gray-800 dark:text-white">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- EDIT/DELETE MODAL --- */}
      <Modal visible={editModalVisible} animationType="fade" transparent>
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-sm">
            <Text className="text-xl font-bold mb-2 text-center text-gray-800 dark:text-white">Manage Session</Text>
            <Text className="text-center text-gray-500 dark:text-gray-400 mb-6">
              {selectedSession?.subjectName}
            </Text>

            <TouchableOpacity 
              onPress={() => {
                if (selectedSession) {
                   showDatepicker(new Date(selectedSession.date.seconds * 1000), true);
                }
              }}
              className="bg-blue-600 p-4 rounded-xl mb-3"
            >
              <Text className="text-white text-center font-bold">Reschedule Time</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => selectedSession && deleteSession(selectedSession.id)}
              className="bg-red-100 dark:bg-red-900/30 p-4 rounded-xl mb-3"
            >
              <Text className="text-red-600 dark:text-red-400 text-center font-bold">Delete Session</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setEditModalVisible(false)} className="p-4">
              <Text className="text-gray-500 dark:text-gray-400 text-center font-bold">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}