#!/usr/bin/env node
// Seed -> run k6 -> clean up, even when the test fails or you hit Ctrl+C.
//
//   node k6/run-scale.mjs                        # 500 users, default ladder
//   TARGET_VUS=5000 node k6/run-scale.mjs        # the 5000-user run
//   node k6/run-scale.mjs --count=5000           # pool size override
//   node k6/run-scale.mjs --keep-data            # skip the final cleanup
//   node k6/run-scale.mjs --skip-seed            # pool already exists
//   node k6/run-scale.mjs --skip-cleanup         # seed, run, leave the pool
//   node k6/run-scale.mjs -- --no-summary        # extra args go to k6
//
// Ctrl+C: SIGINT is forwarded to k6 (it ramps down) and the cleanup still
// runs before this process exits with 130.

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { seedUsers, cleanupUsers } from "./seed-load-users.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const K6_BIN = process.env.K6_BIN || "k6";

const USAGE = `
Usage:
  node k6/run-scale.mjs [--count=N] [--keep-data] [--skip-seed] [--skip-cleanup] [-- k6 args]

  --count=N       Pool size (default: TARGET_VUS, else LOAD_USER_COUNT, else 500)
  --keep-data     Do not delete the pool after the run
  --skip-seed     Do not seed before the run (pool must already exist)
  --skip-cleanup  Alias of --keep-data
  -- ...          Passed straight to "k6 run"
`;

function parse(argv) {
  const flags = {
    keepData: false,
    skipSeed: false,
    count: null,
  };
  const k6Args = [];
  let passthrough = false;

  for (const arg of argv) {
    if (passthrough) {
      k6Args.push(arg);
      continue;
    }
    if (arg === "--") {
      passthrough = true;
    } else if (arg === "--keep-data" || arg === "--skip-cleanup") {
      flags.keepData = true;
    } else if (arg === "--skip-seed") {
      flags.skipSeed = true;
    } else if (arg.startsWith("--count=")) {
      flags.count = Number(arg.slice("--count=".length));
    } else if (arg === "--help" || arg === "-h") {
      console.log(USAGE);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}\n${USAGE}`);
    }
  }
  return { flags, k6Args };
}

let interrupted = false;
let k6Child = null;

function forwardSignal() {
  if (interrupted) return;
  interrupted = true;
  console.log("\nInterrupted — stopping k6, then cleaning up...");
  if (k6Child) k6Child.kill("SIGINT");
}
process.on("SIGINT", forwardSignal);
process.on("SIGTERM", forwardSignal);

function runK6(extraArgs) {
  return new Promise((resolve) => {
    const args = ["run", path.join(HERE, "scale-5k.js"), ...extraArgs];
    console.log(`\n> ${K6_BIN} ${args.join(" ")}\n`);

    const child = spawn(K6_BIN, args, { stdio: "inherit", env: process.env });
    k6Child = child;

    child.on("error", (err) => {
      k6Child = null;
      console.error(
        `x cannot start "${K6_BIN}": ${err.message}\n` +
          `  Install k6 (https://k6.io/docs/get-started/installation/) ` +
          `or set K6_BIN to its path.`,
      );
      resolve(1);
    });
    child.on("exit", (code, signal) => {
      k6Child = null;
      resolve(signal ? 130 : (code ?? 1));
    });
  });
}

const { flags, k6Args } = parse(process.argv.slice(2));

const count = flags.count ??
  Number(process.env.TARGET_VUS || process.env.LOAD_USER_COUNT || 500);

if (!Number.isInteger(count) || count < 1) {
  console.error(`x invalid pool count: ${count}`);
  process.exit(1);
}

// scale-5k.js reads LOAD_USER_COUNT out of __ENV (k6 inherits the process
// environment), so setup() checks the pool against TARGET_VUS correctly.
process.env.LOAD_USER_COUNT = String(count);

let code = 1;

try {
  if (!flags.skipSeed) {
    await seedUsers({ count });
  } else {
    console.log(`--skip-seed: expecting an existing pool of ${count} users.`);
  }
  code = await runK6(k6Args);
} catch (err) {
  console.error(`x ${err instanceof Error ? err.message : String(err)}`);
  code = 1;
} finally {
  if (flags.keepData) {
    console.log(
      `Keeping the pool of ${count} users in the database ` +
        `(remove with: pnpm test:load:seed:cleanup).`,
    );
  } else {
    console.log("\nCleaning up the load-test pool...");
    try {
      await cleanupUsers();
    } catch (err) {
      console.error(
        `x cleanup failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      if (code === 0) code = 1;
    }
  }
}

process.exit(interrupted ? 130 : code);
