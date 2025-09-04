import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import tw from "twrnc";
import { useAuth } from "../state/AuthContext";

const AuthScreen: React.FC = () => {
  const { loginWithEmail, signupWithEmail } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const trimmedEmail = useMemo(() => email.trim(), [email]);
  const isDisabled = trimmedEmail.length === 0 || password.length < 6;

  const handleContinue = async () => {
    if (isDisabled) return;
    if (mode === "signup") {
      await signupWithEmail(trimmedEmail, password);
    } else {
      await loginWithEmail(trimmedEmail, password);
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <View style={tw`flex-1 px-6`}>
        <View style={tw`mt-8 mb-12`}>
          <Text style={tw`text-xl font-bold`}>Justdo</Text>
        </View>

        <View style={tw`flex-1 justify-center`}>
          <Text style={tw`text-4xl font-extrabold text-black`}>
            get <Text style={tw`text-gray-400`}>things</Text>
          </Text>
          <Text style={tw`text-4xl font-extrabold text-gray-400`}>
            done with <Text style={tw`text-black`}>simple</Text>
          </Text>
          <Text style={tw`text-4xl font-extrabold text-black`}>task lists</Text>
        </View>

        <View style={tw`mb-3`}>
          <TouchableOpacity
            onPress={handleContinue}
            disabled={isDisabled}
            style={tw.style(
              `rounded-2xl py-3 items-center flex-row justify-center`,
              isDisabled ? `bg-gray-300` : `bg-black`
            )}
          >
            <Text style={tw`text-white font-semibold`}>
              {mode === "signup" ? "Sign up" : "Log in"} with Username
            </Text>
          </TouchableOpacity>
        </View>

        <View style={tw`mb-8`}>
          <TouchableOpacity
            onPress={() => setMode(mode === "signup" ? "login" : "signup")}
            style={tw`rounded-2xl py-3 items-center bg-gray-100`}
          >
            <Text style={tw`text-gray-800 font-semibold`}>
              {mode === "signup" ? "I have an account" : "I'm new here"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={tw`mb-3`}>
          <Text style={tw`text-sm text-gray-700 mb-2`}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            style={tw`border border-gray-300 rounded-xl px-4 py-3 text-base`}
            returnKeyType="next"
          />
        </View>
        <View style={tw`mb-6`}>
          <Text style={tw`text-sm text-gray-700 mb-2`}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Minimum 6 characters"
            secureTextEntry
            style={tw`border border-gray-300 rounded-xl px-4 py-3 text-base`}
            returnKeyType="done"
            onSubmitEditing={handleContinue}
          />
          <Text style={tw`text-xs text-gray-500 mt-2`}>
            {mode === "signup"
              ? "Create an account to sync your tasks."
              : "Log in to access your tasks."}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AuthScreen;
