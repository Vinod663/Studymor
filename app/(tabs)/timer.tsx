import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Modal, FlatList, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from "../../src/config/firebaseConfig";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { Audio } from "expo-av"; 

interface Subject {
  id: string;
  name: string;
}

const RINGTONES = [
  { id: '1', name: 'Classic Alarm', uri: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg' },
  { id: '2', name: 'Digital Beep', uri: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' },
  { id: '3', name: 'Soft Chime', uri: 'https://actions.google.com/sounds/v1/alarms/medium_bell_ringing_near.ogg' },
  { id: '4', name: 'Bugle Wake Up', uri: 'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg' },
];

export default function TimerScreen() {
  const [timeLeft, setTimeLeft] = useState(25 * 60); 
  const [isActive, setIsActive] = useState(false);
  const [initialTime, setInitialTime] = useState(25 * 60); 
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  
  const [subjectModalVisible, setSubjectModalVisible] = useState(false);
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [soundModalVisible, setSoundModalVisible] = useState(false); 
  
  const [customMinutes, setCustomMinutes] = useState("");
  const [selectedSound, setSelectedSound] = useState(RINGTONES[0]); 

  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(collection(db, "subjects"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSubjects(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
    });
    return () => unsubscribe();
  }, []);

  async function playAlarm() {
    try {
      if (soundRef.current) await soundRef.current.unloadAsync();
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: selectedSound.uri }, 
        { isLooping: true }
      );
      soundRef.current = newSound; 
      await newSound.playAsync();
    } catch (error) {
      console.log("Error playing alarm", error);
    }
  }

  async function stopAlarm() {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  }

  // Save Session to Firestore
  const saveSession = async () => {
    if (!auth.currentUser || !selectedSubject) return;

    // Calculate minutes studied
    const durationMinutes = initialTime / 60;

    try {
      await addDoc(collection(db, "study_sessions"), {
        userId: auth.currentUser.uid,
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.name,
        durationMinutes: durationMinutes,
        completedAt: serverTimestamp(),
        date: new Date().toISOString().split('T')[0] 
      });
      console.log("Session Saved!");
    } catch (error) {
      console.log("Error saving session", error);
    }
  };

  useEffect(() => {
    return () => { if (soundRef.current) soundRef.current.unloadAsync(); };
  }, []);

  useEffect(() => {
    let interval: any = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false); 
      playAlarm();  
      saveSession(); 

      Alert.alert(
        "Time's Up!",
        "Session Saved! Great focus.",
        [
          { 
            text: "Stop Alarm", 
            onPress: () => {
              stopAlarm();  
              setTimeLeft(initialTime); 
            },
            style: "cancel" 
          }
        ]
      );
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const toggleTimer = () => {
    if (!selectedSubject && !isActive) {
      Alert.alert("Wait!", "Please select a subject to focus on first.");
      return;
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    stopAlarm(); 
    setTimeLeft(initialTime); 
  };

  const setCustomTime = () => {
    const minutes = parseInt(customMinutes);
    if (isNaN(minutes) || minutes <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid number of minutes.");
      return;
    }
    const totalSeconds = minutes * 60;
    setTimeLeft(totalSeconds);
    setInitialTime(totalSeconds); 
    setTimeModalVisible(false);
    setCustomMinutes("");
    setIsActive(false); 
  };

  const previewSound = async (uri: string) => {
    try {
      if (soundRef.current) await soundRef.current.unloadAsync();
      const { sound } = await Audio.Sound.createAsync({ uri });
      soundRef.current = sound;
      await sound.playAsync();
    } catch (err) {}
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 p-6 justify-center items-center">
      
      <TouchableOpacity 
        onPress={() => setSubjectModalVisible(true)}
        className="bg-white px-6 py-3 rounded-full shadow-sm mb-4 border border-gray-100"
      >
        <Text className="text-lg text-blue-600 font-bold">
          {selectedSubject ? `Subject: ${selectedSubject.name}` : "Tap to Select Subject"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => setSoundModalVisible(true)}
        className="flex-row items-center bg-gray-200 px-4 py-2 rounded-full mb-8"
      >
        <Ionicons name="musical-notes" size={16} color="gray" />
        <Text className="text-gray-600 font-bold ml-2">Sound: {selectedSound.name}</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => setTimeModalVisible(true)} 
        className="bg-white w-72 h-72 rounded-full justify-center items-center shadow-lg border-4 border-blue-100 mb-12"
      >
        <Text className="text-6xl font-bold text-gray-800 tracking-widest">
          {formatTime(timeLeft)}
        </Text>
        <Text className="text-gray-400 mt-2 font-medium">
          {isActive ? "Stay Focused" : "Tap to Change Time"}
        </Text>
      </TouchableOpacity>

      <View className="flex-row gap-6">
        <TouchableOpacity 
          onPress={toggleTimer}
          className={`${isActive ? "bg-yellow-500" : "bg-blue-600"} w-20 h-20 rounded-full justify-center items-center shadow-md`}
        >
          <Ionicons name={isActive ? "pause" : "play"} size={32} color="white" />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={resetTimer}
          className="bg-gray-200 w-20 h-20 rounded-full justify-center items-center"
        >
          <Ionicons name="refresh" size={32} color="gray" />
        </TouchableOpacity>
      </View>

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

      <Modal visible={soundModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white p-6 rounded-t-3xl h-1/2">
            <Text className="text-xl font-bold mb-4 text-center">Choose Ringtone</Text>
            <FlatList
              data={RINGTONES}
              keyExtractor={i => i.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  className={`p-4 border-b border-gray-100 flex-row justify-between items-center ${selectedSound.id === item.id ? "bg-blue-50" : ""}`}
                  onPress={() => {
                     previewSound(item.uri);
                     setSelectedSound(item);
                  }}
                >
                  <Text className={`text-lg ${selectedSound.id === item.id ? "text-blue-600 font-bold" : "text-gray-700"}`}>
                    {item.name}
                  </Text>
                  {selectedSound.id === item.id && <Ionicons name="checkmark" size={20} color="#2563eb" />}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity 
              onPress={() => {
                stopAlarm();
                setSoundModalVisible(false);
              }} 
              className="mt-4 bg-blue-600 p-4 rounded-xl"
            >
              <Text className="text-center font-bold text-white">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={timeModalVisible} animationType="fade" transparent>
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-white p-6 rounded-2xl w-full max-w-sm">
            <Text className="text-xl font-bold mb-4 text-center">Set Timer Duration</Text>
            <TextInput
              className="bg-gray-100 p-4 rounded-xl text-center text-2xl font-bold mb-4"
              placeholder="Enter minutes"
              keyboardType="numeric"
              value={customMinutes}
              onChangeText={setCustomMinutes}
              autoFocus
            />
            <TouchableOpacity onPress={setCustomTime} className="bg-blue-600 p-4 rounded-xl mb-2">
              <Text className="text-white text-center font-bold">Set Time</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTimeModalVisible(false)} className="p-4">
              <Text className="text-gray-500 text-center font-bold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}