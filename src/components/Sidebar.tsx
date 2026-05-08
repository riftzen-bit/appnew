import { useRef, type ChangeEvent, type FormEvent } from "react";
import { Download, Plus, Trash2, Upload } from "lucide-react";
import { formatDate } from "../format";
import type { EnergyLevel } from "../types";

type SidebarProps = {
  openCount: number;
  completedCount: number;
  onAddTask: (title: string, minutes: number, energy: EnergyLevel, note: string) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onClearAllData: () => void;
};

const minuteOptions = [15, 25, 45, 60];
const energyOptions: Array<{ value: EnergyLevel; label: string }> = [
  { value: "light", label: "Light" },
  { value: "steady", label: "Steady" },
  { value: "deep", label: "Deep" }
];

export function Sidebar({
  completedCount,
  onAddTask,
  onClearAllData,
  onExportData,
  onImportData,
  openCount
}: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") || "").trim();
    const minutes = Number(formData.get("minutes") || 25);
    const energy = String(formData.get("energy") || "steady") as EnergyLevel;
    const note = String(formData.get("note") || "").trim();
    if (!title) return;

    onAddTask(title, minutes, energy, note);
    form.reset();
  }

  function importSelectedFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (file) onImportData(file);
    event.currentTarget.value = "";
  }

  return (
    <aside className="border-b border-[#23252a] bg-[#010102] p-6 xl:border-b-0 xl:border-r">
      <div className="grid gap-7">
        <div className="grid gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#23252a] bg-[#0f1011] p-2 shadow-sm">
              <img alt="Focus Planner" className="h-full w-full rounded-sm" src="/favicon.png" />
            </div>
            <div>
              <h1 className="text-base font-medium text-[#f7f8f8]">Focus Planner</h1>
              <p className="text-sm text-[#8a8f98]">{formatDate(new Date())}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 rounded-md border border-[#23252a] bg-[#0f1011] p-4 shadow-sm">
            <div>
              <p className="text-xs text-[#62666d]">Open</p>
              <p className="font-mono text-xl font-normal text-[#f7f8f8]">{openCount}</p>
            </div>
            <div>
              <p className="text-xs text-[#62666d]">Done</p>
              <p className="font-mono text-xl font-normal text-[#f7f8f8]">{completedCount}</p>
            </div>
          </div>
        </div>

        <form className="grid gap-3" onSubmit={submitTask}>
          <label className="text-sm font-normal text-[#d0d6e0]" htmlFor="task-title">
            Capture
          </label>
          <input
            autoComplete="off"
            className="h-11 rounded-md border border-[#23252a] bg-[#0f1011] px-4 py-2 text-sm text-[#f7f8f8] shadow-sm outline-none placeholder:text-[#62666d] focus:ring-2 focus:ring-[#5e69d1]/50"
            id="task-title"
            name="title"
            placeholder="Task title"
          />
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <fieldset className="grid grid-cols-4 rounded-md border border-[#23252a] bg-[#0f1011] shadow-sm">
              <legend className="sr-only">Estimated minutes</legend>
              {minuteOptions.map((minutes) => (
                <label className="grid h-11 cursor-pointer border-r border-[#23252a] last:border-r-0" key={minutes}>
                  <input
                    className="peer sr-only"
                    defaultChecked={minutes === 25}
                    name="minutes"
                    type="radio"
                    value={minutes}
                  />
                  <span className="flex items-center justify-center font-mono text-xs text-[#8a8f98] peer-checked:bg-[#f7f8f8] peer-checked:text-[#010102]">
                    {minutes}
                  </span>
                </label>
              ))}
            </fieldset>
            <button
              aria-label="Add task"
              className="flex h-11 items-center justify-center gap-2 rounded-md border border-[#5e6ad2] bg-[#5e6ad2] px-4 py-2 font-mono text-xs font-normal uppercase text-white shadow-sm hover:bg-[#828fff]"
              type="submit"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <fieldset className="grid grid-cols-3 rounded-md border border-[#23252a] bg-[#0f1011] shadow-sm">
            <legend className="sr-only">Energy level</legend>
            {energyOptions.map((option) => (
              <label className="grid h-11 cursor-pointer border-r border-[#23252a] last:border-r-0" key={option.value}>
                <input
                  className="peer sr-only"
                  defaultChecked={option.value === "steady"}
                  name="energy"
                  type="radio"
                  value={option.value}
                />
                <span className="flex items-center justify-center text-sm text-[#8a8f98] peer-checked:bg-[#f7f8f8] peer-checked:text-[#010102]">
                  {option.label}
                </span>
              </label>
            ))}
          </fieldset>
          <textarea
            className="min-h-24 resize-none rounded-md border border-[#23252a] bg-[#0f1011] p-4 text-sm leading-6 text-[#f7f8f8] shadow-sm outline-none placeholder:text-[#62666d] focus:ring-2 focus:ring-[#5e69d1]/50"
            name="note"
            placeholder="Optional note"
          />
        </form>

        <section className="grid gap-3 border-t border-[#23252a] pt-5">
          <div>
            <p className="text-sm font-normal text-[#d0d6e0]">Data</p>
            <p className="text-xs leading-5 text-[#62666d]">Local JSON backup</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="grid h-11 grid-cols-[14px_auto] items-center justify-center gap-2 rounded-md border border-[#23252a] bg-[#010102] px-4 py-2 text-xs font-medium uppercase leading-none text-[#f7f8f8] shadow-sm hover:bg-[#0f1011]"
              onClick={onExportData}
              type="button"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="leading-none">Export</span>
            </button>
            <button
              className="grid h-11 grid-cols-[14px_auto] items-center justify-center gap-2 rounded-md border border-[#23252a] bg-[#010102] px-4 py-2 text-xs font-medium uppercase leading-none text-[#f7f8f8] shadow-sm hover:bg-[#0f1011]"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <Upload className="h-3.5 w-3.5" />
              <span className="leading-none">Import</span>
            </button>
            <button
              className="col-span-2 grid h-11 grid-cols-[14px_auto] items-center justify-center gap-2 rounded-md border border-[#23252a] bg-[#010102] px-4 py-2 text-xs font-medium uppercase leading-none text-[#8a8f98] shadow-sm hover:bg-[#0f1011] hover:text-[#f7f8f8]"
              onClick={onClearAllData}
              type="button"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="leading-none">Clear data</span>
            </button>
          </div>
          <input
            accept="application/json"
            className="hidden"
            onChange={importSelectedFile}
            ref={fileInputRef}
            type="file"
          />
        </section>
      </div>
    </aside>
  );
}
