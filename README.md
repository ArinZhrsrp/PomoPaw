# PomoPaw

PomoPaw is a cute Pomodoro desktop app built with Electron. It combines a focus timer, a checklist, daily progress counters, layered ambience sounds, and a custom paw-themed interface in a small desktop-friendly layout.

The project also includes a marketing-style landing page so you can showcase the app like a product website.

## Features

- Focus, short break, and long break timer modes
- Custom settings for timer durations
- Multi-select ambience layers: Rain, Breeze, Brown Noise, and Cafe Hum
- To-do and done lists with add, complete, undo, and delete actions
- Daily report cards for focus sessions, tasks left, and tasks completed
- Custom frameless desktop window with in-app minimize and close controls
- Local persistence using `localStorage`, so your timer settings and tasks stay saved between sessions
- Cute custom UI with a paw-based timer display
- Standalone landing page with a live embedded app preview

## Built With

- Electron
- HTML
- CSS
- Vanilla JavaScript
- electron-builder

## Getting Started

### Prerequisites

- Node.js
- npm

### Install

```bash
npm install
```

### Run the app

```bash
npm start
```

You can also run:

```bash
npm run dev
```

### View the landing page

Open `landing.html` in your browser to view the website version of PomoPaw.

- `landing.html` is the landing page
- `app.html` is the embedded app preview used inside the landing page

If you only want to view the website, you do not need to run Electron.

## Build

### Windows

```bash
npm run build:win
```

### macOS

```bash
npm run build:mac
```

## Project Structure

```text
.
|- main.js        Electron main process and window setup
|- preload.js     Safe bridge for desktop window actions
|- landing.html   Marketing landing page for showcasing the app
|- landing.css    Landing page styling
|- app.html       Main app UI
|- app.css        Styling and layout
|- app.js         Timer, checklist, settings, persistence, and ambience logic
|- assets/        App assets such as the paw image
|- build/         Build resources and app icons
```

## Notes

- Timer settings use slider controls for focus, short break, and long break durations.
- Ambience playback is generated in-app with Web Audio rather than using bundled audio files.
- The app starts with an empty checklist by default.

## Packaging Configuration

Packaging is configured in `package.json` using `electron-builder`.

- Windows target: `nsis`
- macOS target: `dmg`

## License

This project currently does not include a license. Add one if you plan to publish it publicly on GitHub.
