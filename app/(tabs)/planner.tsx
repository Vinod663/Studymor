import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, Modal, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { db, auth } from "../../src/config/firebaseConfig";
import { collection, addDoc, query, where, onSnapshot, orderBy } from "firebase/firestore";
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
  
  // iOS only state
  const [showPickerIOS, setShowPickerIOS] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // 1. Load Data
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Subjects
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

  // 2. Handle Date Picking (Cross-Platform Fix)
  const showDatepicker = () => {
    if (Platform.OS === 'android') {
      // ANDROID: Use Imperative API (Fixes the crash)
      DateTimePickerAndroid.open({
        value: date,
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            // Once date is picked, show Time Picker immediately
            const currentDate = selectedDate;
            DateTimePickerAndroid.open({
              value: currentDate,
              onChange: (_, selectedTime) => {
                 if (selectedTime) {
                   // Combine date and time
                   const finalDate = new Date(currentDate);
                   finalDate.setHours(selectedTime.getHours());
                   finalDate.setMinutes(selectedTime.getMinutes());
                   setDate(finalDate);
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
      // iOS: Show the component
      setShowPickerIOS(true);
    }
  };

  const onIOSChange = (event: any, selectedDate?: Date) => {
    setShowPickerIOS(false);
    if (selectedDate) setDate(selectedDate);
  };

  // 3. Save Session
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
      Alert.alert("Success", "Study session scheduled!");
      setSelectedSubject(null);
    } catch (error) {
      Alert.alert("Error", "Could not schedule session");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold text-gray-800 mb-6">Study Planner</Text>

      {/* ---SESSION CARD --- */}
      <View className="bg-white p-4 rounded-2xl shadow-sm mb-6">
        <Text className="text-gray-500 font-bold mb-2">SCHEDULE NEW SESSION</Text>
        
        {/* Subject Selector */}
        <TouchableOpacity 
          onPress={() => setModalVisible(true)}
          className="bg-gray-100 p-4 rounded-xl mb-3 border border-gray-200"
        >
          <Text className={selectedSubject ? "text-black" : "text-gray-400"}>
            {selectedSubject ? selectedSubject.name : "Select a Subject..."}
          </Text>
        </TouchableOpacity>

        {/* Date Picker Trigger */}
        <TouchableOpacity 
          onPress={showDatepicker}
          className="bg-gray-100 p-4 rounded-xl mb-4 border border-gray-200 flex-row justify-between"
        >
          <Text>{date.toLocaleString()}</Text>
          <Ionicons name="calendar-outline" size={20} color="gray" />
        </TouchableOpacity>

        {/* iOS ONLY Component */}
        {showPickerIOS && (
          <DateTimePicker 
             value={date} 
             mode="datetime" 
             display="default" 
             onChange={onIOSChange} 
          />
        )}

        <TouchableOpacity onPress={handleSchedule} className="bg-blue-600 p-4 rounded-xl items-center">
          <Text className="text-white font-bold text-lg">Schedule Session</Text>
        </TouchableOpacity>
      </View>

      {/* --- UPCOMING LIST --- */}
      <Text className="text-xl font-bold text-gray-800 mb-4">Upcoming Sessions</Text>
      <FlatList 
        data={sessions}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <View className="bg-white p-4 mb-3 rounded-xl border border-gray-100 flex-row justify-between items-center">
            <View>
              <Text className="text-lg font-bold text-blue-600">{item.subjectName}</Text>
              <Text className="text-gray-500">
                {new Date(item.date.seconds * 1000).toLocaleString()}
              </Text>
            </View>
            <Ionicons name="time-outline" size={24} color="gray" />
          </View>
        )}
      />

      {/* --- SUBJECT SELECTION MODAL --- */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end">
          <View className="bg-white p-6 rounded-t-3xl h-1/2 shadow-2xl">
            <Text className="text-xl font-bold mb-4 text-center">Pick a Subject</Text>
            <FlatList
              data={subjects}
              keyExtractor={i => i.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  className="p-4 border-b border-gray-100"
                  onPress={() => {
                    setSelectedSubject(item);
                    setModalVisible(false);
                  }}
                >
                  <Text className="text-lg text-center">{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setModalVisible(false)} className="mt-4 bg-gray-200 p-4 rounded-xl">
              <Text className="text-center font-bold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}