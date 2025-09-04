import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import tw from "twrnc";
import { useAuth } from "../state/AuthContext";

const AuthScreen: React.FC = () => {
  const { loginWithEmail, signupWithEmail } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const trimmedEmail = useMemo(() => email.trim(), [email]);
  const isDisabled = trimmedEmail.length === 0 || password.length < 6;

  const handleContinue = async () => {
    if (isDisabled) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      if (mode === "signup") {
        await signupWithEmail(trimmedEmail, password);
      } else {
        await loginWithEmail(trimmedEmail, password);
      }
      setIsModalVisible(false);
      setEmail("");
      setPassword("");
    } catch (err: any) {
      const msg = err?.message || "Something went wrong. Please try again.";
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
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
            onPress={() => {
              setMode("signup");
              setIsModalVisible(true);
            }}
            style={tw`rounded-2xl py-3 items-center bg-black`}
          >
            <Text style={tw`text-white font-semibold`}>Sign up</Text>
          </TouchableOpacity>
        </View>

        <View style={tw`mb-8`}>
          <TouchableOpacity
            onPress={() => {
              setMode("login");
              setIsModalVisible(true);
            }}
            style={tw`rounded-2xl py-3 items-center bg-gray-100`}
          >
            <Text style={tw`text-gray-800 font-semibold`}>
              I have an account
            </Text>
          </TouchableOpacity>
        </View>

        <Modal visible={isModalVisible} animationType="slide" transparent>
          <View style={tw`flex-1 justify-end bg-black/40`}>
            <View style={tw`bg-white px-6 pt-5 pb-6 rounded-t-2xl`}>
              <View style={tw`items-center mb-4`}>
                <View style={tw`w-12 h-1.5 bg-gray-300 rounded-full`} />
              </View>
              <Text style={tw`text-xl font-bold mb-1`}>
                {mode === "signup" ? "Create your account" : "Welcome back"}
              </Text>
              <Text style={tw`text-sm text-gray-600 mb-4`}>
                {mode === "signup"
                  ? "Sign up with your email"
                  : "Log in with your email"}
              </Text>

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
              <View style={tw`mb-5`}>
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
              </View>

              <View style={tw`flex-row gap-3`}>
                <TouchableOpacity
                  onPress={() => setIsModalVisible(false)}
                  style={tw`flex-1 rounded-xl py-3 items-center bg-gray-100`}
                >
                  <Text style={tw`text-gray-800 font-semibold`}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={isDisabled || submitting}
                  onPress={handleContinue}
                  style={tw.style(
                    `flex-1 rounded-xl py-3 items-center`,
                    isDisabled || submitting ? `bg-gray-300` : `bg-blue-600`
                  )}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={tw`text-white font-semibold`}>
                      {mode === "signup" ? "Sign up" : "Log in"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
              {errorMessage ? (
                <Text style={tw`text-red-600 text-sm mt-3`}>
                  {errorMessage}
                </Text>
              ) : null}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default AuthScreen;
