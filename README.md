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
|- vercel.json    Vercel routing/build config for hosting the website
|- .vercelignore  Files excluded from the Vercel static deployment
|- CHANGELOG.md   Version history
```

## Notes

- Timer settings use slider controls for focus, short break, and long break durations.
- Ambience playback is generated in-app with Web Audio rather than using bundled audio files.
- The app starts with an empty checklist by default.

## Packaging Configuration

Packaging is configured in `package.json` using `electron-builder`.

- Windows target: `nsis`
- macOS target: `dmg`

## Deploying the Website to Vercel

`landing.html` and `app.html` are plain static files, so they can be hosted on Vercel without a build step. The repo includes `vercel.json` and `.vercelignore` to support this:

- `/` serves `landing.html` (the marketing site)
- `/app` serves `app.html` (the web version of the app)
- Install/build commands are no-ops, since there is nothing to compile and the Electron `devDependencies` don't need to be installed for the website

### Steps

1. Push this repo to GitHub (or your Git provider of choice).
2. In the [Vercel dashboard](https://vercel.com/new), import the repository. Vercel will detect it as a static project from `vercel.json`.
3. Deploy. No environment variables are required.

Alternatively, from the project root with the [Vercel CLI](https://vercel.com/docs/cli) installed:

```bash
vercel
```

### Note on the Windows installer size

`downloads/PomoPaw.exe` is roughly 104 MB. Vercel's Hobby plan limits static file uploads to 100 MB, so this file may fail to deploy on Hobby. If that happens, either upgrade to a Pro plan (1 GB static file limit) or host the installer elsewhere (e.g. a GitHub Release or object storage) and point the download buttons in `landing.html` at that URL instead.

## License

This project currently does not include a license. Add one if you plan to publish it publicly on GitHub.
