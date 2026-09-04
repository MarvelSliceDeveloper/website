#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REMOTE = "marvel-slice";
const UPSTREAM_URL = "https://github.com/Lethinkj/marvel-slice.git";
const PREFIX = "apps/landing";

// ── CLI args ────────────────────────────────────────────────────────────────
const RAW_ARGS = process.argv.slice(2);
const HELP_FLAGS = new Set(["--help", "-h", "help"]);
const DRY_RUN = RAW_ARGS.includes("--dry-run");
const VERBOSE = RAW_ARGS.includes("--verbose") || RAW_ARGS.includes("-v");
const FORCE = RAW_ARGS.includes("--force") || RAW_ARGS.includes("-f");

// first non-flag arg is TARGET branch
const TARGET = RAW_ARGS.find((a) => !a.startsWith("-")) ?? "master";

// ── Colors (no deps) ───────────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

function log(msg) {
  console.log(msg);
}
function info(msg) {
  console.log(`${c.cyan}ℹ${c.reset} ${msg}`);
}
function ok(msg) {
  console.log(`${c.green}✔${c.reset} ${msg}`);
}
function warn(msg) {
  console.warn(`${c.yellow}⚠${c.reset} ${msg}`);
}
function fail(msg, hint) {
  console.error(`\n${c.red}${c.bold}✖ ERROR:${c.reset} ${c.red}${msg}${c.reset}`);
  if (hint) console.error(`${c.dim}  → ${hint}${c.reset}`);
  process.exit(1);
}

function printHelp() {
  // c is defined above, safe to use here at call time
  console.log(`
${c.bold}update-landing.mjs${c.reset} — sync apps/landing subtree from upstream

${c.bold}USAGE${c.reset}
  node scripts/update-landing.mjs [branch] [flags]
  pnpm update:landing [-- branch] [flags]

${c.bold}ARGS${c.reset}
  branch                    Upstream branch to pull (default: master)

${c.bold}FLAGS${c.reset}
  --dry-run                 Show what would run, don't execute git commands
  --force, -f               Skip dirty-worktree check (not recommended)
  --verbose, -v             Show full git stdout/stderr for every command
  --help, -h                Show this help

${c.bold}EXAMPLES${c.reset}
  node scripts/update-landing.mjs
  node scripts/update-landing.mjs main --dry-run
  node scripts/update-landing.mjs master --verbose

${c.bold}SAFETY CHECKS${c.reset}
  • must be run from repo root (where .git and package.json live)
  • blocks if git merge/rebase is in progress
  • blocks if working tree is dirty (unless --force)
  • verifies remote and target branch exist before fetching
`);
}

// ── Early flag handling (after c/fail/printHelp are defined) ───────────────
if (RAW_ARGS.some((a) => HELP_FLAGS.has(a))) {
  printHelp();
  process.exit(0);
}
if (RAW_ARGS.some((a) => a.startsWith("-") && !["--dry-run", "--verbose", "-v", "--force", "-f", "--help", "-h"].includes(a))) {
  const unknown = RAW_ARGS.filter((a) => a.startsWith("-") && !["--dry-run", "--verbose", "-v", "--force", "-f", "--help", "-h"].includes(a));
  fail(`Unknown flag(s): ${unknown.join(", ")}`, `Run: node scripts/update-landing.mjs --help`);
}

// ── Exec helpers — always capture exact error ──────────────────────────────
function runCapture(cmd) {
  if (VERBOSE) console.log(`${c.dim}$ ${cmd}${c.reset}`);
  try {
    const out = execSync(cmd, { cwd: ROOT, stdio: "pipe", encoding: "utf8" });
    const trimmed = out.trim();
    if (VERBOSE && trimmed) console.log(trimmed);
    return { ok: true, stdout: out, stderr: "", code: 0 };
  } catch (err) {
    const stdout = err.stdout?.toString?.() ?? "";
    const stderr = err.stderr?.toString?.() ?? "";
    const code = err.status ?? 1;
    const signal = err.signal ?? null;
    if (VERBOSE) {
      if (stdout.trim()) console.log(stdout.trim());
      if (stderr.trim()) console.error(stderr.trim());
    }
    return { ok: false, stdout, stderr, code, signal, message: err.message };
  }
}

