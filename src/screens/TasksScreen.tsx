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
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../state/AuthContext";
import { db } from "../lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: number | null;
};

const makeTasksKey = (username: string) => `tasks:${username}`;

const TasksScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const storageKey = useMemo(
    () => makeTasksKey(user?.uid ?? "guest"),
    [user?.uid]
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [showDatePickerFor, setShowDatePickerFor] = useState<string | null>(
    null
  );

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

  // Live Firestore sync when signed in
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "tasks"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const next: Task[] = snap.docs.map((d) => {
        const data: any = d.data();
        return {
          id: d.id,
          title: data.title,
          completed: !!data.completed,
          dueDate: data.dueDate ?? null,
        };
      });
      setTasks(next);
    });
    return unsub;
  }, [user?.uid]);

  const addTask = () => {
    const title = input.trim();
    if (!title) return;
    if (user?.uid) {
      addDoc(collection(db, "tasks"), {
        uid: user.uid,
        title,
        completed: false,
        dueDate: null,
        createdAt: Date.now(),
      }).catch(() => {});
      setInput("");
    } else {
      const newTask: Task = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title,
        completed: false,
        dueDate: null,
      };
      setTasks((prev) => [newTask, ...prev]);
      setInput("");
    }
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
    if (user?.uid) {
      const current = tasks.find((t) => t.id === id)?.completed ?? false;
      updateDoc(doc(db, "tasks", id), { completed: !current }).catch(() => {});
    }
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (user?.uid) deleteDoc(doc(db, "tasks", id)).catch(() => {});
  };

  const startEdit = (id: string) => setEditingId(id);
  const saveEdit = (id: string, title: string) => {
    setEditingId(null);
    const newTitle = title.trim();
    if (!newTitle) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: newTitle } : t))
    );
    if (user?.uid)
      updateDoc(doc(db, "tasks", id), { title: newTitle }).catch(() => {});
  };

  const setDueDate = (id: string, when: Date) => {
    const ts = when.getTime();
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, dueDate: ts } : t))
    );
    if (user?.uid)
      updateDoc(doc(db, "tasks", id), { dueDate: ts }).catch(() => {});
  };

  const renderItem = ({ item }: { item: Task }) => (
    <View style={styles.item}>
      <TouchableOpacity
        onPress={() => toggleTask(item.id)}
        style={styles.checkbox}
      >
        <View style={[styles.dot, item.completed && styles.dotOn]} />
      </TouchableOpacity>
      {editingId === item.id ? (
        <TextInput
          style={[styles.itemText, styles.editInput]}
          defaultValue={item.title}
          autoFocus
          onSubmitEditing={(e) => saveEdit(item.id, e.nativeEvent.text)}
          onBlur={(e) => saveEdit(item.id, e.nativeEvent.text)}
        />
      ) : (
        <TouchableOpacity
          style={{ flex: 1 }}
          onLongPress={() => startEdit(item.id)}
        >
          <Text
            style={[styles.itemText, item.completed && styles.completed]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          {item.dueDate ? (
            <Text style={styles.dueText}>
              Due {new Date(item.dueDate).toLocaleDateString()}
            </Text>
          ) : null}
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={() => setShowDatePickerFor(item.id)}
        style={styles.dueBtn}
      >
        <Text style={styles.dueBtnText}>Due</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => deleteTask(item.id)}
        style={styles.deleteBtn}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
      {showDatePickerFor === item.id && (
        <DateTimePicker
          value={item.dueDate ? new Date(item.dueDate) : new Date()}
          mode="date"
          display="default"
          onChange={(e, d) => {
            setShowDatePickerFor(null);
            if (d) setDueDate(item.id, d);
          }}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hello, {user?.email ?? "you"}</Text>
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
      <View style={styles.filters}>
        {(["all", "active", "completed"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterBtn, filter === f && styles.filterBtnOn]}
          >
            <Text
              style={[styles.filterText, filter === f && styles.filterTextOn]}
            >
              {f[0].toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={tasks.filter((t) =>
          filter === "all"
            ? true
            : filter === "active"
            ? !t.completed
            : t.completed
        )}
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
  dueBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 4,
  },
  dueBtnText: {
    color: "#0a84ff",
    fontWeight: "600",
  },
  dueText: {
    color: "#666",
    fontSize: 12,
    marginTop: 2,
  },
  empty: {
    textAlign: "center",
    color: "#666",
    marginTop: 24,
  },
  editInput: {
    flex: 1,
    fontSize: 16,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  filters: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  filterBtn: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterBtnOn: {
    backgroundColor: "#0a84ff",
    borderColor: "#0a84ff",
  },
  filterText: {
    color: "#333",
    fontWeight: "600",
  },
  filterTextOn: {
    color: "#fff",
  },
});
