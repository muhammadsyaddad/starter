# apps/built

Electron desktop build of [`apps/dashboard`](../dashboard). The dashboard needs a live Next server (server
actions, pandoc, SSE, MCP, `proxy.ts`, rewrites), so it can't be a static export. Instead:

1. `scripts/prepare-server.mjs` builds the dashboard with `BUILD_STANDALONE=1` (Next `output: "standalone"`) and
   copies the self-contained server into `server/` (symlinks from bun's isolated linker dereferenced).
2. `src/main.ts` forks `server/apps/dashboard/server.js` with Electron's own Node (`utilityProcess`) on
   `127.0.0.1:3001` (free port if taken), waits until it answers, and opens a window on it.
3. `electron-builder` ships `server/` as an extra resource next to the app's asar.

## Commands

From the repo root:

| Command              | Output                                                           |
| -------------------- | ---------------------------------------------------------------- |
| `bun run dist:linux` | `apps/built/release/pelintir-<v>-x86_64.AppImage` and `.deb`     |
| `bun run dist:win`   | `apps/built/release/Pelintir Setup <v>.exe` (run on Windows)     |
| `bun run dev:desktop`| Electron window on a running `bun run dev:dashboard` (port 3001) |

Inside `apps/built`: `bun run prepare-server` (server bundle only), `bun run start` (Electron on the prepared
bundle, unpackaged), `bun run check-types`.

## Build-time config

Rewrite targets and `NEXT_PUBLIC_*` are baked in when the dashboard builds. Set them in
`apps/dashboard/.env.production` (or the shell) before `dist:*`:

- `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8080/api`)
- `NEXT_PUBLIC_TELEMETRY_API_URL` (default `https://tel-api.ramus.asia`)
- `NEXT_PUBLIC_USE_MOCK_DATA`, `NEXT_PUBLIC_API_TIMEOUT`, `NEXT_PUBLIC_TELEMETRY_API_TIMEOUT`

## Runtime

- Docs, templates and PDFs live in `<userData>/data` (`~/.config/Pelintir/data` on Linux,
  `%APPDATA%\Pelintir\data` on Windows), passed to the server as `DATA_DIR`. First run seeds `templates/` from
  `apps/dashboard/data/templates` if it existed at build time.
- Server log: `~/.config/Pelintir/logs/server.log` (Linux), `%APPDATA%\Pelintir\logs` (Windows).
- MCP: `.mcp.json` points at `http://localhost:3001/api/mcp`. Works while the app holds 3001; if `next dev` is
  already running there, the app falls back to a random port (and login state, kept per origin, won't carry over).
- PDF export needs `pandoc` and `pdflatex` (or the engine in `PDF_ENGINE`) on `PATH`. Not bundled.

## Gotchas

- **Windows installer: build on Windows** (or a `windows-latest` CI runner). The standalone trace copies
  platform-specific binaries (e.g. `sharp`/`@img/*`) for the OS it runs on, so a Linux-built bundle won't run on
  Windows.
- **Electron binary on Node ≥ 26**: electron's postinstall (`extract-zip`) stops after the first file, leaving
  `dist/` with only `locales/` and `Electron failed to install correctly`. Unzip the cached download by hand:

  ```sh
  cd node_modules/.bun/electron@*/node_modules/electron
  unzip -oq ~/.cache/electron/*/electron-v$(node -p "require('./package.json').version")-linux-x64.zip -d dist
  printf electron > path.txt
  ```
