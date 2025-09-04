import React from "react";
import { SafeAreaView, View, Text, TouchableOpacity } from "react-native";
import tw from "twrnc";
import { useAuth } from "../state/AuthContext";

const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <View style={tw`px-4 py-4`}>
        <Text style={tw`text-2xl font-bold mb-1`}>Settings</Text>
        <Text style={tw`text-gray-600 mb-6`}>{user?.email ?? "Signed in"}</Text>

        <TouchableOpacity
          onPress={logout}
          style={tw`border border-gray-300 rounded-xl px-4 py-3`}
        >
          <Text style={tw`text-black font-semibold`}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default SettingsScreen;
