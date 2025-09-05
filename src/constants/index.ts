// App constants
export const APP_NAME = "JustDo";
export const APP_VERSION = "1.0.0";

// Firebase collections
export const COLLECTIONS = {
  TASKS: "tasks",
} as const;

// Task filters
export const TASK_FILTERS = {
  ALL: "all",
  ACTIVE: "active", 
  COMPLETED: "completed",
} as const;

// UI constants
export const COLORS = {
  PRIMARY: "#000000",
  SECONDARY: "#6B7280",
  BACKGROUND: "#FFFFFF",
  SURFACE: "#F9FAFB",
  ERROR: "#EF4444",
  SUCCESS: "#10B981",
} as const;
