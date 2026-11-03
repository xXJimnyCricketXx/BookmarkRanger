<div align="center">

<img src="docs/img/bookmarkranger-banner.png" alt="BookmarkRanger!" width="100%">

<br/><br/>

# BookmarkRanger!

### A self-hosted manager for your bookmarks and code snippets

Organize links into boards and categories, keep a searchable snippet library, and pin what you
use most to your own dashboard. Your data stays on your own server.

<p>
  <img src="https://img.shields.io/badge/Status-Stable-FF6F9C?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/Version-1.2.0-FF6F9C?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/Docker-Ready-FF6F9C?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/Unraid-Template-FF6F9C?style=for-the-badge&logo=unraid&logoColor=white" alt="Unraid">
</p>

**[Overview](#-overview)** ·
**[Features](#-features)** ·
**[Getting Started](#-getting-started)** ·
**[Unraid](#-unraid)** ·
**[Configuration](#-configuration)** ·
**[Roadmap](#-roadmap)**

</div>

<br/><br/>

## <img src="https://api.iconify.design/lucide/book-open.svg?color=%23FF6F9C" width="20"> Overview

**BookmarkRanger!** keeps your bookmarks and code snippets in one place. Links live in boards and
categories, snippets in a tagged library with syntax highlighting, and whatever you use most can be
pinned to a customizable dashboard.

When you want to hand a curated set of links or snippets to someone else, publish it as its own
public page. Visitors need no account and only see what you put on that page.

<br/><br/>

## <img src="https://api.iconify.design/lucide/sparkles.svg?color=%23FF6F9C" width="20"> Features

- **Boards and categories** – Group bookmarks into boards, each split into categories. With custom sorting enabled, reorder them by drag-and-drop or with up/down controls.
- **Snippet library** – Tagged, searchable code snippets with syntax highlighting, a documentation field, and one-click copy of the code or a raw-text URL.
- **Customizable dashboard** – Pin categories, links and snippets, and drag one pinned link onto another to group them in their own box. Includes an optional greeting with date, time and current weather (via Open-Meteo, no API key required).
- **Sharing** – Publish boards, categories and snippets to any number of named public pages, each with its own URL and no login required to view.
- **Automatic favicons** – Looks up each site's own declared icon instead of just guessing `/favicon.ico`.
- **Backups** – Automatic backups with an interval in days and adjustable retention, plus manual backups. Download, upload, delete and restore them in Settings. Restoring saves the current state first and also accepts backups from older versions.
- **Color themes** – 16 built-in themes, plus your own custom ones.
- **Two languages** – German and English, switchable per account.

<br/><br/>

## <img src="https://api.iconify.design/lucide/layers-3.svg?color=%23FF6F9C" width="20"> Tech Stack

| **Area** | **Technology** | **Purpose** |
| :--- | :--- | :--- |
| **Backend** | <img src="https://go-skill-icons.vercel.app/api/icons?i=nodejs,express&theme=dark" valign="middle" /> | Express with session login and bcrypt password hashes |
| **Frontend** | <img src="https://go-skill-icons.vercel.app/api/icons?i=html,tailwind,js&theme=dark" valign="middle" /> | EJS templates, Tailwind CSS and plain JavaScript, all served from the app itself |
| **Database** | <img src="https://go-skill-icons.vercel.app/api/icons?i=sqlite,prisma&theme=dark" valign="middle" /> | One SQLite file in the mounted data folder, accessed through Prisma |
| **Localization** | i18next | German and English translations |
| **Highlighting** | highlight.js | Syntax highlighting for snippets |
| **Container** | <img src="https://go-skill-icons.vercel.app/api/icons?i=docker&theme=dark" valign="middle" /> | Image published to GHCR via GitHub Actions |

<br/><br/>

## <img src="https://api.iconify.design/lucide/rocket.svg?color=%23FF6F9C" width="20"> Getting Started

### Prerequisites

- Docker with Compose

### Installation

```bash
git clone https://github.com/xXJimnyCricketXx/BookmarkRanger.git
cd BookmarkRanger
cp .env.example .env
docker compose up -d --build
```

The app is now available at:

```text
http://localhost:18004
```

On the first visit, create your account on the setup page.

<br/><br/>

## <img src="https://api.iconify.design/lucide/container.svg?color=%23FF6F9C" width="20"> Unraid

The image is built by GitHub Actions on every push to `main` and on `v*` tags
([docker-publish.yml](.github/workflows/docker-publish.yml)):

```text
ghcr.io/xxjimnycricketxx/bookmarkranger:latest
```

**1. Install the template.** On the Unraid console:

```bash
curl -fsSL -o /boot/config/plugins/dockerMan/templates-user/my-BookmarkRanger.xml https://raw.githubusercontent.com/xXJimnyCricketXx/BookmarkRanger/main/unraid-template/bookmarkranger.xml
```

**2. Create the container.** Go to *Docker → Add Container → Template: BookmarkRanger*.

Port `18004`, the appdata paths under `/mnt/user/appdata/bookmarkranger` and `PUID`/`PGID` are pre-filled.

**Updates:** *Docker → Check for Updates*, then apply the update for BookmarkRanger.

**Installed before 1.1.1?** The old command saved the template as `bookmarkranger.xml`. Unraid can then rebuild the container from that file on updates and drop variables added later. Move it out of the way once:

```bash
mv /boot/config/plugins/dockerMan/templates-user/bookmarkranger.xml /boot/config/plugins/dockerMan/bookmarkranger.xml.bak
```

<br/><br/>

## <img src="https://api.iconify.design/lucide/settings.svg?color=%23FF6F9C" width="20"> Configuration

All settings are environment variables: `.env` for Docker Compose, template variables on Unraid.

| Variable | Required | Default | Description |
| --- | :---: | --- | --- |
| `SESSION_SECRET` | ❌ | generated | Signs session cookies. If empty, one is generated on the first start and stored as `session_secret` in the data folder |
| `BASE_URL` | ❌ | empty | Base path for serving on a sub-path, leave empty to serve from root |
| `PORT` | ❌ | `3099` | Port the app listens on inside the container |
| `PUID` / `PGID` | ❌ | Owner of the data folder, or `1000` if that is root | User and group the container runs as and that own the data and backups folders. The Unraid template uses `99` / `100` |
| `DATABASE_URL` | ❌ | `file:../data/bookmarkranger.db` | SQLite connection string. The Docker image already points this at the mounted data volume, so it only matters for a manual install |

> [!IMPORTANT]
> Automatic backups run once a day by default, but they stay on the same disk unless you move them.
> On Unraid, point the backups path to another share. With Compose, also copy the backups folder to another disk.

> [!WARNING]
> The app itself speaks plain HTTP. Keep it inside your home network, and use a VPN or an HTTPS reverse
> proxy for access from outside. A reverse proxy must pass the original `Host` or `X-Forwarded-Host` header,
> otherwise the app blocks form submissions as cross-site requests.

<br/><br/>

## <img src="https://api.iconify.design/lucide/folder-tree.svg?color=%23FF6F9C" width="20"> Project Structure

```text
BookmarkRanger/
├── assets/              # source of the Tailwind stylesheet
├── config/              # database client, i18n, built-in themes
├── controllers/         # request handlers per section
├── routes/              # Express routes
├── middleware/          # setup check and login protection
├── utils/               # backups, search, favicons, weather, changelog helpers
├── views/               # EJS templates
├── locales/             # German and English translations
├── prisma/              # schema and migrations
├── public/              # logos and vendored frontend libraries
├── scripts/             # maintenance scripts
├── test/                # test suite
├── unraid-template/
├── .github/workflows/
│   └── docker-publish.yml
├── changelog.json       # shown in the app, its newest entry sets the app version
├── app.js
├── Dockerfile
├── docker-entrypoint.sh
├── docker-compose.yml
└── .env.example
```

<br/><br/>

## <img src="https://api.iconify.design/lucide/map.svg?color=%23FF6F9C" width="20"> Roadmap

| **Version** | **Features** | **Status** |
| :---: | :--- | :---: |
| **1.2.0** | <ul><li>Major updates of Prisma and EJS</li><li>Frontend libraries served from the app instead of external CDNs</li><li>Local fallback icon for bookmarks</li><li>Uploaded backups keep their original date</li><li>Clear warning before restoring, and old icon paths repaired afterwards</li></ul> | <img src="https://img.shields.io/badge/Released-FF6F9C?style=for-the-badge" alt="Released"> |
| **1.1.1** | <ul><li>Unraid install no longer leaves a second template behind that can drop variables on updates</li><li>Container keeps the folder owner when PUID and PGID are not set</li></ul> | <img src="https://img.shields.io/badge/Released-FF6F9C?style=for-the-badge" alt="Released"> |
| **1.1.0** | <ul><li>Automatic backups with an interval in days and adjustable retention</li><li>Restoring, uploading and deleting backups in the app</li><li>Container without root rights on Node.js 24 LTS</li><li>Public health endpoint and Docker health check</li><li>Test suite that runs before every image build</li></ul> | <img src="https://img.shields.io/badge/Released-FF6F9C?style=for-the-badge" alt="Released"> |
| **1.0.2** | <ul><li>Bug fixes for dashboard groups, snippet ordering and the board management dialog</li><li>Complete translations and proper "not found" pages</li><li>Larger snippets, up to 2 MB</li></ul> | <img src="https://img.shields.io/badge/Released-FF6F9C?style=for-the-badge" alt="Released"> |
| **1.0.1** | <ul><li>Security hardening for sessions, login and input validation</li><li>Session secret generated automatically if none is set</li><li>Dependency updates</li></ul> | <img src="https://img.shields.io/badge/Released-FF6F9C?style=for-the-badge" alt="Released"> |
| **1.0.0** | <ul><li>Boards, categories and bookmarks with automatic favicons</li><li>Snippet library with syntax highlighting</li><li>Customizable dashboard with groups, greeting and weather</li><li>Public share pages</li><li>Themes, German and English, on-demand backups</li><li>Docker image and Unraid template</li></ul> | <img src="https://img.shields.io/badge/Released-FF6F9C?style=for-the-badge" alt="Released"> |

See the [open issues](../../issues) for planned features and known problems.

<br/><br/>

## <img src="https://api.iconify.design/lucide/code-2.svg?color=%23FF6F9C" width="20"> Development

Run the app locally:

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate deploy
npm run dev
```

The app is then available at `http://localhost:3099`.

Run the tests. They start the app against temporary folders and never touch your data:

```bash
npm test
```

After using new Tailwind classes in a template, rebuild the stylesheet. The tests fail if it is out of date:

```bash
npm run build:css
```

### Refreshing favicons

Looks up icons again for bookmarks that have none or still point at an old local icon file:

```bash
node scripts/backfill-favicons.js
```

<br/><br/>

## <img src="https://api.iconify.design/lucide/git-pull-request.svg?color=%23FF6F9C" width="20"> Contributing

Issues and pull requests are welcome. Please open an issue first for larger changes.

<br/><br/>

## <img src="https://api.iconify.design/lucide/scale.svg?color=%23FF6F9C" width="20"> License

This project is licensed under the **MIT License**.

See [`LICENSE`](LICENSE) for details.

<br/><br/>

---

<br>

<div align="center">

<a href="https://github.com/xXJimnyCricketXx">
  <img src="https://img.shields.io/badge/GitHub-271B48?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
</a>
<a href="https://cricketcode.de">
  <img src="https://img.shields.io/badge/Website-271B48?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Website">
</a>

</div>
