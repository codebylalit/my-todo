// App types
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: number | null;
  notes?: string | null;
  createdAt: number;
  uid: string;
}

export type TaskFilter = "all" | "active" | "completed";

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Tasks: undefined;
  Settings: undefined;
};
