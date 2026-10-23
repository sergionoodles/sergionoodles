```text
~❯ whoami
Hello, I'm Sergio
```

Building web, mobile and Linux apps. Logging what I ship (and what breaks) so I'll have something to read when AI takes over 🍜

Daily log on X: [@sergionoodle](https://x.com/sergionoodle)

---

### ~❯ ls ~/projects --featured

#### PixelStash
Every PC game you own, from Steam, Epic, GOG and itch.io, in one searchable library. Steam sync, bulk imports and Steam Deck filters.
**[pixelstash.cc](https://pixelstash.cc)** · sign in with Steam
<!-- Repo is private for now. Once public, add: · [repo](https://github.com/sergionoodles/pixelstash) -->

<!-- 🎥 GIF: Sync Now → cover grid fills → Steam Deck Playable+ filter → search a title, ~10s -->
<img src="assets/pixelstash.gif" alt="PixelStash syncing a Steam library into a cover-art grid" width="720">

#### Miniature GP
Formula 1 races as 3D replays. Seasons 2024 to 2026, running order, pit stops and weather, from 1× to 100×. A GitHub Action imports every finished race overnight.
**[minigp.cc](https://minigp.cc)** · [repo](https://github.com/sergionoodles/miniature-gp)

<!-- 🎥 GIF: pick a Grand Prix → play at ~20× → drag to orbit around the circuit, ~10s -->
<img src="assets/miniature-gp.gif" alt="Miniature GP replaying a Formula 1 race in 3D" width="720">

#### Qwerio
A database workspace that feels like a file manager. PostgreSQL, SQLite and MySQL/MariaDB, Rust + GPUI, Linux and macOS. It also opens in the terminal, over SSH.
> Your databases. Your queries. That note explaining why the column is called `thing2`.

[repo](https://github.com/sergionoodles/qwerio)

<!-- 🎥 GIF: browse a table → follow a foreign key → same app with --tui in Ghostty over SSH, ~10s -->
<img src="assets/qwerio.gif" alt="Qwerio browsing a database and following a foreign key" width="720">

#### gpui-tui
Run any GPUI app inside kitty or Ghostty. Locally, or over SSH on a server with no GPU. The app's code stays the same.
[repo](https://github.com/sergionoodles/gpui-tui)

<!-- 🎥 GIF: ssh into a server from Ghostty → run the hello example → click and type so it's clearly live, ~10s -->
<img src="assets/gpui-tui.gif" alt="A GPUI app running inside Ghostty over SSH" width="720">

#### AppBento
One library for your AppImages: groups, search, updates from GitHub or GitLab Releases, and an optional Bubblewrap sandbox. If the sandbox fails, the app doesn't launch.
[repo](https://github.com/sergionoodles/appbento)

<!-- 🎥 GIF: import an AppImage → open Permissions → network off → launch sandboxed, ~10s -->
<img src="assets/appbento.gif" alt="AppBento library with per-app sandbox permissions" width="720">

#### FileSail
A Quickshell file manager for Noctalia on Niri, portable to Omarchy/Hyprland. Trash by default, previews, removable drives, and a CLI so agents can drive the live window.
[repo](https://github.com/sergionoodles/filesail)

<!-- 🎥 GIF: grid view → open the preview pane on an image → Noctalia slideout panel, ~10s -->
<img src="assets/filesail.gif" alt="FileSail browsing files with the preview pane open" width="720">

---

### ~❯ ls ~/projects --others

| Project | What it does |
|---|---|
| [nirisnap](https://github.com/sergionoodles/nirisnap) | Omasnap, shamelessly ported to Niri: capture, annotate, redact, OCR. |
| [skillshard](https://github.com/sergionoodles/skillshard) | One window for every AI coding-agent skill. Security audit before install, diff before update. |
| [cut-the-noise](https://github.com/sergionoodles/cut-the-noise) | Local browser extension that calms X, Amazon and Google. Nothing leaves the browser. |
| [jackcast](https://github.com/sergionoodles/jackcast) | Weather PWA. Forecasts are never accurate, but at least we made them look great. |
| [token-cafe](https://github.com/sergionoodles/token-cafe) | Noctalia bar meters for AI subscription usage: Codex, Claude Code, OpenCode, OpenRouter and more. |
| [sddm-noodle-terminal](https://github.com/sergionoodles/sddm-noodle-terminal) | Terminal-style SDDM login screen with an animated boot log. |

---

### ~❯ cat ~/stack

```text
apps    rust · gpui · tauri · c++/qt 6 · qml/quickshell
web     typescript · react · three.js · vite · tailwind · cloudflare workers
linux   niri · noctalia · omarchy/hyprland · wayland
```
<!-- [check] mobile: no native mobile repo is public right now (JackCast is an installable PWA). Add a "mobile" line only with the real stack. -->

<!--
OPTIONAL section below. It's filled in automatically by .github/workflows/update-readme.yml
(jamesgeorge007/github-activity-readme): releases, issues, PRs and comments, not plain pushes.
If you don't add the workflow, delete everything from the heading down.
-->
### ~❯ tail ~/activity

<!--START_SECTION:activity-->
<!--END_SECTION:activity-->
