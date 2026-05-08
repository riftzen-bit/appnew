import { Check, Pause, Play, RotateCcw } from "lucide-react";
import { formatDateTime, formatMinutes, formatSeconds } from "../format";
import type { Task, TimerState } from "../types";

type SessionPanelProps = {
  activeTask: Task | null;
  timer: TimerState;
  notes: string;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onCompleteTask: (taskId: string) => void;
  onUpdateNotes: (notes: string) => void;
};

export function SessionPanel({
  activeTask,
  notes,
  onCompleteTask,
  onResetTimer,
  onToggleTimer,
  onUpdateNotes,
  timer
}: SessionPanelProps) {
  return (
    <aside className="grid content-start gap-6 bg-[#010102] p-6">
      <section className="grid gap-5 rounded-md border border-[#23252a] bg-[#0f1011] p-5 shadow-sm">
        <div className="grid gap-2">
          <p className="font-mono text-xs uppercase text-[#62666d]">Focus session</p>
          {activeTask ? (
            <>
              <h2 className="text-xl font-medium leading-7 text-[#f7f8f8]">{activeTask.title}</h2>
              <div className="flex flex-wrap gap-2 text-sm text-[#8a8f98]">
                <span>{formatMinutes(activeTask.minutes)}</span>
                <span>{activeTask.energy}</span>
              </div>
              {activeTask.note ? <p className="text-sm leading-6 text-[#8a8f98]">{activeTask.note}</p> : null}
            </>
          ) : (
            <>
              <h2 className="text-xl font-medium text-[#f7f8f8]">No active task</h2>
              <p className="text-sm leading-6 text-[#8a8f98]">Select a task from the board.</p>
            </>
          )}
        </div>

        <div className="grid gap-4 rounded-md border border-[#23252a] bg-[#010102] p-4 shadow-sm">
          <div className="font-mono text-5xl font-light tabular-nums text-[#f7f8f8]">
            {formatSeconds(timer.seconds)}
          </div>
          <div className="grid gap-1 text-xs text-[#62666d]">
            <p>{timer.startedAt ? `Started ${formatDateTime(timer.startedAt)}` : "Timer not started"}</p>
            <p>{timer.running ? "Session running" : "Session paused"}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              aria-label={timer.running ? "Pause timer" : "Start timer"}
              className="flex h-10 items-center justify-center rounded-md border border-[#5e6ad2] bg-[#5e6ad2] p-0 text-white shadow-sm hover:bg-[#828fff] disabled:cursor-not-allowed disabled:opacity-30"
              disabled={!activeTask}
              onClick={onToggleTimer}
              title={timer.running ? "Pause" : "Start"}
              type="button"
            >
              {timer.running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              aria-label="Reset timer"
              className="flex h-10 items-center justify-center rounded-md border border-[#23252a] bg-[#010102] p-0 text-[#f7f8f8] shadow-sm hover:bg-[#0f1011] disabled:cursor-not-allowed disabled:opacity-30"
              disabled={!activeTask}
              onClick={onResetTimer}
              title="Reset"
              type="button"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              aria-label="Complete active task"
              className="flex h-10 items-center justify-center rounded-md border border-[#23252a] bg-[#010102] p-0 text-[#f7f8f8] shadow-sm hover:bg-[#0f1011] disabled:cursor-not-allowed disabled:opacity-30"
              disabled={!activeTask}
              onClick={() => activeTask && onCompleteTask(activeTask.id)}
              title="Done"
              type="button"
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 rounded-md border border-[#23252a] bg-[#0f1011] p-5 shadow-sm">
        <label className="text-sm font-normal text-[#d0d6e0]" htmlFor="session-notes">
          Notes
        </label>
        <textarea
          className="min-h-48 resize-none rounded-md border border-[#23252a] bg-[#010102] p-4 text-sm leading-6 text-[#f7f8f8] shadow-sm outline-none placeholder:text-[#62666d] focus:ring-2 focus:ring-[#5e69d1]/50"
          id="session-notes"
          onChange={(event) => onUpdateNotes(event.currentTarget.value)}
          placeholder="Write your own session notes."
          value={notes}
        />
      </section>
    </aside>
  );
}
