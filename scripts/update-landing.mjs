#!/usr/bin/env node

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REMOTE = "marvel-slice";
const UPSTREAM_URL = "https://github.com/Lethinkj/marvel-slice.git";
const PREFIX = "apps/landing";
const TARGET = process.argv[2] ?? "master";

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: ROOT });
}

function runSilent(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, stdio: "pipe" }).toString().trim();
  } catch {
    return "";
  }
}

function hasRemote() {
  return Boolean(runSilent(`git remote get-url ${REMOTE}`));
}

function hasSubtree() {
  return Boolean(
    runSilent(`git ls-tree HEAD --name-only ${PREFIX}`),
  );
}

if (!existsSync(join(ROOT, ".git"))) {
  console.error("Must be run from the repository root.");
  process.exit(1);
}

if (runSilent("git rev-parse --is-inside-work-tree") !== "true") {
  console.error("Not inside a git work tree.");
  process.exit(1);
}

if (!hasRemote()) {
  console.log(`Adding missing remote '${REMOTE}' -> ${UPSTREAM_URL}`);
  run(`git remote add ${REMOTE} ${UPSTREAM_URL}`);
}

if (!hasSubtree()) {
  console.log(
    `No subtree at ${PREFIX} yet — bootstrapping from upstream instead of pulling.`,
  );
  run(`git subtree add --prefix ${PREFIX} ${REMOTE} ${TARGET} --squash`);
  console.log(`\nDone. Landing site bootstrapped at ${PREFIX}.`);
  process.exit(0);
}

run(`git fetch ${REMOTE}`);
run(`git subtree pull --prefix ${PREFIX} ${REMOTE} ${TARGET} --squash`);

console.log(`
Landing site updated from upstream (${REMOTE}/${TARGET}).

If git reported conflicts, resolve them, then commit the merge. Local changes
inside ${PREFIX} (e.g. the pnpm dev script) are intentional and may need to be
re-applied after resolving. Always install deps from the repo root with pnpm.
`);