function run(cmd, { hint } = {}) {
  console.log(`\n${c.dim}$ ${cmd}${c.reset}`);
  if (DRY_RUN) {
    console.log(`${c.yellow}[dry-run] skipped${c.reset}`);
    return;
  }
  const res = runCapture(cmd);
  if (res.ok) {
    if (res.stdout.trim()) console.log(res.stdout.trim());
    return;
  }

  // — exact error reporting —
  console.error(`\n${c.red}${c.bold}✖ Command failed:${c.reset} ${c.bold}${cmd}${c.reset}`);
  console.error(`${c.red}  Exit code: ${res.code}${c.reset}`);
  if (res.signal) console.error(`  Killed by signal: ${res.signal}`);
  if (res.stderr.trim()) {
    console.error(`\n  ${c.bold}stderr:${c.reset}\n${indent(res.stderr.trim())}`);
  }
  if (res.stdout.trim()) {
    console.error(`\n  ${c.bold}stdout:${c.reset}\n${indent(res.stdout.trim())}`);
  }
  if (!res.stderr.trim() && !res.stdout.trim() && res.message) {
    console.error(`  Reason: ${res.message}`);
  }
  if (hint) console.error(`\n  ${c.yellow}→ ${hint}${c.reset}`);
  // common hints
  if (cmd.includes("fetch")) {
    console.error(`\n  ${c.dim}Check: git remote -v | ping github.com | auth (PAT/SSH)${c.reset}`);
  }
  if (cmd.includes("subtree")) {
    const status = runCapture("git status --porcelain");
    if (status.stdout.trim()) {
      console.error(`\n  ${c.yellow}Working tree status:${c.reset}\n${indent(status.stdout.trim())}`);
    }
    console.error(`\n  ${c.dim}If conflicts: resolve files, then git add . && git commit${c.reset}`);
    console.error(`  ${c.dim}To abort subtree merge: git reset --hard HEAD && git clean -fd${c.reset}`);
  }
  process.exit(res.code ?? 1);
}

function indent(text) {
  return text
    .split("\n")
    .map((l) => `  │ ${l}`)
    .join("\n");
}

function hasRemote() {
  const r = runCapture(`git remote get-url ${REMOTE}`);
  return r.ok && Boolean(r.stdout.trim());
}

function getRemoteUrl() {
  const r = runCapture(`git remote get-url ${REMOTE}`);
  return r.ok ? r.stdout.trim() : "";
}

function hasSubtree() {
  const r = runCapture(`git ls-tree HEAD --name-only ${PREFIX}`);
  return r.ok && Boolean(r.stdout.trim());
}

function checkGitInstalled() {
  const r = runCapture("git --version");
  if (!r.ok) {
    fail("git is not installed or not in PATH.", "Install git: https://git-scm.com/downloads  then reopen terminal.");
  }
  if (VERBOSE) ok(`Found ${r.stdout.trim()}`);
}

function checkNoMergeInProgress() {
  const markers = [
    [join(ROOT, ".git", "MERGE_HEAD"), "merge"],
    [join(ROOT, ".git", "REBASE_HEAD"), "rebase"],
    [join(ROOT, ".git", "CHERRY_PICK_HEAD"), "cherry-pick"],
    [join(ROOT, ".git", "REVERT_HEAD"), "revert"],
  ];
  for (const [p, kind] of markers) {
    if (existsSync(p)) {
      fail(
        `A git ${kind} is already in progress (${p} exists).`,
        `Resolve it first: git status, then git ${kind} --continue or git ${kind} --abort / git merge --abort`,
      );
    }
  }
}

function checkWorkingTreeClean() {
  const r = runCapture("git status --porcelain");
  if (!r.ok) {
    warn(`Could not check working tree: ${r.stderr.trim() || r.message}`);
    return;
  }
  if (r.stdout.trim()) {
    const files = r.stdout.trim().split("\n").slice(0, 20).join("\n");
    const more = r.stdout.trim().split("\n").length > 20 ? `\n  ...and ${r.stdout.trim().split("\n").length - 20} more` : "";
    if (FORCE) {
      warn(`Working tree is dirty but --force given, continuing anyway:\n${indent(files + more)}`);
    } else {
      fail(
        `Working tree is dirty — commit or stash changes before updating landing.`,
        `Dirty files:\n${indent(files + more)}\n  → git stash push -m "before landing update"  or  git status to review\n  → re-run with --force to override (may cause conflicts)`,
      );
    }
  } else if (VERBOSE) {
    ok("Working tree is clean");
  }
}

