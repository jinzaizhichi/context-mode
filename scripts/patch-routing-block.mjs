#!/usr/bin/env node
// Apply condensed routing-block patch to installed context-mode plugin.
// Usage: node ~/context-mode/scripts/patch-routing-block.mjs
// After context-mode upgrades, run this to re-apply the condensed version.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

// Source: our fork's condensed version
const srcPath = resolve(repoRoot, "hooks", "routing-block.mjs");
if (!existsSync(srcPath)) {
  console.error("ERROR: routing-block.mjs not found in repo. Run from context-mode repo root.");
  process.exit(1);
}
const src = readFileSync(srcPath, "utf-8");

// Target: installed plugin cache
const pluginCacheDir = resolve(homedir(), ".claude", "plugins", "cache", "context-mode", "context-mode");
if (!existsSync(pluginCacheDir)) {
  console.error("ERROR: context-mode plugin cache not found.");
  process.exit(1);
}

// Find latest version dir
const { readdirSync, statSync } = await import("node:fs");
const versionDirs = readdirSync(pluginCacheDir)
  .filter(d => /^\d+\.\d+\.\d+$/.test(d))
  .sort((a, b) => {
    const [a1, a2, a3] = a.split(".").map(Number);
    const [b1, b2, b3] = b.split(".").map(Number);
    return (b1 - a1) || (b2 - a2) || (b3 - a3);
  });

if (versionDirs.length === 0) {
  console.error("ERROR: no version dirs found in plugin cache.");
  process.exit(1);
}

const latestDir = resolve(pluginCacheDir, versionDirs[0]);
const targetPath = resolve(latestDir, "hooks", "routing-block.mjs");

if (!existsSync(targetPath)) {
  console.error(`ERROR: ${targetPath} not found.`);
  process.exit(1);
}

// Backup original
const original = readFileSync(targetPath, "utf-8");
const backupPath = targetPath + ".bak";
writeFileSync(backupPath, original, "utf-8");

// Apply our version
writeFileSync(targetPath, src, "utf-8");
console.log(`Patched: ${targetPath}`);
console.log(`Backup: ${backupPath}`);
console.log(`Version: ${versionDirs[0]}`);
