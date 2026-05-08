import { useMemo, useState, type DragEvent } from "react";
import { Check, Search, Trash2 } from "lucide-react";
import { formatCreatedAt, formatDateTime, formatDuration, formatMinutes } from "../format";
import type { FocusLog, Task, TaskStatus } from "../types";

type MainBoardProps = {
  activeTaskId: string | null;
  openTasks: Task[];
  completedTasks: Task[];
  logs: FocusLog[];
  onSelectTask: (taskId: string) => void;
  onCompleteTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTask: (taskId: string, status: TaskStatus) => void;
  onClearCompleted: () => void;
  onClearLog: () => void;
};

const boardColumns: Array<{
  status: TaskStatus;
  title: string;
  empty: string;
}> = [
  { status: "pending", title: "Backlog", empty: "Nothing waiting." },
  { status: "active", title: "In progress", empty: "No active work." },
  { status: "completed", title: "Done", empty: "No completed tasks." }
];

const statusLabels: Record<TaskStatus, string> = {
  pending: "Backlog",
  active: "In progress",
  completed: "Done"
};

export function MainBoard({
  activeTaskId,
  completedTasks,
  logs,
  onClearCompleted,
  onClearLog,
  onCompleteTask,
  onDeleteTask,
  onMoveTask,
  onSelectTask,
  openTasks
}: MainBoardProps) {
  const [query, setQuery] = useState("");
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const tasks = useMemo(() => [...openTasks, ...completedTasks], [completedTasks, openTasks]);
  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return tasks;
    return tasks.filter((task) => {
      return `${task.title} ${task.note} ${task.energy} ${statusLabels[task.status]}`.toLowerCase().includes(normalizedQuery);
    });
  }, [query, tasks]);
  const tasksByStatus = useMemo(() => {
    return boardColumns.reduce(
      (result, column) => ({
        ...result,
        [column.status]: filteredTasks.filter((task) => task.status === column.status)
      }),
      {} as Record<TaskStatus, Task[]>
    );
  }, [filteredTasks]);
  const openMinutes = openTasks.reduce((total, task) => total + task.minutes, 0);
  const loggedSeconds = logs.reduce((total, log) => total + log.secondsSpent, 0);

  function changeTaskStatus(task: Task, status: TaskStatus) {
    if (task.status === status) return;
    if (status === "completed" && task.status !== "completed") {
      onCompleteTask(task.id);
      return;
    }
    onMoveTask(task.id, status);
  }

  function dropTask(event: DragEvent<HTMLElement>, status: TaskStatus) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain");
    const task = tasks.find((item) => item.id === taskId);
    if (task) changeTaskStatus(task, status);
    setDraggingTaskId(null);
  }

  return (
    <section className="grid content-start gap-7 border-b border-[#23252a] bg-[#010102] p-6 xl:border-b-0 xl:border-r">
      <header className="grid gap-4 border-b border-[#23252a] pb-6">
        <p className="font-mono text-xs uppercase text-[#62666d]">Task board</p>
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
          <div className="grid gap-2">
            <h2 className="text-4xl font-semibold text-[#f7f8f8] md:text-5xl">Today&apos;s work</h2>
            <p className="max-w-xl text-base leading-6 text-[#8a8f98]">A local board for planning, focus, and closure.</p>
          </div>
          <div className="grid grid-cols-2 rounded-md border border-[#23252a] bg-[#0f1011] shadow-sm">
            <div className="border-r border-[#23252a] p-4">
              <p className="text-xs text-[#62666d]">Open time</p>
              <p className="font-mono text-lg text-[#f7f8f8]">{formatMinutes(openMinutes)}</p>
            </div>
            <div className="p-4">
              <p className="text-xs text-[#62666d]">Tracked</p>
              <p className="font-mono text-lg text-[#f7f8f8]">{formatDuration(loggedSeconds)}</p>
            </div>
          </div>
        </div>
      </header>

      <label className="grid gap-2" htmlFor="task-search">
        <span className="text-sm text-[#d0d6e0]">Find</span>
        <span className="grid h-11 grid-cols-[auto_1fr] items-center gap-2 rounded-md border border-[#23252a] bg-[#0f1011] px-4 py-2 shadow-sm">
          <Search className="h-4 w-4 text-[#62666d]" />
          <input
            className="h-full bg-transparent text-sm text-[#f7f8f8] outline-none placeholder:text-[#62666d]"
            id="task-search"
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Title, note, energy, status"
            value={query}
          />
        </span>
      </label>

      <div className="grid items-start gap-4 xl:grid-cols-3">
        {boardColumns.map((column) => {
          const columnTasks = tasksByStatus[column.status];
          return (
            <section
              className="grid content-start overflow-hidden rounded-md border border-[#23252a] bg-[#0f1011] shadow-sm"
              key={column.status}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => dropTask(event, column.status)}
            >
              <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-[#23252a] p-4">
                <h3 className="text-sm font-medium text-[#f7f8f8]">{column.title}</h3>
                <span className="rounded-sm border border-[#23252a] bg-[#141516] px-3 py-1 font-mono text-xs text-[#d0d6e0] shadow-sm">
                  {columnTasks.length}
                </span>
              </div>

              {columnTasks.length ? (
                columnTasks.map((task) => (
                  <article
                    className={`grid cursor-grab gap-3 border-b border-[#23252a] p-4 last:border-b-0 ${
                      task.id === activeTaskId
                        ? "bg-[#18191a]"
                        : draggingTaskId === task.id
                          ? "bg-[#141516]"
                          : "bg-transparent"
                    }`}
                    draggable
                    key={task.id}
                    onDragEnd={() => setDraggingTaskId(null)}
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", task.id);
                      setDraggingTaskId(task.id);
                    }}
                  >
                    <button
                      className="grid gap-2 rounded-sm text-left focus:outline-none focus:ring-2 focus:ring-[#5e69d1]/50"
                      disabled={task.status === "completed"}
                      onClick={() => onSelectTask(task.id)}
                      type="button"
                    >
                      <span className="text-sm font-medium text-[#f7f8f8]">{task.title}</span>
                      <span className="flex flex-wrap gap-2 text-xs text-[#8a8f98]">
                        <span>{task.energy}</span>
                        <span>{formatMinutes(task.minutes)}</span>
                        <span>Added {formatCreatedAt(task.createdAt)}</span>
                      </span>
                      {task.completedAt ? (
                        <span className="text-xs text-[#62666d]">Done {formatDateTime(task.completedAt)}</span>
                      ) : null}
                      {task.note ? <span className="text-sm leading-6 text-[#8a8f98]">{task.note}</span> : null}
                    </button>

                    <div className="grid grid-cols-[minmax(0,1fr)_40px_40px] gap-2">
                      <label className="grid gap-1" htmlFor={`status-${task.id}`}>
                        <span className="sr-only">Status</span>
                        <select
                          className="h-10 rounded-md border border-[#23252a] bg-[#141516] px-3 py-2 text-sm text-[#f7f8f8] outline-none focus:ring-2 focus:ring-[#5e69d1]/50"
                          id={`status-${task.id}`}
                          onChange={(event) => changeTaskStatus(task, event.currentTarget.value as TaskStatus)}
                          value={task.status}
                        >
                          {boardColumns.map((option) => (
                            <option key={option.status} value={option.status}>
                              {option.title}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        aria-label={task.status === "completed" ? `${task.title} is complete` : `Complete ${task.title}`}
                        className="flex h-10 w-10 items-center justify-center rounded-md border border-[#34343a] bg-[#0f1011] p-0 text-[#f7f8f8] shadow-sm hover:border-[#5e6ad2] hover:bg-[#141516] disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={task.status === "completed"}
                        onClick={() => onCompleteTask(task.id)}
                        title={task.status === "completed" ? "Complete" : "Mark complete"}
                        type="button"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        aria-label={`Delete ${task.title}`}
                        className="flex h-10 w-10 items-center justify-center rounded-md border border-[#34343a] bg-[#0f1011] p-0 text-[#8a8f98] shadow-sm hover:border-[#5e6ad2] hover:bg-[#141516] hover:text-[#f7f8f8]"
                        onClick={() => onDeleteTask(task.id)}
                        title="Delete task"
                        type="button"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="grid min-h-32 place-items-center p-4 text-center text-sm leading-6 text-[#62666d]">
                  {column.empty}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <section className="grid gap-3 border-t border-[#23252a] pt-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-normal text-[#d0d6e0]">Completed</h3>
          <button
            className="grid h-10 grid-cols-[14px_auto] items-center justify-center gap-2 rounded-md border border-[#23252a] bg-transparent px-4 py-2 text-xs font-medium uppercase leading-none text-[#8a8f98] shadow-sm hover:bg-[#0f1011] hover:text-[#f7f8f8] disabled:cursor-not-allowed disabled:opacity-30"
            disabled={!completedTasks.length}
            onClick={onClearCompleted}
            type="button"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="leading-none">Clear</span>
          </button>
        </div>
      </section>

      <section className="grid gap-3 border-t border-[#23252a] pt-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-normal text-[#d0d6e0]">Session log</h3>
          <button
            className="grid h-10 grid-cols-[14px_auto] items-center justify-center gap-2 rounded-md border border-[#23252a] bg-transparent px-4 py-2 text-xs font-medium uppercase leading-none text-[#8a8f98] shadow-sm hover:bg-[#0f1011] hover:text-[#f7f8f8] disabled:cursor-not-allowed disabled:opacity-30"
            disabled={!logs.length}
            onClick={onClearLog}
            type="button"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="leading-none">Clear</span>
          </button>
        </div>
        {logs.length ? (
          <div className="grid gap-2">
            {logs.slice(0, 8).map((log) => (
              <article className="grid gap-2 rounded-md border border-[#23252a] bg-[#0f1011] p-4 shadow-sm" key={log.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-[#f7f8f8]">{log.taskTitle}</p>
                  <p className="font-mono text-xs text-[#62666d]">{formatDuration(log.secondsSpent)}</p>
                </div>
                <p className="text-xs text-[#62666d]">{formatDateTime(log.completedAt)}</p>
                {log.note ? <p className="text-sm leading-6 text-[#8a8f98]">{log.note}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#62666d]">No sessions logged yet.</p>
        )}
      </section>
    </section>
  );
}
