import React, { useState, useCallback } from "react"; 
import { View, Text, ScrollView, Dimensions, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../src/config/firebaseConfig";
import { collection, query, where, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { LineChart } from "react-native-chart-kit";
import { useColorScheme } from "nativewind";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router"; 

const screenWidth = Dimensions.get("window").width;

// Fallback Quotes
const LOCAL_QUOTES = [
  { content: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { content: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { content: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { content: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { content: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
];

export default function Dashboard() {
  const [userName, setUserName] = useState("Student");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weeklyData, setWeeklyData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [labels, setLabels] = useState<string[]>([]);
  
  // Quote & Goal States
  const [quote, setQuote] = useState({ content: "Loading motivation...", author: "" });
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(60); 
  
  // Edit Goal Modal
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [newGoalInput, setNewGoalInput] = useState("");

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const fetchQuote = async () => {
    try {
      const response = await fetch("https://dummyjson.com/quotes/random");
      const data = await response.json();
      setQuote({ content: data.quote, author: data.author });
    } catch (error) {
      const randomLocal = LOCAL_QUOTES[Math.floor(Math.random() * LOCAL_QUOTES.length)];
      setQuote(randomLocal);
    }
  };

  // Define fetchData function
  const fetchData = async () => {
    if (!auth.currentUser) return;
    
    if (auth.currentUser.email) {
      setUserName(auth.currentUser.email.split("@")[0]);
    }

    try {
      // Load User Preferences
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists() && userDoc.data().dailyGoal) {
        setDailyGoal(userDoc.data().dailyGoal);
      }

      // Dates Logic
      const dates = [];
      const dayLabels = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]); 
        dayLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' })); 
      }
      setLabels(dayLabels);

      // Firestore Logic
      const q = query(collection(db, "study_sessions"), where("userId", "==", auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      const sessions = querySnapshot.docs.map(doc => doc.data());

      // Calculate Weekly Data
      const dataPoints = dates.map(dateStr => {
        const sessionsOnDay = sessions.filter((s: any) => s.date === dateStr);
        return sessionsOnDay.reduce((acc: number, curr: any) => acc + curr.durationMinutes, 0);
      });

      setWeeklyData(dataPoints);
      
      const todayVal = Math.round(dataPoints[6]);
      setTodayMinutes(todayVal);

    } catch (error) {
      console.log("Error fetching stats", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // This runs every time navigate TO dashboard
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  React.useEffect(() => {
    fetchQuote();
  }, []);

  const saveGoal = async () => {
    const goalNum = parseInt(newGoalInput);
    if (isNaN(goalNum) || goalNum <= 0) {
      Alert.alert("Invalid Goal", "Please enter a valid number (e.g. 60)");
      return;
    }

    try {
      if (auth.currentUser) {
        await setDoc(doc(db, "users", auth.currentUser.uid), { dailyGoal: goalNum }, { merge: true });
        setDailyGoal(goalNum);
        setGoalModalVisible(false);
        Alert.alert("Success", "Daily goal updated!");
        fetchData(); // Refresh data immediately after save
      }
    } catch (error) {
      Alert.alert("Error", "Could not save goal");
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
    fetchQuote();
  };

  const chartConfig = {
    backgroundGradientFrom: isDark ? "#1f2937" : "#ffffff",
    backgroundGradientTo: isDark ? "#1f2937" : "#ffffff",
    color: (opacity = 1) => isDark ? `rgba(96, 165, 250, ${opacity})` : `rgba(37, 99, 235, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    decimalPlaces: 0,
    labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
  };

  const progressPercent = Math.min((todayMinutes / dailyGoal) * 100, 100);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        {/* Header */}
        <View className="mb-6">
          <Text className="text-gray-500 dark:text-gray-400 text-lg font-medium">{getGreeting()},</Text>
          <Text className="text-3xl font-bold text-gray-800 dark:text-white">{userName}</Text>
        </View>

        {/* Daily Goal Section */}
        <TouchableOpacity 
          onPress={() => {
            setNewGoalInput(dailyGoal.toString());
            setGoalModalVisible(true);
          }}
          className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm mb-6 border border-gray-100 dark:border-gray-700"
        >
          <View className="flex-row justify-between mb-2 items-center">
            <View className="flex-row items-center gap-2">
              <Text className="font-bold text-gray-700 dark:text-gray-200">Daily Goal</Text>
              <Ionicons name="pencil" size={14} color="gray" />
            </View>
            <Text className="text-blue-600 dark:text-blue-400 font-bold">{todayMinutes} / {dailyGoal} mins</Text>
          </View>
          
          <View className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <View 
              className="h-full bg-blue-600 rounded-full" 
              style={{ width: `${progressPercent}%` }} 
            />
          </View>
          
          <Text className="text-xs text-gray-400 mt-2">
            {progressPercent >= 100 ? "🎉 Goal Reached! Amazing work!" : "Tap to edit your daily target."}
          </Text>
        </TouchableOpacity>

        {/* Chart Card */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 mb-6 border border-gray-100 dark:border-gray-700 items-center">
          <Text className="text-lg font-bold text-gray-800 dark:text-white mb-4 self-start">
            Weekly Focus
          </Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#2563eb" />
          ) : (
            <LineChart
              data={{
                labels: labels,
                datasets: [{ data: weeklyData }]
              }}
              width={screenWidth - 60}
              height={220}
              yAxisLabel=""
              yAxisSuffix="m"
              chartConfig={chartConfig}
              bezier
              style={{ marginVertical: 8, borderRadius: 16 }}
            />
          )}
        </View>

        {/* Summary Cards */}
        <View className="flex-row justify-between gap-4 mb-6">
          <View className="bg-blue-600 p-5 rounded-2xl flex-1 shadow-md">
            <Text className="text-blue-100 font-bold text-xs uppercase mb-1">Last 7 Days</Text>
            <Text className="text-white text-3xl font-bold">
              {Math.round(weeklyData.reduce((a, b) => a + b, 0))}
              <Text className="text-lg font-normal">m</Text>
            </Text>
          </View>

          <View className="bg-white dark:bg-gray-800 p-5 rounded-2xl flex-1 border border-gray-200 dark:border-gray-700 shadow-sm">
            <Text className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase mb-1">Daily Avg</Text>
            <Text className="text-gray-800 dark:text-white text-3xl font-bold">
              {Math.round(weeklyData.reduce((a, b) => a + b, 0) / 7)}
              <Text className="text-lg font-normal">m</Text>
            </Text>
          </View>
        </View>

        {/* Quote Card */}
        <View className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-2xl border border-purple-100 dark:border-purple-900/50">
          <View className="flex-row items-center mb-2">
            <Ionicons name="bulb" size={20} color="#9333ea" />
            <Text className="text-purple-700 dark:text-purple-300 font-bold ml-2">Daily Motivation</Text>
          </View>
          <Text className="text-gray-800 dark:text-gray-200 italic text-lg mb-2">
            "{quote.content}"
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-right font-bold">
            — {quote.author}
          </Text>
        </View>

      </ScrollView>

      {/* Goal Edit Modal */}
      <Modal visible={goalModalVisible} animationType="fade" transparent>
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-sm">
            <Text className="text-xl font-bold mb-4 text-center text-gray-800 dark:text-white">
              Set Daily Goal (Mins)
            </Text>
            
            <TextInput
              className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl text-center text-2xl font-bold mb-4 text-gray-800 dark:text-white"
              placeholder="e.g. 60"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={newGoalInput}
              onChangeText={setNewGoalInput}
              autoFocus
            />

            <TouchableOpacity 
              onPress={saveGoal}
              className="bg-blue-600 p-4 rounded-xl mb-2"
            >
              <Text className="text-white text-center font-bold">Save Goal</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setGoalModalVisible(false)} className="p-4">
              <Text className="text-gray-500 dark:text-gray-400 text-center font-bold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}