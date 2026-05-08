import { useEffect, useMemo, useState } from "react";
import { MainBoard } from "./components/MainBoard";
import { SessionPanel } from "./components/SessionPanel";
import { Sidebar } from "./components/Sidebar";
import {
  createFocusLog,
  loadPlannerState,
  savePlannerState,
  createTask,
  defaultSessionSeconds,
  getTaskSeconds,
  initialState,
  normalizePlannerState
} from "./plannerState";
import type { EnergyLevel, PlannerState, TaskStatus } from "./types";

type DialogState =
  | { kind: "clear-data" }
  | { kind: "message"; title: string; message: string }
  | null;

function App() {
  const [state, setState] = useState<PlannerState>(() => loadPlannerState());
  const [dialog, setDialog] = useState<DialogState>(null);

  const activeTask = useMemo(() => {
    if (!state.activeTaskId) return null;
    return state.tasks.find((task) => task.id === state.activeTaskId && task.status !== "completed") || null;
  }, [state.activeTaskId, state.tasks]);

  const openTasks = useMemo(() => {
    return state.tasks.filter((task) => task.status !== "completed");
  }, [state.tasks]);

  const completedTasks = useMemo(() => {
    return state.tasks.filter((task) => task.status === "completed");
  }, [state.tasks]);

  useEffect(() => {
    savePlannerState(state);
  }, [state]);

  useEffect(() => {
    if (!state.timer.running) return undefined;

    const intervalId = window.setInterval(() => {
      setState((current) => {
        const nextSeconds = Math.max(0, current.timer.seconds - 1);
        return {
          ...current,
          timer: {
            ...current.timer,
            seconds: nextSeconds,
            running: nextSeconds > 0
          }
        };
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [state.timer.running]);

  function addTask(title: string, minutes: number, energy: EnergyLevel, note: string) {
    const task = createTask(title, minutes, energy, note);
    setState((current) => ({
      ...current,
      tasks: [task, ...current.tasks],
      activeTaskId: task.id,
      timer: {
        taskId: task.id,
        seconds: getTaskSeconds(task),
        running: false,
        startedAt: null
      }
    }));
  }

  function selectTask(taskId: string) {
    setState((current) => {
      const task = current.tasks.find((item) => item.id === taskId && item.status !== "completed");
      if (!task) return current;

      return {
        ...current,
        tasks: current.tasks.map((item) => (item.id === task.id ? { ...item, status: "active" as const } : item)),
        activeTaskId: task.id,
        timer: {
          taskId: task.id,
          seconds: getTaskSeconds(task),
          running: false,
          startedAt: null
        }
      };
    });
  }

  function completeTask(taskId: string) {
    setState((current) => {
      const taskToComplete = current.tasks.find((task) => task.id === taskId && task.status !== "completed");
      if (!taskToComplete) return current;

      const completedAt = new Date().toISOString();
      const tasks = current.tasks.map((task) =>
        task.id === taskId ? { ...task, status: "completed" as const, completedAt } : task
      );
      const nextOpen = tasks.find((task) => task.status === "active") || tasks.find((task) => task.status === "pending") || null;
      const wasActive = current.activeTaskId === taskId;
      const wasTimerTask = current.timer.taskId === taskId;
      const timerSeconds = wasTimerTask ? current.timer.seconds : getTaskSeconds(taskToComplete);
      const log = createFocusLog(
        taskToComplete,
        timerSeconds,
        wasActive ? current.notes : "",
        wasTimerTask ? current.timer.startedAt : null
      );

      return {
        ...current,
        tasks,
        logs: [log, ...current.logs],
        activeTaskId: nextOpen?.id || null,
        timer: {
          taskId: nextOpen?.id || null,
          seconds: getTaskSeconds(nextOpen),
          running: false,
          startedAt: null
        },
        notes: wasActive ? "" : current.notes
      };
    });
  }

  function clearCompleted() {
    setState((current) => ({
      ...current,
      tasks: current.tasks.filter((task) => task.status !== "completed")
    }));
  }

  function deleteTask(taskId: string) {
    setState((current) => {
      const taskToDelete = current.tasks.find((task) => task.id === taskId);
      if (!taskToDelete) return current;

      const tasks = current.tasks.filter((task) => task.id !== taskId);
      const nextOpen =
        current.activeTaskId === taskId
          ? tasks.find((task) => task.status === "active") || tasks.find((task) => task.status === "pending") || null
          : null;

      return {
        ...current,
        tasks,
        activeTaskId: current.activeTaskId === taskId ? nextOpen?.id || null : current.activeTaskId,
        timer:
          current.timer.taskId === taskId
            ? {
                taskId: nextOpen?.id || null,
                seconds: getTaskSeconds(nextOpen),
                running: false,
                startedAt: null
              }
            : current.timer,
        notes: current.activeTaskId === taskId ? "" : current.notes
      };
    });
  }

  function moveTask(taskId: string, status: TaskStatus) {
    setState((current) => {
      const task = current.tasks.find((item) => item.id === taskId);
      if (!task || task.status === status) return current;

      if (status === "completed") {
        const completedAt = new Date().toISOString();
        const tasks = current.tasks.map((item) =>
          item.id === taskId ? { ...item, status, completedAt } : item
        );
        const nextOpen =
          current.activeTaskId === taskId
            ? tasks.find((item) => item.status === "active") || tasks.find((item) => item.status === "pending") || null
            : null;

        return {
          ...current,
          tasks,
          activeTaskId: current.activeTaskId === taskId ? nextOpen?.id || null : current.activeTaskId,
          timer:
            current.timer.taskId === taskId
              ? {
                  taskId: nextOpen?.id || null,
                  seconds: getTaskSeconds(nextOpen),
                  running: false,
                  startedAt: null
                }
              : current.timer
        };
      }

      const movedTask = { ...task, status, completedAt: null };
      return {
        ...current,
        tasks: current.tasks.map((item) => (item.id === taskId ? movedTask : item)),
        activeTaskId: status === "active" ? taskId : current.activeTaskId === taskId ? null : current.activeTaskId,
        timer:
          status === "active"
            ? {
                taskId,
                seconds: getTaskSeconds(movedTask),
                running: false,
                startedAt: null
              }
            : current.timer.taskId === taskId
              ? {
                  taskId: null,
                  seconds: defaultSessionSeconds,
                  running: false,
                  startedAt: null
                }
              : current.timer
      };
    });
  }

  function toggleTimer() {
    if (!activeTask) return;
    setState((current) => ({
      ...current,
      timer: {
        ...current.timer,
        taskId: activeTask.id,
        seconds:
          current.timer.taskId === activeTask.id && current.timer.seconds > 0
            ? current.timer.seconds
            : getTaskSeconds(activeTask),
        running: !current.timer.running,
        startedAt: !current.timer.running
          ? current.timer.startedAt || new Date().toISOString()
          : current.timer.startedAt
      }
    }));
  }

  function resetTimer() {
    if (!activeTask) return;
    setState((current) => ({
      ...current,
      timer: {
        taskId: activeTask.id,
        seconds: getTaskSeconds(activeTask),
        running: false,
        startedAt: null
      }
    }));
  }

  function updateNotes(notes: string) {
    setState((current) => ({
      ...current,
      notes
    }));
  }

  function clearLog() {
    setState((current) => ({
      ...current,
      logs: []
    }));
  }

  function clearAllData() {
    setDialog({ kind: "clear-data" });
  }

  function confirmClearAllData() {
    setState(initialState());
    setDialog(null);
  }

  function exportData() {
    const payload = {
      app: "Focus Planner",
      version: 1,
      exportedAt: new Date().toISOString(),
      state
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `focus-planner-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  function importData(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}")) as unknown;
        const source =
          parsed && typeof parsed === "object" && "state" in parsed
            ? (parsed as { state: unknown }).state
            : parsed;
        setState(normalizePlannerState(source));
        setDialog({
          kind: "message",
          title: "Import complete",
          message: "Your local Focus Planner data was imported."
        });
      } catch {
        setDialog({
          kind: "message",
          title: "Import failed",
          message: "This JSON file could not be imported."
        });
      }
    };
    reader.readAsText(file);
  }

  return (
    <main className="min-h-screen bg-[#010102] text-[#f7f8f8]">
      <div className="grid min-h-screen grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
        <Sidebar
          completedCount={completedTasks.length}
          onAddTask={addTask}
          onClearAllData={clearAllData}
          onExportData={exportData}
          onImportData={importData}
          openCount={openTasks.length}
        />
        <MainBoard
          activeTaskId={state.activeTaskId}
          completedTasks={completedTasks}
          logs={state.logs}
          onClearCompleted={clearCompleted}
          onClearLog={clearLog}
          onCompleteTask={completeTask}
          onDeleteTask={deleteTask}
          onMoveTask={moveTask}
          onSelectTask={selectTask}
          openTasks={openTasks}
        />
        <SessionPanel
          activeTask={activeTask}
          notes={state.notes}
          onCompleteTask={completeTask}
          onResetTimer={resetTimer}
          onToggleTimer={toggleTimer}
          onUpdateNotes={updateNotes}
          timer={state.timer}
        />
      </div>
      {dialog ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#010102]/80 p-6">
          <section className="grid w-full max-w-md gap-5 rounded-md border border-[#23252a] bg-[#0f1011] p-6 shadow-sm">
            {dialog.kind === "clear-data" ? (
              <>
                <div className="grid gap-2">
                  <p className="font-mono text-xs uppercase text-[#62666d]">Confirm</p>
                  <h2 className="text-xl font-medium text-[#f7f8f8]">Clear all local data?</h2>
                  <p className="text-sm leading-6 text-[#8a8f98]">
                    This removes tasks, session notes, completed items, and logs stored on this device.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="h-11 rounded-md border border-[#23252a] bg-[#010102] px-4 py-2 font-mono text-xs uppercase text-[#f7f8f8] shadow-sm hover:bg-[#141516]"
                    onClick={() => setDialog(null)}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="h-11 rounded-md border border-[#5e6ad2] bg-[#5e6ad2] px-4 py-2 font-mono text-xs uppercase text-white shadow-sm hover:bg-[#828fff]"
                    onClick={confirmClearAllData}
                    type="button"
                  >
                    Clear data
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-2">
                  <p className="font-mono text-xs uppercase text-[#62666d]">File</p>
                  <h2 className="text-xl font-medium text-[#f7f8f8]">{dialog.title}</h2>
                  <p className="text-sm leading-6 text-[#8a8f98]">{dialog.message}</p>
                </div>
                <button
                  className="h-11 rounded-md border border-[#5e6ad2] bg-[#5e6ad2] px-4 py-2 font-mono text-xs uppercase text-white shadow-sm hover:bg-[#828fff]"
                  onClick={() => setDialog(null)}
                  type="button"
                >
                  Close
                </button>
              </>
            )}
          </section>
        </div>
      ) : null}
    </main>
  );
}

export default App;
