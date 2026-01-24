import { Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; 
import { signOut } from "firebase/auth";
import { auth } from "../../src/config/firebaseConfig";

export default function Dashboard() {
  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-white">
      <Text className="text-xl font-bold mb-4">Welcome to Dashboard</Text>
      
      <TouchableOpacity 
        onPress={() => signOut(auth)} 
        className="bg-red-500 px-6 py-3 rounded-xl mt-4"
      >
        <Text className="text-white font-bold">Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}