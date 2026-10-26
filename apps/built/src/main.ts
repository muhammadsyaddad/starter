/*
 * Electron shell for apps/dashboard. The dashboard needs a live Next server (server actions,
 * pandoc, SSE, MCP), so we fork the bundled standalone server and point a window at it.
 */

import { app, BrowserWindow, dialog, shell, utilityProcess, type UtilityProcess } from "electron";
import { cpSync, createWriteStream, existsSync, mkdirSync } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const HOST = "127.0.0.1";
/** Same port as `next dev`, so .mcp.json and the login origin keep working. */
const PREFERRED_PORT = 3001;
const READY_TIMEOUT = 30_000;
/** Set to load a running `next dev` instead of the bundled server. */
const DEV_URL = process.env.ELECTRON_DEV_URL;

const here = fileURLToPath(new URL(".", import.meta.url));
const serverDir = app.isPackaged ? join(process.resourcesPath, "server") : join(here, "..", "server");

let server: UtilityProcess | undefined;
let win: BrowserWindow | undefined;
let quitting = false;

function fail(message: string) {
  void dialog.showMessageBox({ type: "error", title: "Pelintir", message }).finally(() => app.quit());
}

const portFree = (port: number) =>
  new Promise<number | undefined>((resolve) => {
    const s = createServer()
      .once("error", () => resolve(undefined))
      .listen(port, HOST, () => {
        const { port: got } = s.address() as { port: number };
        s.close(() => resolve(got));
      });
  });

const pickPort = async () => (await portFree(PREFERRED_PORT)) ?? (await portFree(0))!;

async function waitReady(url: string) {
  const end = Date.now() + READY_TIMEOUT;
  while (Date.now() < end) {
    if (!server) throw new Error("Dashboard server exited during startup.");
    if (await fetch(url, { redirect: "manual" }).then(() => true, () => false)) return;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Server did not answer at ${url} within ${READY_TIMEOUT / 1000}s.`);
}

/** Writable data dir; first run gets the bundled pandoc templates. */
function dataDir() {
  const dir = join(app.getPath("userData"), "data");
  const seed = join(serverDir, "seed-data", "templates");
  if (!existsSync(join(dir, "templates")) && existsSync(seed)) cpSync(seed, join(dir, "templates"), { recursive: true });
  mkdirSync(dir, { recursive: true });
  return dir;
}

async function startServer() {
  const entry = join(serverDir, "apps", "dashboard", "server.js");
  if (!existsSync(entry)) throw new Error(`Missing ${entry}. Run \`bun run prepare-server\` in apps/built.`);
  const port = await pickPort();

  const logs = app.getPath("logs");
  mkdirSync(logs, { recursive: true });
  const log = createWriteStream(join(logs, "server.log"), { flags: "a" });

  server = utilityProcess.fork(entry, [], {
    cwd: join(serverDir, "apps", "dashboard"),
    stdio: "pipe",
    serviceName: "dashboard-server",
    env: { ...process.env, NODE_ENV: "production", PORT: String(port), HOSTNAME: HOST, DATA_DIR: dataDir() },
  });
  server.stdout?.pipe(log);
  server.stderr?.pipe(log);
  let up = false;
  server.once("exit", (code) => {
    server = undefined;
    // Startup deaths surface through waitReady. Async box: a Ctrl+C hits the server first, and a modal
    // one would block the main's signal handler.
    if (up && !quitting) fail(`Dashboard server stopped (code ${code}). See ${join(logs, "server.log")}.`);
  });

  const url = `http://${HOST}:${port}`;
  await waitReady(url);
  up = true;
  return url;
}

function createWindow(url: string) {
  const origin = new URL(url).origin;
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false },
  });
  win.once("ready-to-show", () => win?.show());
  win.on("closed", () => (win = undefined));

  // Anything off the local server opens in the system browser.
  win.webContents.setWindowOpenHandler(({ url: target }) => {
    const local = new URL(target).origin === origin;
    if (!local) void shell.openExternal(target);
    return { action: local ? "allow" : "deny" };
  });
  win.webContents.on("will-navigate", (e, target) => {
    if (new URL(target).origin === origin) return;
    e.preventDefault();
    void shell.openExternal(target);
  });

  void win.loadURL(url);
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });

  app.on("before-quit", () => {
    quitting = true;
    server?.kill();
  });

  // Signals tear the server down before before-quit fires; don't report that as a crash.
  for (const sig of ["SIGINT", "SIGTERM"] as const) {
    process.on(sig, () => {
      quitting = true;
      app.quit();
    });
  }

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app
    .whenReady()
    .then(async () => {
      const url = DEV_URL ?? (await startServer());
      createWindow(url);
      app.on("activate", () => {
        if (!win) createWindow(url);
      });
    })
    .catch((e: Error) => {
      quitting = true;
      server?.kill();
      fail(`${e.message} See ${join(app.getPath("logs"), "server.log")}.`);
    });
}
