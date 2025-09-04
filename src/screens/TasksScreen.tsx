import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
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
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState<Date | null>(null);
  const [showAddDatePicker, setShowAddDatePicker] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDueDate, setEditDueDate] = useState<Date | null>(null);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  // const [search, setSearch] = useState("");

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

  const addTask = (titleArg?: string) => {
    const title = (titleArg ?? newTitle ?? input).trim();
    if (!title) return;
    if (user?.uid) {
      addDoc(collection(db, "tasks"), {
        uid: user.uid,
        title,
        completed: false,
        dueDate: newDueDate ? newDueDate.getTime() : null,
        createdAt: Date.now(),
      }).catch(() => {});
      setNewTitle("");
      setNewDueDate(null);
      setIsAddOpen(false);
    } else {
      const newTask: Task = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title,
        completed: false,
        dueDate: newDueDate ? newDueDate.getTime() : null,
      };
      setTasks((prev) => [newTask, ...prev]);
      setNewTitle("");
      setNewDueDate(null);
      setIsAddOpen(false);
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
  const openEditModal = (task: Task) => {
    setEditId(task.id);
    setEditTitle(task.title);
    setEditDueDate(task.dueDate ? new Date(task.dueDate) : null);
    setIsEditOpen(true);
  };
  const saveEditModal = async () => {
    if (!editId) return;
    const title = (editTitle ?? "").trim();
    if (!title) return;
    const dueTs = editDueDate ? editDueDate.getTime() : null;
    setTasks((prev) =>
      prev.map((t) => (t.id === editId ? { ...t, title, dueDate: dueTs } : t))
    );
    if (user?.uid)
      await updateDoc(doc(db, "tasks", editId), {
        title,
        dueDate: dueTs,
      }).catch(() => {});
    setIsEditOpen(false);
    setEditId(null);
  };
  const saveEdit = (id: string, title?: string) => {
    setEditingId(null);
    const newTitle = (title ?? "").trim();
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
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={() => openEditModal(item)}
        style={tw`px-2 py-1 mr-1`}
      >
        <Text style={tw`text-black`}>✎</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => deleteTask(item.id)}
        style={tw`px-2 py-1`}
      >
        <Text style={tw`text-red-500 font-semibold`}>Delete</Text>
      </TouchableOpacity>
      {/* Removed per request: due date picker/action inside list */}
    </View>
  );

  const remaining = tasks.filter((t) => !t.completed).length;
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const active = total - completed;

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
      {/* <View style={tw`px-4 pb-3`}>
        <View
          style={tw`flex-row items-center border border-gray-300 rounded-xl px-3 py-2 bg-white`}
        >
          <Text style={tw`text-gray-400 mr-2`}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search task"
            style={tw`flex-1 text-base`}
          />
        </View>
      </View> */}
      {/* Top add input removed in favor of FAB modal */}
      <View style={tw`px-4 mb-2`}>
        <Text style={tw`text-lg font-semibold mb-2`}>My Task</Text>
        <View style={tw`flex-row gap-3`}>
          <View
            style={tw`flex-1 rounded-2xl bg-white border border-gray-200 p-3`}
          >
            <Text style={tw`text-gray-500 text-xs mb-1`}>All</Text>
            <Text style={tw`text-xl font-bold`}>{total}</Text>
          </View>
          <View
            style={tw`flex-1 rounded-2xl bg-white border border-gray-200 p-3`}
          >
            <Text style={tw`text-gray-500 text-xs mb-1`}>Active</Text>
            <Text style={tw`text-xl font-bold`}>{active}</Text>
          </View>
          <View
            style={tw`flex-1 rounded-2xl bg-white border border-gray-200 p-3`}
          >
            <Text style={tw`text-gray-500 text-xs mb-1`}>Completed</Text>
            <Text style={tw`text-xl font-bold`}>{completed}</Text>
          </View>
        </View>
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
          // (search.trim().length === 0 ||
          //   t.title.toLowerCase().includes(search.trim().toLowerCase())) &&
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
      <TouchableOpacity
        onPress={() => setIsAddOpen(true)}
        style={tw`absolute right-4 bottom-6 w-14 h-14 rounded-full bg-black items-center justify-center shadow`}
        activeOpacity={0.8}
      >
        <Text style={tw`text-white text-2xl`}>+</Text>
      </TouchableOpacity>

      <Modal visible={isAddOpen} transparent animationType="slide">
        <View style={tw`flex-1 justify-end bg-black/40`}>
          <View style={tw`bg-white px-5 pt-5 pb-6 rounded-t-2xl`}>
            <View style={tw`items-center mb-4`}>
              <View style={tw`w-12 h-1.5 bg-gray-300 rounded-full`} />
            </View>
            <Text style={tw`text-xl font-bold mb-1`}>Add task</Text>
            <Text style={tw`text-sm text-gray-600 mb-4`}>
              Enter a title and optionally set a due date later.
            </Text>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Task title"
              style={tw`border border-gray-300 rounded-xl px-4 py-3 text-base`}
              returnKeyType="done"
              onSubmitEditing={() => addTask()}
            />
            <View style={tw`mt-3`}>
              <TouchableOpacity
                onPress={() => setShowAddDatePicker(true)}
                style={tw`border border-gray-300 rounded-xl px-4 py-3 flex-row items-center justify-between`}
              >
                <Text style={tw`text-base`}>
                  {newDueDate
                    ? newDueDate.toLocaleDateString()
                    : "Pick due date (optional)"}
                </Text>
                <Text>🗓</Text>
              </TouchableOpacity>
              {showAddDatePicker && (
                <DateTimePicker
                  value={newDueDate ?? new Date()}
                  mode="date"
                  display="default"
                  onChange={(e, d) => {
                    setShowAddDatePicker(false);
                    if (d) setNewDueDate(d);
                  }}
                />
              )}
            </View>
            <View style={tw`flex-row gap-3 mt-4`}>
              <TouchableOpacity
                onPress={() => {
                  setIsAddOpen(false);
                  setNewTitle("");
                  setNewDueDate(null);
                }}
                style={tw`flex-1 rounded-xl py-3 items-center bg-gray-100`}
              >
                <Text style={tw`text-gray-800 font-semibold`}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!newTitle.trim()}
                onPress={() => addTask()}
                style={tw.style(
                  `flex-1 rounded-xl py-3 items-center`,
                  newTitle.trim() ? `bg-black` : `bg-gray-300`
                )}
              >
                <Text style={tw`text-white font-semibold`}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={isEditOpen} transparent animationType="slide">
        <View style={tw`flex-1 justify-end bg-black/40`}>
          <View style={tw`bg-white px-5 pt-5 pb-6 rounded-t-2xl`}>
            <View style={tw`items-center mb-4`}>
              <View style={tw`w-12 h-1.5 bg-gray-300 rounded-full`} />
            </View>
            <Text style={tw`text-xl font-bold mb-1`}>Edit task</Text>
            <Text style={tw`text-sm text-gray-600 mb-4`}>
              Update title or due date.
            </Text>
            <TextInput
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Task title"
              style={tw`border border-gray-300 rounded-xl px-4 py-3 text-base`}
              returnKeyType="done"
            />
            <View style={tw`mt-3`}>
              <TouchableOpacity
                onPress={() => setShowEditDatePicker(true)}
                style={tw`border border-gray-300 rounded-xl px-4 py-3 flex-row items-center justify-between`}
              >
                <Text style={tw`text-base`}>
                  {editDueDate
                    ? editDueDate.toLocaleDateString()
                    : "Pick due date (optional)"}
                </Text>
                <Text>🗓</Text>
              </TouchableOpacity>
              {showEditDatePicker && (
                <DateTimePicker
                  value={editDueDate ?? new Date()}
                  mode="date"
                  display="default"
                  onChange={(e, d) => {
                    setShowEditDatePicker(false);
                    if (d) setEditDueDate(d);
                  }}
                />
              )}
            </View>
            <View style={tw`flex-row gap-3 mt-4`}>
              <TouchableOpacity
                onPress={() => {
                  setIsEditOpen(false);
                  setEditId(null);
                }}
                style={tw`flex-1 rounded-xl py-3 items-center bg-gray-100`}
              >
                <Text style={tw`text-gray-800 font-semibold`}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!editTitle.trim()}
                onPress={saveEditModal}
                style={tw.style(
                  `flex-1 rounded-xl py-3 items-center`,
                  editTitle.trim() ? `bg-black` : `bg-gray-300`
                )}
              >
                <Text style={tw`text-white font-semibold`}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default TasksScreen;