function checkTargetExistsOnRemote() {
  // Use ls-remote to verify branch exists without fetching
  const r = runCapture(`git ls-remote --heads ${REMOTE} ${TARGET}`);
  if (!r.ok) {
    fail(
      `Could not check remote branch ${REMOTE}/${TARGET}.`,
      `stderr: ${r.stderr.trim() || r.stdout.trim() || r.message}\n  → Check: git remote -v  and  git ls-remote --heads ${REMOTE}`,
    );
  }
  if (!r.stdout.trim()) {
    // Try to list available heads to help user
    const list = runCapture(`git ls-remote --heads ${REMOTE}`);
    const branches = list.stdout
      .split("\n")
      .map((l) => l.split("refs/heads/")[1])
      .filter(Boolean)
      .slice(0, 15)
      .join(", ");
    fail(
      `Branch "${TARGET}" not found on remote "${REMOTE}".`,
      `Available branches: ${branches || "(could not list — check network/auth)"}\n  → Try: node scripts/update-landing.mjs master  or  git ls-remote --heads ${REMOTE}`,
    );
  }
  if (VERBOSE) ok(`Remote branch exists: ${REMOTE}/${TARGET}`);
}

// ── Safety checks (in order) ──────────────────────────────────────────────
checkGitInstalled();

if (!existsSync(join(ROOT, ".git"))) {
  fail("Must be run from the repository root.", `Current dir: ${ROOT}\n  → cd to repo root where .git lives, then re-run.`);
}
if (!existsSync(join(ROOT, "package.json"))) {
  warn(`No package.json at ${ROOT} — is this really the repo root?`);
}

const inside = runCapture("git rev-parse --is-inside-work-tree");
if (!inside.ok || inside.stdout.trim() !== "true") {
  fail("Not inside a git work tree.", `Output: ${inside.stdout.trim() || inside.stderr.trim() || inside.message}`);
}

checkNoMergeInProgress();
checkWorkingTreeClean();

if (!hasRemote()) {
  info(`Remote '${REMOTE}' not found — adding -> ${UPSTREAM_URL}`);
  run(`git remote add ${REMOTE} ${UPSTREAM_URL}`, {
    hint: `If this fails, check: git remote -v  and that ${UPSTREAM_URL} is reachable`,
  });
  ok(`Remote '${REMOTE}' added`);
} else {
  const url = getRemoteUrl();
  if (url !== UPSTREAM_URL) {
    warn(`Remote '${REMOTE}' URL mismatch:\n  current:  ${url}\n  expected: ${UPSTREAM_URL}\n  → If intentional, ignore. To fix: git remote set-url ${REMOTE} ${UPSTREAM_URL}`);
  } else if (VERBOSE) {
    ok(`Remote '${REMOTE}' -> ${url}`);
  }
}

if (!hasSubtree()) {
  info(`No subtree at ${PREFIX} yet — will bootstrap from upstream instead of pulling.`);
  if (DRY_RUN) {
    log(`\n[dry-run] would run: git subtree add --prefix ${PREFIX} ${REMOTE} ${TARGET} --squash`);
    process.exit(0);
  }
  checkTargetExistsOnRemote();
  run(`git subtree add --prefix ${PREFIX} ${REMOTE} ${TARGET} --squash`, {
    hint: `If this fails with "prefix already exists", check git ls-tree HEAD --name-only ${PREFIX}`,
  });
  ok(`Landing site bootstrapped at ${PREFIX} from ${REMOTE}/${TARGET}`);
  process.exit(0);
}

// ── Normal update path ────────────────────────────────────────────────────
info(`Updating ${PREFIX} from ${REMOTE}/${TARGET} ...`);

if (!DRY_RUN) checkTargetExistsOnRemote();

run(`git fetch ${REMOTE}`, {
  hint: `Fetch failed — check internet, git remote -v, and that ${UPSTREAM_URL} is accessible`,
});

run(`git subtree pull --prefix ${PREFIX} ${REMOTE} ${TARGET} --squash`, {
  hint: `Subtree pull failed — see stderr above. Common causes: conflicts or diverged history.`,
});

ok(`Landing site updated from upstream (${REMOTE}/${TARGET}).`);
log(`
${c.dim}Next steps:${c.reset}
  • If git reported ${c.bold}conflicts${c.reset}, resolve them then: ${c.cyan}git add . && git commit${c.reset}
  • To abort a failed merge: ${c.cyan}git reset --hard HEAD && git clean -fd${c.reset}
  • Local changes inside ${PREFIX} (e.g. pnpm dev script) may need re-applying after resolve
  • Always install deps from repo root: ${c.cyan}pnpm install${c.reset}
`);
if (DRY_RUN) log(`${c.yellow}[dry-run] no git state was changed${c.reset}`);