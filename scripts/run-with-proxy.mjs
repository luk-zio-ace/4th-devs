import { spawn } from "node:child_process";
import path from "node:path";

const [, , entry, ...rest] = process.argv;

if (!entry) {
  console.error("Usage: node scripts/run-with-proxy.mjs <entry> [...args]");
  process.exit(2);
}

const appHttpsProxy = process.env.APP_HTTPS_PROXY?.trim() || "";
const appHttpProxy = process.env.APP_HTTP_PROXY?.trim() || "";
const proxyUrl = appHttpsProxy || appHttpProxy;

if (proxyUrl) {
  // Ensure proxy env vars exist BEFORE Node starts in child process.
  process.env.HTTPS_PROXY ||= proxyUrl;
  process.env.HTTP_PROXY ||= proxyUrl;
  process.env.NODE_USE_ENV_PROXY = "1";

  const appNoProxy = process.env.APP_NO_PROXY?.trim() || "";
  if (appNoProxy) {
    process.env.NO_PROXY ||= appNoProxy;
  }
}

const child = spawn(
  process.execPath,
  ["--use-env-proxy", path.resolve(entry), ...rest],
  { stdio: "inherit", env: process.env }
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});

