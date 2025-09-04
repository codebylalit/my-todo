import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";
import tw from "twrnc";
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
    <View
      style={tw`flex-row items-center border border-gray-200 rounded-xl p-3 mb-3 bg-white`}
    >
      <TouchableOpacity
        onPress={() => toggleTask(item.id)}
        style={tw`w-6 h-6 rounded-full border-2 border-blue-600 items-center justify-center mr-3`}
      >
        <View
          style={tw.style(
            `w-3 h-3 rounded-full`,
            item.completed ? `bg-blue-600` : `bg-transparent`
          )}
        />
      </TouchableOpacity>
      {editingId === item.id ? (
        <TextInput
          style={tw`flex-1 text-base border-b border-gray-300`}
          defaultValue={item.title}
          autoFocus
          onSubmitEditing={(e) => saveEdit(item.id, e.nativeEvent.text)}
          onBlur={(e) => saveEdit(item.id, e.nativeEvent.text)}
        />
      ) : (
        <TouchableOpacity
          style={tw`flex-1`}
          onLongPress={() => startEdit(item.id)}
        >
          <Text
            style={tw.style(
              `flex-1 text-base`,
              item.completed ? `line-through text-gray-400` : undefined
            )}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          {item.dueDate ? (
            <Text style={tw`text-gray-500 text-xs mt-1`}>
              Due {new Date(item.dueDate).toLocaleDateString()}
            </Text>
          ) : null}
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={() => setShowDatePickerFor(item.id)}
        style={tw`px-2 py-1 mr-1`}
      >
        <Text style={tw`text-blue-600 font-semibold`}>Due</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => deleteTask(item.id)}
        style={tw`px-2 py-1`}
      >
        <Text style={tw`text-red-500 font-semibold`}>Delete</Text>
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

  const remaining = tasks.filter((t) => !t.completed).length;

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <View style={tw`flex-row justify-between items-center px-4 py-3`}>
        <View>
          <Text style={tw`text-2xl font-bold`}>My Tasks</Text>
          <Text style={tw`mt-1 text-gray-600`}>
            {remaining} {remaining === 1 ? "task" : "tasks"} remaining
          </Text>
        </View>
        <TouchableOpacity
          onPress={logout}
          style={tw`border border-red-200 px-3 py-2 rounded-xl`}
        >
          <Text style={tw`text-red-500 font-semibold`}>Logout</Text>
        </TouchableOpacity>
      </View>
      <View style={tw`flex-row px-4 gap-2`}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Add a new task"
          style={tw`flex-1 border border-gray-300 rounded-xl px-3 py-2 text-base`}
          returnKeyType="done"
          onSubmitEditing={addTask}
        />
        <TouchableOpacity
          onPress={addTask}
          style={tw`bg-blue-600 px-4 rounded-xl justify-center`}
        >
          <Text style={tw`text-white font-bold`}>Add</Text>
        </TouchableOpacity>
      </View>
      <View style={tw`flex-row gap-2 px-4 mt-2`}>
        {(["all", "active", "completed"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={tw.style(
              `border border-gray-300 rounded-full px-3 py-1.5`,
              filter === f ? `bg-blue-600 border-blue-600` : undefined
            )}
          >
            <Text
              style={tw.style(
                `text-gray-800 font-semibold`,
                filter === f ? `text-white` : undefined
              )}
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
        contentContainerStyle={tw`p-4 gap-2`}
        ListEmptyComponent={
          <Text style={tw`text-center text-gray-600 mt-6`}>
            No tasks yet. Add one!
          </Text>
        }
      />
    </SafeAreaView>
  );
};

export default TasksScreen;
