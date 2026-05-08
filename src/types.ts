export type EnergyLevel = "light" | "steady" | "deep";
export type TaskStatus = "pending" | "active" | "completed";

export type Task = {
  id: string;
  title: string;
  minutes: number;
  energy: EnergyLevel;
  note: string;
  status: TaskStatus;
  createdAt: string;
  completedAt: string | null;
};

export type TimerState = {
  taskId: string | null;
  seconds: number;
  running: boolean;
  startedAt: string | null;
};

export type FocusLog = {
  id: string;
  taskId: string;
  taskTitle: string;
  minutesPlanned: number;
  secondsSpent: number;
  note: string;
  startedAt: string | null;
  completedAt: string;
};

export type PlannerState = {
  tasks: Task[];
  logs: FocusLog[];
  activeTaskId: string | null;
  timer: TimerState;
  notes: string;
};
