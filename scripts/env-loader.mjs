import { existsSync, readFileSync } from "node:fs";

export function loadLocalEnv(filePath = ".env.local") {
  if (!existsSync(filePath)) return { loaded: false, keys: [] };

  const loadedKeys = [];
  const text = readFileSync(filePath, "utf8");

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!key || process.env[key]) continue;

    process.env[key] = value;
    loadedKeys.push(key);
  }

  return { loaded: true, keys: loadedKeys };
}
