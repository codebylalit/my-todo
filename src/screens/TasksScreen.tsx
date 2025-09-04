import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../state/AuthContext";

type Task = {
  id: string;
  title: string;
  completed: boolean;
};

const makeTasksKey = (username: string) => `tasks:${username}`;

const TasksScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const storageKey = useMemo(() => makeTasksKey(user ?? "guest"), [user]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) setTasks(JSON.parse(raw));
      } catch {}
    })();
  }, [storageKey]);

  useEffect(() => {
    AsyncStorage.setItem(storageKey, JSON.stringify(tasks)).catch(() => {});
  }, [storageKey, tasks]);

  const addTask = () => {
    const title = input.trim();
    if (!title) return;
    const newTask: Task = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title,
      completed: false,
    };
    setTasks((prev) => [newTask, ...prev]);
    setInput("");
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const renderItem = ({ item }: { item: Task }) => (
    <View style={styles.item}>
      <TouchableOpacity
        onPress={() => toggleTask(item.id)}
        style={styles.checkbox}
      >
        <View style={[styles.dot, item.completed && styles.dotOn]} />
      </TouchableOpacity>
      <Text
        style={[styles.itemText, item.completed && styles.completed]}
        numberOfLines={2}
      >
        {item.title}
      </Text>
      <TouchableOpacity
        onPress={() => deleteTask(item.id)}
        style={styles.deleteBtn}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hello, {user}</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Add a new task"
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={addTask}
        />
        <TouchableOpacity onPress={addTask} style={styles.addBtn}>
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No tasks yet. Add one!</Text>
        }
      />
    </SafeAreaView>
  );
};

export default TasksScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  logout: {
    color: "#ff3b30",
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  addBtn: {
    backgroundColor: "#0a84ff",
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: "center",
  },
  addText: {
    color: "#fff",
    fontWeight: "700",
  },
  list: {
    padding: 16,
    gap: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#0a84ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "transparent",
  },
  dotOn: {
    backgroundColor: "#0a84ff",
  },
  itemText: {
    flex: 1,
    fontSize: 16,
  },
  completed: {
    textDecorationLine: "line-through",
    color: "#999",
  },
  deleteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  deleteText: {
    color: "#ff3b30",
    fontWeight: "600",
  },
  empty: {
    textAlign: "center",
    color: "#666",
    marginTop: 24,
  },
});
