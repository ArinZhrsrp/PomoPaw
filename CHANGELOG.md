# Changelog

All notable changes to PomoPaw are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and version numbers below are inferred from project history rather than published releases.

## [Unreleased]

### Added

- Vercel deployment configuration (`vercel.json`, `.vercelignore`) so the landing page and web app can be hosted online.
- "Use Web Version" links in the site header, hero section, and download section, letting visitors try PomoPaw directly in the browser without installing it.
- Notices recommending the desktop app for the best experience whenever the web version is offered.
- A "PomoPaw for Mac" coming-soon card in the download section.
- Windows and Apple icons on the download buttons so the right platform is recognizable at a glance.

### Changed

- The in-app minimize button is now hidden automatically when PomoPaw is opened in a browser, since it only has meaning inside the Electron desktop window.

## [1.0.0] - 2026-03-29

### Added

- Marketing landing page (`landing.html`, `landing.css`) with a live embedded preview of the app, feature/workflow/audience sections, and a Windows download link.

## [0.2.0] - 2026-03-28

### Fixed

- Layout alignment issues across the website, mobile, and desktop app views.

## [0.1.0] - 2026-03-28

### Added

- Initial PomoPaw Electron desktop app: Pomodoro timer with focus, short break, and long break modes.
- To-do list with daily report counters for sessions and tasks.
- Layered ambience sounds (rain, breeze, brown noise, cafe hum).
- Custom frameless window with in-app minimize and close controls.
- Local persistence via `localStorage` for settings and tasks.
