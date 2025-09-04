import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";
import LoginScreen from "./src/screens/LoginScreen.tsx";
import TasksScreen from "./src/screens/TasksScreen.tsx";
import { AuthProvider, useAuth } from "./src/state/AuthContext";

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { user } = useAuth();
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <Stack.Screen
            name="Tasks"
            component={TasksScreen}
            options={{ headerTitle: "My Tasks" }}
          />
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <View style={styles.container}>
        <RootNavigator />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
