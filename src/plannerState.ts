import type { EnergyLevel, FocusLog, PlannerState, Task, TaskStatus } from "./types";

export const defaultSessionSeconds = 25 * 60;

const storageKey = "focus-planner-state-v5";
const legacyStorageKey = "focus-planner-state-v3";
const previousStorageKey = "focus-planner-state-v4";
const energyLevels: EnergyLevel[] = ["light", "steady", "deep"];
const taskStatuses: TaskStatus[] = ["pending", "active", "completed"];

export function initialState(): PlannerState {
  return {
    tasks: [],
    logs: [],
    activeTaskId: null,
    timer: {
      taskId: null,
      seconds: defaultSessionSeconds,
      running: false,
      startedAt: null
    },
    notes: ""
  };
}

function createId(prefix: string) {
  const cryptoId = window.crypto?.randomUUID?.();
  return cryptoId ? `${prefix}-${cryptoId}` : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isEnergyLevel(value: unknown): value is EnergyLevel {
  return energyLevels.includes(value as EnergyLevel);
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return taskStatuses.includes(value as TaskStatus);
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function clampMinutes(value: unknown) {
  const minutes = Number(value);
  if (!Number.isFinite(minutes)) return 25;
  return Math.min(180, Math.max(5, Math.round(minutes)));
}

function cleanIsoDate(value: unknown) {
  if (typeof value !== "string") return new Date().toISOString();
  return Number.isNaN(new Date(value).getTime()) ? new Date().toISOString() : value;
}

function cleanNullableIsoDate(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return null;
  return Number.isNaN(new Date(value).getTime()) ? null : value;
}

function normalizeTask(value: Partial<Task>): Task | null {
  const title = cleanText(value.title);
  if (!title) return null;
  const completedAt = cleanNullableIsoDate(value.completedAt);
  const status = isTaskStatus(value.status) ? value.status : completedAt ? "completed" : "pending";

  return {
    id: cleanText(value.id) || createId("task"),
    title,
    minutes: clampMinutes(value.minutes),
    energy: isEnergyLevel(value.energy) ? value.energy : "steady",
    note: cleanText(value.note),
    status,
    createdAt: cleanIsoDate(value.createdAt),
    completedAt: status === "completed" ? completedAt || new Date().toISOString() : null
  };
}

function normalizeLog(value: Partial<FocusLog>): FocusLog | null {
  const taskTitle = cleanText(value.taskTitle);
  const completedAt = cleanNullableIsoDate(value.completedAt);
  if (!taskTitle || !completedAt) return null;

  return {
    id: cleanText(value.id) || createId("log"),
    taskId: cleanText(value.taskId),
    taskTitle,
    minutesPlanned: clampMinutes(value.minutesPlanned),
    secondsSpent: Math.max(0, Math.round(Number(value.secondsSpent) || 0)),
    note: cleanText(value.note),
    startedAt: cleanNullableIsoDate(value.startedAt),
    completedAt
  };
}

export function getTaskSeconds(task: Task | null) {
  return task ? task.minutes * 60 : defaultSessionSeconds;
}

export function createTask(title: string, minutes: number, energy: EnergyLevel, note: string): Task {
  return {
    id: createId("task"),
    title: title.trim(),
    minutes: clampMinutes(minutes),
    energy,
    note: note.trim(),
    status: "active",
    createdAt: new Date().toISOString(),
    completedAt: null
  };
}

export function createFocusLog(task: Task, timerSeconds: number, note: string, startedAt: string | null): FocusLog {
  return {
    id: createId("log"),
    taskId: task.id,
    taskTitle: task.title,
    minutesPlanned: task.minutes,
    secondsSpent: Math.max(0, getTaskSeconds(task) - timerSeconds),
    note: note.trim(),
    startedAt,
    completedAt: new Date().toISOString()
  };
}

export function normalizePlannerState(value: unknown): PlannerState {
  const saved = value && typeof value === "object" ? (value as Partial<PlannerState>) : {};
  const fallback = initialState();
  const normalizedTasks = Array.isArray(saved.tasks)
    ? saved.tasks.map((task) => normalizeTask(task)).filter((task): task is Task => Boolean(task))
    : fallback.tasks;
  const savedActiveTaskId = cleanText(saved.activeTaskId);
  const tasks = normalizedTasks.map((task) =>
    task.id === savedActiveTaskId && task.status !== "completed" ? { ...task, status: "active" as const } : task
  );
  const logs = Array.isArray(saved.logs)
    ? saved.logs.map((log) => normalizeLog(log)).filter((log): log is FocusLog => Boolean(log))
    : fallback.logs;
  const activeTask = tasks.find((task) => task.id === saved.activeTaskId && task.status !== "completed") || null;
  const timerTask = tasks.find((task) => task.id === saved.timer?.taskId && task.status !== "completed") || activeTask;
  const seconds = Number(saved.timer?.seconds);

  return {
    tasks,
    logs,
    activeTaskId: activeTask?.id || null,
    timer: {
      taskId: timerTask?.id || null,
      seconds: Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds) : getTaskSeconds(timerTask || activeTask),
      running: false,
      startedAt: cleanNullableIsoDate(saved.timer?.startedAt)
    },
    notes: cleanText(saved.notes)
  };
}

function readStorage(key: string) {
  const rawState = window.localStorage.getItem(key);
  return rawState ? JSON.parse(rawState) : null;
}

export function loadPlannerState(): PlannerState {
  try {
    return normalizePlannerState(readStorage(storageKey) || readStorage(previousStorageKey) || readStorage(legacyStorageKey));
  } catch {
    return initialState();
  }
}

export function savePlannerState(state: PlannerState) {
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}
