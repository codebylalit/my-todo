import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Image,
} from "react-native";
import tw from "twrnc";
import { Ionicons } from "@expo/vector-icons";
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
        {/* Header */}
        <View style={tw`mt-10 mb-12`}>
          <View style={tw`flex-row items-center`}>
            <Image
              source={require("../../assets/icon.jpg")}
              style={tw`w-8 h-8 mr-2`}
              resizeMode="contain"
            />
            <Text style={tw`text-2xl font-bold text-gray-900`}>Justdo</Text>
          </View>
        </View>

        {/* Hero Section */}
        <View style={tw`flex-1 justify-center`}>
          <Text style={tw`text-5xl font-black text-gray-900 mb-2`}>
            Get things
          </Text>
          <Text style={tw`text-5xl font-light text-gray-500 mb-2`}>
            done with
          </Text>
          <Text style={tw`text-5xl font-black text-gray-900`}>
            simple tasks.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={tw`mb-8`}>
          <TouchableOpacity
            onPress={() => {
              setMode("signup");
              setIsModalVisible(true);
            }}
            style={tw`rounded-2xl py-4 items-center bg-black mb-3 flex-row justify-center`}
          >
            <Ionicons name="mail" size={20} color="#fff" style={tw`mr-2`} />
            <Text style={tw`text-white font-semibold text-base`}>
              Sign up with Email
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setMode("login");
              setIsModalVisible(true);
            }}
            style={tw`rounded-2xl py-3 items-center bg-white border border-gray-200`}
          >
            <Text style={tw`text-gray-900 font-medium text-base`}>
              I have an account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Auth Modal */}
        <Modal visible={isModalVisible} animationType="slide" transparent>
          <View style={tw`flex-1 justify-end bg-black/50`}>
            <View style={tw`bg-white px-6 pt-6 pb-8 rounded-t-3xl`}>
              {/* Handle Bar */}
              <View style={tw`items-center mb-6`}>
                <View style={tw`w-12 h-1.5 bg-gray-300 rounded-full`} />
              </View>

              {/* Header */}
              <View style={tw`mb-6`}>
                <Text style={tw`text-2xl font-bold text-gray-900 mb-2`}>
                  {mode === "signup" ? "Create Account" : "Welcome Back"}
                </Text>
                <Text style={tw`text-gray-600 leading-5`}>
                  {mode === "signup"
                    ? "Sign up with your email to get started"
                    : "Log in to continue with your tasks"}
                </Text>
              </View>

              {/* Form Fields */}
              <View style={tw`gap-4`}>
                <View>
                  <Text style={tw`text-gray-700 font-medium mb-2`}>Email</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email..."
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={tw`border border-gray-200 rounded-xl px-4 py-4 text-base bg-gray-50`}
                    returnKeyType="next"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View>
                  <Text style={tw`text-gray-700 font-medium mb-2`}>
                    Password
                  </Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password..."
                    secureTextEntry
                    style={tw`border border-gray-200 rounded-xl px-4 py-4 text-base bg-gray-50`}
                    returnKeyType="done"
                    onSubmitEditing={handleContinue}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Action Buttons */}
              <View style={tw`flex-row gap-3 mt-8`}>
                <TouchableOpacity
                  onPress={() => setIsModalVisible(false)}
                  style={tw`flex-1 rounded-xl py-4 items-center bg-gray-100`}
                >
                  <Text style={tw`text-gray-700 font-semibold text-base`}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={isDisabled || submitting}
                  onPress={handleContinue}
                  style={tw.style(
                    `flex-1 rounded-xl py-4 items-center`,
                    isDisabled || submitting ? `bg-gray-300` : `bg-black`
                  )}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text
                      style={tw.style(
                        `font-semibold text-base`,
                        isDisabled || submitting
                          ? `text-gray-500`
                          : `text-white`
                      )}
                    >
                      {mode === "signup" ? "Sign Up" : "Log In"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Error Message */}
              {errorMessage ? (
                <View
                  style={tw`mt-4 p-3 bg-red-50 border border-red-200 rounded-xl`}
                >
                  <Text style={tw`text-red-600 text-sm text-center`}>
                    {errorMessage}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default AuthScreen;
