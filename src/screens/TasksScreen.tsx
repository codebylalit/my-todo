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
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
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
import { Task, TaskFilter } from "../types";
import { COLLECTIONS, TASK_FILTERS } from "../constants";

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
  const [filter, setFilter] = useState<TaskFilter>(TASK_FILTERS.ALL);
  const [showDatePickerFor, setShowDatePickerFor] = useState<string | null>(
    null
  );
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newDueDate, setNewDueDate] = useState<Date | null>(null);
  const [showAddDatePicker, setShowAddDatePicker] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");
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
      collection(db, COLLECTIONS.TASKS),
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
          notes: data.notes ?? null,
          createdAt: data.createdAt,
          uid: data.uid,
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
      addDoc(collection(db, COLLECTIONS.TASKS), {
        uid: user.uid,
        title,
        completed: false,
        dueDate: newDueDate ? newDueDate.getTime() : null,
        notes: newNotes.trim() || null,
        createdAt: Date.now(),
      }).catch(() => {});
      setNewTitle("");
      setNewNotes("");
      setNewDueDate(null);
      setIsAddOpen(false);
    } else {
      const newTask: Task = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title,
        completed: false,
        dueDate: newDueDate ? newDueDate.getTime() : null,
        notes: newNotes.trim() || null,
        createdAt: Date.now(),
        uid: "local",
      };
      setTasks((prev) => [newTask, ...prev]);
      setNewTitle("");
      setNewNotes("");
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
      updateDoc(doc(db, COLLECTIONS.TASKS, id), { completed: !current }).catch(
        () => {}
      );
    }
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (user?.uid) deleteDoc(doc(db, COLLECTIONS.TASKS, id)).catch(() => {});
  };

  const startEdit = (id: string) => setEditingId(id);
  const openEditModal = (task: Task) => {
    setEditId(task.id);
    setEditTitle(task.title);
    setEditNotes(task.notes || "");
    setEditDueDate(task.dueDate ? new Date(task.dueDate) : null);
    setIsEditOpen(true);
  };
  const saveEditModal = async () => {
    if (!editId) return;
    const title = (editTitle ?? "").trim();
    if (!title) return;
    const dueTs = editDueDate ? editDueDate.getTime() : null;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === editId
          ? { ...t, title, notes: editNotes.trim() || null, dueDate: dueTs }
          : t
      )
    );
    if (user?.uid)
      await updateDoc(doc(db, COLLECTIONS.TASKS, editId), {
        title,
        notes: editNotes.trim() || null,
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
      updateDoc(doc(db, COLLECTIONS.TASKS, id), { title: newTitle }).catch(
        () => {}
      );
  };

  const setDueDate = (id: string, when: Date) => {
    const ts = when.getTime();
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, dueDate: ts } : t))
    );
    if (user?.uid)
      updateDoc(doc(db, COLLECTIONS.TASKS, id), { dueDate: ts }).catch(
        () => {}
      );
  };

  const renderItem = ({ item }: { item: Task }) => (
    <View style={tw`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm`}>
      <View style={tw`flex-row items-start`}>
        {/* Checkbox */}
        <TouchableOpacity
          onPress={() => toggleTask(item.id)}
          style={tw`w-7 h-7 rounded-full border-2 border-gray-300 items-center justify-center mr-4 mt-1`}
        >
          {item.completed && (
            <Ionicons name="checkmark" size={18} color="#000" />
          )}
        </TouchableOpacity>

        {/* Task Content */}
        <View style={tw`flex-1`}>
          {editingId === item.id ? (
            <TextInput
              style={tw`text-base font-medium border-b border-gray-300 pb-2`}
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
                  `text-base font-medium leading-5`,
                  item.completed
                    ? `line-through text-gray-400`
                    : `text-gray-900`
                )}
                numberOfLines={3}
              >
                {item.title}
              </Text>
              {item.dueDate && (
                <View style={tw`flex-row items-center mt-2`}>
                  <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                  <Text style={tw`text-gray-500 text-sm ml-2`}>
                    Due {new Date(item.dueDate).toLocaleDateString()}
                  </Text>
                </View>
              )}
              {item.notes && (
                <View style={tw`mt-2`}>
                  <Text
                    style={tw.style(
                      `text-sm text-gray-600 leading-4`,
                      item.completed
                        ? `line-through text-gray-400`
                        : `text-gray-600`
                    )}
                    numberOfLines={2}
                  >
                    {item.notes}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        <View style={tw`flex-row ml-3`}>
          <TouchableOpacity
            onPress={() => openEditModal(item)}
            style={tw`w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-2`}
          >
            <Ionicons name="create-outline" size={18} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => deleteTask(item.id)}
            style={tw`w-10 h-10 rounded-full bg-red-50 items-center justify-center`}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const navigation = useNavigation();
  const remaining = tasks.filter((t) => !t.completed).length;
  const displayName = useMemo(() => {
    const email = user?.email ?? "";
    const name = email.split("@")[0] || "there";
    return name.charAt(0).toUpperCase() + name.slice(1);
  }, [user?.email]);
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const active = total - completed;

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Header Section */}
      <View style={tw`bg-white mt-8 px-6 pt-4 pb-6`}>
        <View style={tw`flex-row items-center justify-between mb-6`}>
          <View style={tw`flex-1`}>
            <Text style={tw`text-3xl font-bold text-gray-900`}>
              Hi, {displayName}
            </Text>
            <Text style={tw`text-base text-gray-500 mt-1`}>
              {remaining} {remaining === 1 ? "task" : "tasks"} pending
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate("Settings" as never)}
            style={tw`w-16 h-16 rounded-full bg-gray-100 items-center justify-center`}
          >
            <Ionicons name="person-outline" size={30} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={tw`flex-row gap-3`}>
          <View
            style={tw`flex-1 rounded-xl p-3 border border-gray-200 bg-gray-50`}
          >
            <View style={tw`flex-row items-center justify-between mb-1`}>
              <Text style={tw`text-gray-600 text-sm font-medium`}>
                All Tasks
              </Text>
              <Ionicons name="list-outline" size={14} color="#6B7280" />
            </View>
            <Text style={tw`text-lg font-bold text-gray-900`}>{total}</Text>
          </View>
          <View
            style={tw`flex-1 rounded-xl p-3 border border-gray-200 bg-gray-50`}
          >
            <View style={tw`flex-row items-center justify-between mb-1`}>
              <Text style={tw`text-gray-600 text-sm font-medium`}>Active</Text>
              <Ionicons name="time-outline" size={14} color="#6B7280" />
            </View>
            <Text style={tw`text-lg font-bold text-gray-900`}>{active}</Text>
          </View>
          <View
            style={tw`flex-1 rounded-xl p-3 border border-gray-200 bg-gray-50`}
          >
            <View style={tw`flex-row items-center justify-between mb-1`}>
              <Text style={tw`text-gray-600 text-sm font-medium`}>Done</Text>
              <Ionicons
                name="checkmark-circle-outline"
                size={14}
                color="#6B7280"
              />
            </View>
            <Text style={tw`text-lg font-bold text-gray-900`}>{completed}</Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={tw`px-6 py-2`}>
        <View style={tw`flex-row gap-3`}>
          {(
            [
              TASK_FILTERS.ALL,
              TASK_FILTERS.ACTIVE,
              TASK_FILTERS.COMPLETED,
            ] as const
          ).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={tw.style(
                `rounded-full px-4 py-3 flex-1`,
                filter === f ? `bg-black ` : `bg-white border border-gray-200`
              )}
            >
              <Text
                style={tw.style(
                  `text-center font-medium text-sm`,
                  filter === f ? `text-white` : `text-gray-700`
                )}
              >
                {f[0].toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {/* Tasks List */}
      <View style={tw`flex-1 px-6`}>
        <FlatList
          data={tasks.filter((t) =>
            filter === TASK_FILTERS.ALL
              ? true
              : filter === TASK_FILTERS.ACTIVE
              ? !t.completed
              : t.completed
          )}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={tw`h-4`} />}
          contentContainerStyle={tw`pb-32 pt-2`}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={tw`items-center justify-center py-16`}>
              <View
                style={tw`w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-6`}
              >
                <Ionicons
                  name="checkmark-done-outline"
                  size={40}
                  color="#9CA3AF"
                />
              </View>
              <Text style={tw`text-xl font-semibold text-gray-700 mb-1`}>
                {filter === TASK_FILTERS.ALL
                  ? "No tasks yet"
                  : `No ${filter} tasks`}
              </Text>
              <Text style={tw`text-gray-500 text-center leading-6`}>
                {filter === TASK_FILTERS.ALL
                  ? "Tap the + button to create your first task"
                  : `Switch to "All" to see all your tasks`}
              </Text>
            </View>
          }
        />
      </View>
      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => setIsAddOpen(true)}
        style={tw`absolute right-6 bottom-8 w-16 h-16 rounded-full bg-black items-center justify-center shadow-xl`}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <Modal visible={isAddOpen} transparent animationType="slide">
        <View style={tw`flex-1 justify-end bg-black/50`}>
          <View style={tw`bg-white px-6 pt-6 pb-8 rounded-t-3xl`}>
            {/* Handle Bar */}
            <View style={tw`items-center mb-6`}>
              <View style={tw`w-12 h-1.5 bg-gray-300 rounded-full`} />
            </View>

            {/* Header */}
            <View style={tw`mb-6`}>
              <Text style={tw`text-2xl font-bold text-gray-900 mb-2`}>
                Add New Task
              </Text>
              <Text style={tw`text-gray-600 leading-5`}>
                Create a new task and set a due date
              </Text>
            </View>

            {/* Form Fields */}
            <View style={tw`gap-4`}>
              {/* Task Title */}
              <View>
                <Text style={tw`text-gray-700 font-medium mb-2`}>
                  Task Title
                </Text>
                <TextInput
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="Enter task title..."
                  style={tw`border border-gray-200 rounded-xl px-4 py-4 text-base bg-gray-50`}
                  returnKeyType="done"
                  onSubmitEditing={() => addTask()}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Notes */}
              <View>
                <Text style={tw`text-gray-700 font-medium mb-2`}>
                  Notes (Optional)
                </Text>
                <TextInput
                  value={newNotes}
                  onChangeText={setNewNotes}
                  placeholder="Add notes or description..."
                  style={tw`border border-gray-200 rounded-xl px-4 py-4 text-base bg-gray-50`}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Due Date */}
              <View>
                <Text style={tw`text-gray-700 font-medium mb-2`}>Due Date</Text>
                <TouchableOpacity
                  onPress={() => setShowAddDatePicker(true)}
                  style={tw`border border-gray-200 rounded-xl px-4 py-4 flex-row items-center justify-between bg-gray-50`}
                >
                  <Text style={tw`text-base text-gray-900`}>
                    {newDueDate
                      ? newDueDate.toLocaleDateString()
                      : "Select due date"}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
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
            </View>

            {/* Action Buttons */}
            <View style={tw`flex-row gap-3 mt-8`}>
              <TouchableOpacity
                onPress={() => {
                  setIsAddOpen(false);
                  setNewTitle("");
                  setNewNotes("");
                  setNewDueDate(null);
                }}
                style={tw`flex-1 rounded-xl py-4 items-center bg-gray-100`}
              >
                <Text style={tw`text-gray-700 font-semibold text-base`}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!newTitle.trim()}
                onPress={() => addTask()}
                style={tw.style(
                  `flex-1 rounded-xl py-4 items-center`,
                  newTitle.trim() ? `bg-black` : `bg-gray-300`
                )}
              >
                <Text
                  style={tw.style(
                    `font-semibold text-base`,
                    newTitle.trim() ? `text-white` : `text-gray-500`
                  )}
                >
                  Add Task
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={isEditOpen} transparent animationType="slide">
        <View style={tw`flex-1 justify-end bg-black/50`}>
          <View style={tw`bg-white px-6 pt-6 pb-8 rounded-t-3xl`}>
            {/* Handle Bar */}
            <View style={tw`items-center mb-6`}>
              <View style={tw`w-12 h-1.5 bg-gray-300 rounded-full`} />
            </View>

            {/* Header */}
            <View style={tw`mb-6`}>
              <Text style={tw`text-2xl font-bold text-gray-900 mb-2`}>
                Edit Task
              </Text>
              <Text style={tw`text-gray-600 leading-5`}>
                Update the task title or due date
              </Text>
            </View>

            {/* Form Fields */}
            <View style={tw`gap-4`}>
              {/* Task Title */}
              <View>
                <Text style={tw`text-gray-700 font-medium mb-2`}>
                  Task Title
                </Text>
                <TextInput
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Enter task title..."
                  style={tw`border border-gray-200 rounded-xl px-4 py-4 text-base bg-gray-50`}
                  returnKeyType="done"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Notes */}
              <View>
                <Text style={tw`text-gray-700 font-medium mb-2`}>
                  Notes (Optional)
                </Text>
                <TextInput
                  value={editNotes}
                  onChangeText={setEditNotes}
                  placeholder="Add notes or description..."
                  style={tw`border border-gray-200 rounded-xl px-4 py-4 text-base bg-gray-50`}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Due Date */}
              <View>
                <Text style={tw`text-gray-700 font-medium mb-2`}>Due Date</Text>
                <TouchableOpacity
                  onPress={() => setShowEditDatePicker(true)}
                  style={tw`border border-gray-200 rounded-xl px-4 py-4 flex-row items-center justify-between bg-gray-50`}
                >
                  <Text style={tw`text-base text-gray-900`}>
                    {editDueDate
                      ? editDueDate.toLocaleDateString()
                      : "Select due date"}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
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
            </View>

            {/* Action Buttons */}
            <View style={tw`flex-row gap-3 mt-8`}>
              <TouchableOpacity
                onPress={() => {
                  setIsEditOpen(false);
                  setEditId(null);
                }}
                style={tw`flex-1 rounded-xl py-4 items-center bg-gray-100`}
              >
                <Text style={tw`text-gray-700 font-semibold text-base`}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!editTitle.trim()}
                onPress={saveEditModal}
                style={tw.style(
                  `flex-1 rounded-xl py-4 items-center`,
                  editTitle.trim() ? `bg-black` : `bg-gray-300`
                )}
              >
                <Text
                  style={tw.style(
                    `font-semibold text-base`,
                    editTitle.trim() ? `text-white` : `text-gray-500`
                  )}
                >
                  Save Changes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default TasksScreen;
