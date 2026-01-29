import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Dimensions, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../src/config/firebaseConfig";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { LineChart } from "react-native-chart-kit";
import { useColorScheme } from "nativewind";

const screenWidth = Dimensions.get("window").width;

export default function Dashboard() {
  const [userName, setUserName] = useState("Student");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weeklyData, setWeeklyData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [labels, setLabels] = useState<string[]>([]);
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  //Get Greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  //Fetch & Process Data
  const fetchData = async () => {
    if (!auth.currentUser) return;
    
    // Set Name
    if (auth.currentUser.email) {
      setUserName(auth.currentUser.email.split("@")[0]);
    }

    try {
      // Get last 7 days dates
      const dates = [];
      const dayLabels = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]); // "2026-01-29"
        dayLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' })); // "Thu"
      }
      setLabels(dayLabels);

      // Fetch Sessions
      const q = query(
        collection(db, "study_sessions"),
        where("userId", "==", auth.currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const sessions = querySnapshot.docs.map(doc => doc.data());

      // Aggregate Data (Sum minutes per day)
      const dataPoints = dates.map(dateStr => {
        const sessionsOnDay = sessions.filter((s: any) => s.date === dateStr);
        const totalMinutes = sessionsOnDay.reduce((acc: number, curr: any) => acc + curr.durationMinutes, 0);
        return totalMinutes;
      });

      setWeeklyData(dataPoints);

    } catch (error) {
      console.log("Error fetching stats", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  //Chart Configuration
  const chartConfig = {
    backgroundGradientFrom: isDark ? "#1f2937" : "#ffffff",
    backgroundGradientTo: isDark ? "#1f2937" : "#ffffff",
    color: (opacity = 1) => isDark ? `rgba(96, 165, 250, ${opacity})` : `rgba(37, 99, 235, ${opacity})`, // Blue
    strokeWidth: 2,
    barPercentage: 0.5,
    decimalPlaces: 0,
    labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView 
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        {/* Header */}
        <View className="mb-6">
          <Text className="text-gray-500 dark:text-gray-400 text-lg font-medium">{getGreeting()},</Text>
          <Text className="text-3xl font-bold text-gray-800 dark:text-white">{userName}</Text>
        </View>

        {/* Chart Card */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 mb-6 border border-gray-100 dark:border-gray-700 items-center">
          <Text className="text-lg font-bold text-gray-800 dark:text-white mb-4 self-start">
            Weekly Focus (Minutes)
          </Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#2563eb" />
          ) : (
            <LineChart
              data={{
                labels: labels,
                datasets: [{ data: weeklyData }]
              }}
              width={screenWidth - 60} // Width based on screen
              height={220}
              yAxisLabel=""
              yAxisSuffix="m"
              chartConfig={chartConfig}
              bezier // Makes the line curved
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
          )}
        </View>

        {/* Summary Cards */}
        <View className="flex-row justify-between gap-4">
          <View className="bg-blue-600 p-5 rounded-2xl flex-1 shadow-md">
            <Text className="text-blue-100 font-bold text-xs uppercase mb-1">Last 7 Days</Text>
            <Text className="text-white text-3xl font-bold">
              {Math.round(weeklyData.reduce((a, b) => a + b, 0))}
              <Text className="text-lg font-normal"> mins</Text>
            </Text>
          </View>

          <View className="bg-white dark:bg-gray-800 p-5 rounded-2xl flex-1 border border-gray-200 dark:border-gray-700 shadow-sm">
            <Text className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase mb-1">Daily Avg</Text>
            <Text className="text-gray-800 dark:text-white text-3xl font-bold">
              {Math.round(weeklyData.reduce((a, b) => a + b, 0) / 7)}
              <Text className="text-lg font-normal text-gray-500"> mins</Text>
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}