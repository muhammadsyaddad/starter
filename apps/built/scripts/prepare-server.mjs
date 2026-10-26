// Build apps/dashboard as a Next standalone server and copy it into apps/built/server.
// bun's isolated linker leaves symlinks in node_modules; dereference so the bundle is self-contained.

import { execSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../..", import.meta.url));
const dashboard = `${root}apps/dashboard`;
const out = fileURLToPath(new URL("../server", import.meta.url));
const copy = (from, to) => cpSync(from, to, { recursive: true, dereference: true });

execSync("bunx turbo run build --filter=dashboard", {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, BUILD_STANDALONE: "1" },
});

rmSync(out, { recursive: true, force: true });
copy(`${dashboard}/.next/standalone`, out);
// Standalone output leaves static assets to the host.
copy(`${dashboard}/.next/static`, `${out}/apps/dashboard/.next/static`);
if (existsSync(`${dashboard}/public`)) copy(`${dashboard}/public`, `${out}/apps/dashboard/public`);
if (existsSync(`${dashboard}/data/templates`)) copy(`${dashboard}/data/templates`, `${out}/seed-data/templates`);

if (!existsSync(`${out}/apps/dashboard/server.js`)) throw new Error("Standalone build produced no server.js");
console.log(`Server bundle ready: ${out}`);
