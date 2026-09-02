<p align="center">
  <img src="./docs/img/bookmarkranger-banner.png" alt="BookmarkRanger! banner" width="100%">
</p>

<p align="center">
  A modern, self-hostable manager for bookmarks and code snippets.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License">
  <img src="https://img.shields.io/badge/Self--Hosted-Yes-green.svg" alt="Self-hosted">
  <img src="https://img.shields.io/badge/Docker-Ready-blue.svg" alt="Docker ready">
  <a href="https://github.com/xXJimnyCricketXx/BookmarkRanger/actions/workflows/docker-publish.yml">
    <img src="https://github.com/xXJimnyCricketXx/BookmarkRanger/actions/workflows/docker-publish.yml/badge.svg" alt="Build status">
  </a>
</p>

## Overview

BookmarkRanger! keeps your bookmarks and code snippets in one place. Organize links into boards and categories, keep a tagged snippet library with syntax highlighting, and pin whatever you use most to a fully customizable dashboard. When you need to hand a curated set of links or snippets to someone else, publish it as its own public page — no account required to view it.

## Contents

- [Features](#features)
- [Quick Start (Docker Compose)](#quick-start-docker-compose)
- [Unraid](#unraid)
- [Configuration](#configuration)
- [Tech Stack](#tech-stack)
- [License](#license)

## Features

- **Boards & Categories** — Group bookmarks into boards, each split into categories. Reorder categories and links by drag-and-drop, or switch to manual mode and use simple up/down controls instead.
- **Snippet Library** — A tagged, searchable collection of code snippets with real syntax highlighting, a documentation field, and one-click copy of the code or a raw-text URL.
- **Customizable Dashboard** — Pin your favorite boards, categories, links, and snippets to the dashboard, and group pinned links into Kanban-style boxes by dragging one onto another. Includes an optional greeting header with the date/time and current weather (via Open-Meteo, no API key required).
- **Sharing** — Publish selected boards, categories, and snippets to any number of named public pages, each with its own URL and no login required to view — useful for handing a curated set of links to someone without giving them access to everything else.
- **Automatic Favicon Detection** — Looks up each bookmarked site's own declared icon instead of just guessing `/favicon.ico`.
- **Backups** — Create and download on-demand database backups from Settings.
- **Color Themes** — 16 built-in color themes plus the ability to define your own.
- **Multilingual** — Fully localized in English 🇬🇧 and German 🇩🇪.

## Quick Start (Docker Compose)

```bash
git clone https://github.com/xXJimnyCricketXx/BookmarkRanger.git
cd BookmarkRanger
cp .env.example .env
# edit .env and set at least SESSION_SECRET (see Configuration below)
docker compose up -d
```

The app is then available at `http://localhost:18004`.

## Unraid

A ready-made template is available at [`unraid-template/bookmarkranger.xml`](unraid-template/bookmarkranger.xml). In Unraid, go to **Docker → Add Container**, paste the raw GitHub URL of that file into the **Template** field, and ports, paths, and variables will be pre-filled.

## Configuration

| Variable | Required | Description |
|---|---|---|
| `SESSION_SECRET` | yes | Complex secret used to sign session cookies |
| `BASE_URL` | no | Base path for serving on a sub-path, leave empty to serve from root |
| `PORT` | no | Port the app listens on inside the container (default: `3099`) |
| `DATABASE_URL` | no | SQLite connection string — the Docker image already points this at the mounted data volume; only relevant for a manual (non-Docker) install |

## Tech Stack

| Component | Technology |
|---|---|
| Backend | Node.js / Express |
| Database | SQLite (via Prisma) |
| Frontend | EJS Templates |
| Styling | Tailwind CSS |
| Localization | i18next |
| Syntax Highlighting | highlight.js |

## License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for more information.
