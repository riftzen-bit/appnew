# Focus Planner

A local-first task and focus timer app built with React, Vite, Tailwind CSS, and Tauri.

Focus Planner keeps the workflow small and fast: capture work, move it through a board, focus on one active task, and keep the data on your device.

## Features

- Task board with `Backlog`, `In progress`, and `Done` columns
- Add tasks with estimated time, energy level, and optional notes
- Move tasks by status selector or drag and drop
- Mark tasks complete and delete individual tasks
- Focus timer tied to the active task
- Session notes and session log
- Local JSON import and export
- Persistent local state through browser storage
- Tauri desktop shell configuration

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Tauri 2
- Lucide React icons

## Getting Started

Install dependencies:

```bash
npm install
```

Run the web app locally:

```bash
npm run dev
```

Build the web app:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Run through Tauri:

```bash
npm run tauri dev
```

## Release

Latest release: [Focus Planner v0.1.0](https://github.com/riftzen-bit/appnew/releases/tag/v0.1.0)

## Data Storage

Focus Planner stores task state locally on the device. Use the built-in JSON export/import controls if you want to back up or move your planner data.

## License

No license has been specified yet.
