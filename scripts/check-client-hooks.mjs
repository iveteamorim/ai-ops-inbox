import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("src");
const EXCLUDED_SEGMENTS = new Set(["api", "lib"]);
const CLIENT_HOOK_PATTERNS = [
  /\buseI18n\s*\(/,
  /\buseRouter\s*\(/,
  /\busePathname\s*\(/,
  /\buseSearchParams\s*\(/,
  /\buseState\s*\(/,
  /\buseReducer\s*\(/,
  /\buseEffect\s*\(/,
  /\buseLayoutEffect\s*\(/,
  /\buseTransition\s*\(/,
  /\buseContext\s*\(/,
  /\buseRef\s*\(/,
  /\buseOptimistic\s*\(/,
  /\buseFormStatus\s*\(/,
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }
    if (!/\.(tsx|ts|jsx|js)$/.test(entry.name)) continue;
    files.push(fullPath);
  }

  return files;
}

function isExcluded(filePath) {
  const relative = path.relative(ROOT, filePath);
  const segments = relative.split(path.sep);
  return segments.some((segment) => EXCLUDED_SEGMENTS.has(segment));
}

function usesClientHooks(source) {
  return CLIENT_HOOK_PATTERNS.some((pattern) => pattern.test(source));
}

function hasUseClientDirective(source) {
  const sanitized = source.replace(/^\uFEFF/, "").trimStart();
  return sanitized.startsWith('"use client";') || sanitized.startsWith("'use client';");
}

async function main() {
  const files = await walk(ROOT);
  const offenders = [];

  for (const file of files) {
    if (isExcluded(file)) continue;
    const source = await readFile(file, "utf8");
    if (!usesClientHooks(source)) continue;
    if (hasUseClientDirective(source)) continue;
    offenders.push(path.relative(process.cwd(), file));
  }

  if (offenders.length > 0) {
    console.error("Client hook files missing \"use client\":");
    for (const file of offenders) {
      console.error(`- ${file}`);
    }
    process.exit(1);
  }

  console.log("ok check:client-hooks");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
