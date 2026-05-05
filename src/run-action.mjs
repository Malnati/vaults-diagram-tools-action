#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const actionPath = process.env.ACTION_PATH || path.resolve(__dirname, "..");
const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
const executionCwd = process.env.RUNNER_TEMP || os.tmpdir();

function input(name, fallback = "") {
  const value = process.env[`INPUT_${name}`];
  return value === undefined || value === null || value === "" ? fallback : value;
}

function fail(message) {
  console.error(`::error::${message}`);
  process.exit(1);
}

function shellQuote(value) {
  const text = String(value);
  if (/^[A-Za-z0-9_@%+=:,./-]+$/.test(text)) return text;
  return `'${text.replace(/'/g, `'"'"'`)}'`;
}

function resolveInWorkspace(value) {
  if (!value) return "";
  return path.isAbsolute(value) ? value : path.resolve(workspace, value);
}

function readDefaultVersion() {
  const versionFile = path.join(actionPath, "VERSION");
  if (!fs.existsSync(versionFile)) return "latest";
  const value = fs.readFileSync(versionFile, "utf8").trim();
  return value || "latest";
}

function resolvePackageVersion(raw) {
  const requested = (raw || "auto").trim();
  if (requested && requested !== "auto") return requested;
  const ref = (process.env.ACTION_REF || "").trim();
  const match = ref.match(/^v?(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)$/);
  return match ? match[1] : readDefaultVersion();
}

function parseExtraArgs(raw) {
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

function setOutput(name, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (!outputFile) return;
  const delimiter = `vdt_${name}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  fs.appendFileSync(outputFile, `${name}<<${delimiter}\n${value || ""}\n${delimiter}\n`, "utf8");
}

function defaultManifest(mode, outputDir) {
  if (mode === "render") return path.join(outputDir, "render-manifest.json");
  if (mode === "source") return path.join(outputDir, "manifest.json");
  return "";
}

const mode = input("MODE", "render").trim().toLowerCase();
const packageVersion = resolvePackageVersion(input("PACKAGE_VERSION", "auto"));
const outputDir = resolveInWorkspace(input("OUTPUT_DIR", "vaults-diagram-tools-output"));
const explicitManifest = input("MANIFEST", "").trim();
const manifest = explicitManifest ? resolveInWorkspace(explicitManifest) : defaultManifest(mode, outputDir);
const extraArgs = parseExtraArgs(input("ARGS", ""));

let bin;
let cliArgs;

if (mode === "render") {
  const source = input("INPUT", "").trim();
  if (!source) fail("render mode requires input.");
  bin = "vaults-mermaid-render";
  cliArgs = ["--output-dir", outputDir, "--manifest", manifest, ...extraArgs, resolveInWorkspace(source)];
} else if (mode === "source") {
  const sourceDir = input("SOURCE_DIR", "").trim();
  if (!sourceDir) fail("source mode requires source-dir.");
  bin = "vaults-source-diagrams";
  cliArgs = ["--source-dir", resolveInWorkspace(sourceDir), "--output-dir", outputDir, "--manifest", manifest, ...extraArgs];
} else if (mode === "policy") {
  const target = input("INPUT", "").trim();
  if (!target) fail("policy mode requires input.");
  bin = "vaults-markdown-diagram-policy";
  cliArgs = [resolveInWorkspace(target), ...extraArgs.map((arg) => (arg.startsWith("-") ? arg : resolveInWorkspace(arg)))];
} else {
  fail(`Unsupported mode: ${mode}. Use render, source, or policy.`);
}

const npmBin = process.platform === "win32" ? "npm.cmd" : "npm";
const npmArgs = ["exec", "--yes", "--package", `vaults-diagram-tools@${packageVersion}`, "--", bin, ...cliArgs];
const command = [npmBin, ...npmArgs].map(shellQuote).join(" ");

console.log(`vaults-diagram-tools action mode: ${mode}`);
console.log(`vaults-diagram-tools package: ${packageVersion}`);
console.log(`Command: ${command}`);
console.log(`Execution cwd: ${executionCwd}`);

setOutput("output-dir", mode === "policy" ? "" : outputDir);
setOutput("manifest", manifest || "");
setOutput("command", command);

const result = spawnSync(npmBin, npmArgs, {
  cwd: executionCwd,
  env: process.env,
  stdio: "inherit",
});

if (result.error) fail(result.error.message);
process.exit(result.status ?? 1);
