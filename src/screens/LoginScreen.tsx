import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useAuth } from "../state/AuthContext";
import tw from "twrnc";

const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");

  const trimmed = useMemo(() => username.trim(), [username]);
  const isDisabled = trimmed.length === 0;

  const handleSubmit = async () => {
    if (isDisabled) return;
    await login(trimmed);
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <View style={tw`flex-1 px-6 justify-center`}>
        <View style={tw`mb-6`}>
          <Text style={tw`text-3xl font-bold mb-1`}>Welcome</Text>
          <Text style={tw`text-base text-gray-600`}>
            Log in or sign up
          </Text>
        </View>

        <View style={tw`mb-4`}>
          <Text style={tw`text-sm text-gray-700 mb-2`}>Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="e.g. johndoe"
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            style={tw`border border-gray-300 rounded-xl px-4 py-3 text-base`}
          />
          <Text style={tw`text-xs text-gray-500 mt-2`}>
            This will be used to keep your tasks on this device.
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isDisabled}
          style={tw.style(
            `rounded-xl py-3 items-center`,
            isDisabled ? `bg-gray-300` : `bg-blue-600`
          )}
        >
          <Text style={tw`text-white font-bold text-base`}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;
