import { existsSync, readFileSync } from "node:fs";

const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const rootPackage = JSON.parse(readFileSync("package.json", "utf8"));
const npmrc = readFileSync(".npmrc", "utf8");
const workflowPath = ".github/workflows/deploy.yml";
const workflow = existsSync(workflowPath) ? readFileSync(workflowPath, "utf8") : "";
const packages = lock.packages || {};

const allowedInstallScripts = new Set(["esbuild", "fsevents", "sharp"]);
const blockedPackages = new Set([
  "@bitwarden/cli",
  "@sap/cds",
  "axios",
  "coa",
  "colors",
  "event-stream",
  "faker",
  "flatmap-stream",
  "intercom-client",
  "lightning",
  "node-ipc",
  "peacenotwar",
  "plain-crypto-js",
  "ua-parser-js"
]);
const blockedPackagePatterns = [/^@sap\//, /^@tanstack\//, /^@mistralai\//];

function packageNameFromPath(path) {
  const marker = "node_modules/";
  const index = path.lastIndexOf(marker);
  if (index === -1) return path;
  const remainder = path.slice(index + marker.length);
  const parts = remainder.split("/");
  return parts[0].startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
}

function isExactVersion(version) {
  return typeof version === "string" && /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version);
}

const issues = [];
const installScripts = [];

if (!npmrc.includes("ignore-scripts=true")) {
  issues.push(".npmrc must keep ignore-scripts=true");
}

for (const match of workflow.matchAll(/uses:\s+([^@\s]+)@([^\s#]+)/g)) {
  const [, action, ref] = match;
  if (!/^[a-f0-9]{40}$/i.test(ref)) {
    issues.push(`${workflowPath} uses ${action}@${ref}; pin GitHub Actions to a full commit SHA`);
  }
}

for (const dependencyType of ["dependencies", "devDependencies", "optionalDependencies"]) {
  for (const [name, version] of Object.entries(rootPackage[dependencyType] || {})) {
    if (!isExactVersion(version)) {
      issues.push(`${dependencyType}.${name} is not pinned exactly: ${version}`);
    }
  }
}

for (const [path, meta] of Object.entries(packages)) {
  if (!path) continue;

  const name = meta.name || packageNameFromPath(path);

  if (meta.resolved && !meta.resolved.startsWith("https://registry.npmjs.org/")) {
    issues.push(`${name} resolves outside the npm registry: ${meta.resolved}`);
  }

  if (meta.resolved && !meta.integrity) {
    issues.push(`${name} is missing lockfile integrity metadata`);
  }

  if (meta.hasInstallScript) {
    installScripts.push(name);
    if (!allowedInstallScripts.has(name)) {
      issues.push(`${name} has an unexpected install script`);
    }
  }

  if (blockedPackages.has(name) || blockedPackagePatterns.some((pattern) => pattern.test(name))) {
    issues.push(`${name} is blocked by the site dependency policy`);
  }
}

const summary = {
  checkedPackages: Object.keys(packages).length,
  allowedInstallScripts: installScripts.sort(),
  issues
};

console.log(JSON.stringify(summary, null, 2));

if (issues.length > 0) {
  process.exitCode = 1;
}
