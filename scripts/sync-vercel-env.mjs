import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";

const [, , envFile = ".env.production", target = "production"] = process.argv;

function parseEnvFile(contents) {
  const entries = [];

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) {
      entries.push([key, value]);
    }
  }

  return entries;
}

function runVercel(args, input) {
  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["--yes", "vercel", ...args], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      const error = new Error(stderr.trim() || stdout.trim() || "Vercel failed");
      error.code = code;
      error.stdout = stdout;
      error.stderr = stderr;
      reject(error);
    });

    if (input != null) {
      child.stdin.write(input);
    }

    child.stdin.end();
  });
}

const envContents = await readFile(envFile, "utf8");
const entries = parseEnvFile(envContents);

if (entries.length === 0) {
  throw new Error(`No environment variables found in ${envFile}`);
}

for (const [key, value] of entries) {
  await runVercel(["env", "rm", key, target, "--yes"]).catch((error) => {
    const output = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;

    if (!output.includes("not found") && !output.includes("Environment Variable")) {
      throw error;
    }
  });

  await runVercel(["env", "add", key, target], `${value}\n`);
  console.log(`Synced ${key} to Vercel ${target}`);
}
