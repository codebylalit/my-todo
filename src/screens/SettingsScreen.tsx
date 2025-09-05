import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import tw from "twrnc";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../state/AuthContext";
import { updateProfile } from "firebase/auth";

const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
  const capitalizedName =
    displayName.charAt(0).toUpperCase() + displayName.slice(1);

  const openEditModal = () => {
    setNewDisplayName(displayName);
    setIsEditModalOpen(true);
  };

  const saveProfile = async () => {
    if (!newDisplayName.trim()) {
      Alert.alert("Error", "Please enter a valid name");
      return;
    }

    if (!user) return;

    setIsLoading(true);
    try {
      await updateProfile(user, {
        displayName: newDisplayName.trim(),
      });
      setIsEditModalOpen(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    }
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Header */}
      <View style={tw`px-6 pt-4 pb-6`}>
        <Text style={tw`text-2xl font-bold text-gray-900 mb-8`}>Account</Text>

        {/* User Info */}
        <View style={tw`flex-row items-center mb-8`}>
          <View
            style={tw`w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-4`}
          >
            <Ionicons name="person-outline" size={24} color="#6B7280" />
          </View>
          <View style={tw`flex-1`}>
            <Text style={tw`text-lg font-semibold text-gray-900`}>
              {capitalizedName}
            </Text>
            <Text style={tw`text-gray-500 text-sm`}>{user?.email}</Text>
          </View>
          <TouchableOpacity onPress={openEditModal} style={tw`p-2`}>
            <Ionicons name="create-outline" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Settings */}
      <View style={tw`px-6 mb-6`}>
        <View style={tw`bg-white border border-gray-200 rounded-xl`}>
          <TouchableOpacity
            onPress={openEditModal}
            style={tw`flex-row items-center justify-between px-4 py-4 border-b border-gray-100`}
          >
            <View style={tw`flex-row items-center`}>
              <Ionicons name="person-outline" size={20} color="#6B7280" />
              <Text style={tw`text-gray-700 ml-3 font-medium`}>
                Display Name
              </Text>
            </View>
            <View style={tw`flex-row items-center`}>
              <Text style={tw`text-gray-500 mr-2`}>{capitalizedName}</Text>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </View>
          </TouchableOpacity>

          <View style={tw`flex-row items-center justify-between px-4 py-4`}>
            <View style={tw`flex-row items-center`}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" />
              <Text style={tw`text-gray-700 ml-3 font-medium`}>Email</Text>
            </View>
            <Text style={tw`text-gray-500`}>{user?.email}</Text>
          </View>
        </View>
      </View>

      {/* Logout */}
      <View style={tw`px-6`}>
        <TouchableOpacity
          onPress={logout}
          style={tw`bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 flex-row items-center justify-center`}
        >
          <Ionicons name="log-out-outline" size={20} color="#6B7280" />
          <Text style={tw`text-gray-700 font-medium ml-2`}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Profile Modal */}
      <Modal visible={isEditModalOpen} transparent animationType="slide">
        <View style={tw`flex-1 justify-end bg-black/50`}>
          <View style={tw`bg-white px-6 pt-6 pb-8 rounded-t-3xl`}>
            {/* Handle Bar */}
            <View style={tw`items-center mb-6`}>
              <View style={tw`w-12 h-1.5 bg-gray-300 rounded-full`} />
            </View>

            {/* Header */}
            <View style={tw`mb-6`}>
              <Text style={tw`text-2xl font-bold text-gray-900 mb-2`}>
                Edit Profile
              </Text>
              <Text style={tw`text-gray-600 leading-5`}>
                Update your display name
              </Text>
            </View>

            {/* Form Fields */}
            <View style={tw`gap-4`}>
              <View>
                <Text style={tw`text-gray-700 font-medium mb-2`}>
                  Display Name
                </Text>
                <TextInput
                  value={newDisplayName}
                  onChangeText={setNewDisplayName}
                  placeholder="Enter your name..."
                  style={tw`border border-gray-200 rounded-xl px-4 py-4 text-base bg-gray-50`}
                  returnKeyType="done"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={tw`flex-row gap-3 mt-8`}>
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(false)}
                style={tw`flex-1 rounded-xl py-4 items-center bg-gray-100`}
              >
                <Text style={tw`text-gray-700 font-semibold text-base`}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!newDisplayName.trim() || isLoading}
                onPress={saveProfile}
                style={tw.style(
                  `flex-1 rounded-xl py-4 items-center`,
                  newDisplayName.trim() && !isLoading
                    ? `bg-black`
                    : `bg-gray-300`
                )}
              >
                <Text
                  style={tw.style(
                    `font-semibold text-base`,
                    newDisplayName.trim() && !isLoading
                      ? `text-white`
                      : `text-gray-500`
                  )}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SettingsScreen;
