#!/usr/bin/env node
// Seed / clean up the k6 load-test account pool.
//
//   node k6/seed-load-users.mjs --count=500
//   node k6/seed-load-users.mjs --count=5000 --batch-id=<id>   # real enrollments
//   node k6/seed-load-users.mjs --cleanup
//   node k6/seed-load-users.mjs --dry-run
//
// The pool is synthetic (k6-user-0001..N@loadtest.local) and every row it
// creates is removed again by --cleanup. Run it wherever DATABASE_URL is
// reachable — i.e. on the server, next to the API.
//
// Accounts are created through Prisma rather than POST /api/users because
// that route fires sendWelcomeEmail (user.routes.ts) — 5000 sign-up emails
// would be sent to nobody.

import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const HERE = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(HERE, "../.env") });
dotenv.config({ path: path.resolve(HERE, "../../../.env") });

const PREFIX = process.env.LOAD_USER_PREFIX || "k6-user";
const DOMAIN = process.env.LOAD_USER_DOMAIN || "loadtest.local";
const DEFAULT_PASSWORD = process.env.LOAD_USER_PASSWORD || "k6load1234";

const USAGE = `
Usage:
  node k6/seed-load-users.mjs [--count=N] [--password=P] [--batch-id=ID] [--course-id=ID] [--dry-run]
  node k6/seed-load-users.mjs --cleanup [--dry-run]

  --count      Number of accounts (default: TARGET_VUS, else LOAD_USER_COUNT, else 500)
  --password   Pool password (default: LOAD_USER_PASSWORD or "k6load1234")
  --batch-id   Enrol the pool in this batch (implies its course)
  --course-id  Enrol the pool in this course without a batch
  --cleanup    Delete the pool and every row that points at it
  --dry-run    Print what would happen without writing
`;

const emailWhere = { startsWith: `${PREFIX}-`, endsWith: `@${DOMAIN}` };

// Rows that reference a pool user. Order matters only for the two Restrict
// tables (loginLog, graphApiLog) — everything else has no onDelete action,
// which Prisma treats as blocking on delete.
//
// Deliberately NOT listed: batch / liveSession / batchCourseMentor /
// batchAssignmentExtension (instructorId, mentorId), announcement /
// staticPage / apiKey (createdBy), refund.approvedById,
// assignmentSubmission.gradedById, instructorProfile.verifiedById. The pool
// is STUDENT-only, so those are always empty — and if that ever stops being
// true we want the user delete to FAIL loudly rather than silently remove
// course structure.
const CHILD_TABLES = [
  { model: "loginLog", field: "userId" }, // onDelete: Restrict
  { model: "graphApiLog", field: "userId" }, // onDelete: Restrict
  { model: "adminSession", field: "userId" },
  { model: "consentLog", field: "userId" },
  { model: "twoFactorAuth", field: "userId" },
  { model: "instructorProfile", field: "userId" },
  { model: "notification", field: "userId" },
  { model: "notificationPreference", field: "userId" },
  { model: "sentNotification", field: "senderId" },
  { model: "message", field: "senderId" },
  { model: "message", field: "receiverId" },
  { model: "supportTicket", field: "userId" },
  { model: "supportMessage", field: "senderId" },
  { model: "note", field: "userId" },
  { model: "progress", field: "userId" },
  { model: "lessonProgress", field: "userId" },
  { model: "certificate", field: "userId" },
  { model: "quizAttempt", field: "userId" },
  { model: "attendance", field: "userId" },
  { model: "enrollmentRequest", field: "userId" },
  { model: "packageEnrollment", field: "userId" },
  { model: "courseEnrollment", field: "userId" },
  { model: "payment", field: "userId" },
  { model: "refund", field: "initiatedById" },
  { model: "referral", field: "referrerId" },
  { model: "auditLog", field: "userId" },
  { model: "mentorshipTicket", field: "studentId" },
  { model: "assignmentSubmission", field: "studentId" },
];

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function firstLine(err) {
  return err instanceof Error ? err.message.split("\n")[0] : String(err);
}

function requireDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set — run this from apps/api with a .env present, " +
        "or export DATABASE_URL.",
    );
  }
}

async function deletePool(prisma, { dryRun = false } = {}) {
  const users = await prisma.user.findMany({
    where: { email: emailWhere },
    select: { id: true, email: true },
  });
  if (users.length === 0) {
    console.log("No load-test users found — nothing to delete.");
    return { users: 0, rows: 0 };
  }

  const ids = users.map((u) => u.id);
  console.log(`Found ${users.length} load-test users.`);

  if (dryRun) {
    console.log(
      `[dry-run] would delete rows from ${CHILD_TABLES.length} child tables, ` +
        `then ${users.length} user rows.`,
    );
    return { users: users.length, rows: 0 };
  }

  let rows = 0;
  for (const { model, field } of CHILD_TABLES) {
    const delegate = prisma[model];
    if (!delegate || typeof delegate.deleteMany !== "function") {
      console.warn(`  skip ${model}: not in Prisma client`);
      continue;
    }
    let count = 0;
    let failed = false;
    for (const part of chunk(ids, 500)) {
      try {
        const res = await delegate.deleteMany({
          where: { [field]: { in: part } },
        });
        count += res.count;
      } catch (err) {
        console.warn(`  ! ${model}.${field}: ${firstLine(err)}`);
        failed = true;
        break;
      }
    }
    if (failed) continue;
    if (count) console.log(`  ${model}: ${count} rows`);
    rows += count;
  }

  const deleted = await prisma.user.deleteMany({ where: { email: emailWhere } });
  console.log(`Removed ${deleted.count} users and ${rows} related rows.`);
  return { users: deleted.count, rows };
}

export async function cleanupUsers({ dryRun = false } = {}) {
  requireDatabase();
  const prisma = new PrismaClient();
  try {
    return await deletePool(prisma, { dryRun });
  } finally {
    await prisma.$disconnect();
  }
}

export async function seedUsers({
  count,
  password = DEFAULT_PASSWORD,
  courseId = null,
  batchId = null,
  dryRun = false,
} = {}) {
  requireDatabase();

  const n = Number(count);
  if (!Number.isFinite(n) || n < 1 || !Number.isInteger(n)) {
    throw new Error(`Invalid --count: ${count}`);
  }

  const prisma = new PrismaClient();
  try {
    // Resolve batch -> course so enrollments match what the API creates.
    let resolvedCourseId = courseId;
    if (batchId) {
      const batch = await prisma.batch.findUnique({
        where: { id: batchId },
        select: { id: true, courseId: true },
      });
      if (!batch) throw new Error(`Batch ${batchId} not found`);
      if (!batch.courseId) throw new Error(`Batch ${batchId} has no courseId`);
      resolvedCourseId = batch.courseId;
    }
    if (resolvedCourseId) {
      const course = await prisma.course.findUnique({
        where: { id: resolvedCourseId },
        select: { id: true },
      });
      if (!course) throw new Error(`Course ${resolvedCourseId} not found`);
    }

    const pad = Math.max(4, String(n).length);
    const emails = Array.from(
      { length: n },
      (_, i) => `${PREFIX}-${String(i + 1).padStart(pad, "0")}@${DOMAIN}`,
    );

    console.log(
      `${dryRun ? "[dry-run] " : ""}Seeding ${n} users ` +
        `(${emails[0]} .. ${emails[n - 1]})` +
        `${resolvedCourseId ? ` enrolled in ${resolvedCourseId}` : ""}.`,
    );
    if (dryRun) return { count: n, created: 0, enrolled: 0 };

    // A leftover pool would keep its old hash and out-of-range emails would
    // survive — wipe it so the pool exactly matches this invocation.
    await deletePool(prisma);

    // One hash for the whole pool: bcrypt cost 12 x5000 in-line would take
    // minutes, and these accounts exist only for the duration of the test.
    const hash = await bcrypt.hash(password, 12);
    const data = emails.map((email) => ({
      name: `Load Test ${email.split("@")[0]}`,
      email,
      passwordHash: hash,
      role: "STUDENT",
    }));

    let created = 0;
    for (const part of chunk(data, 1000)) {
      const res = await prisma.user.createMany({
        data: part,
        skipDuplicates: true,
      });
      created += res.count;
    }
    console.log(`Created ${created} users.`);

    let enrolled = 0;
    if (resolvedCourseId) {
      const pool = await prisma.user.findMany({
        where: { email: emailWhere },
        select: { id: true },
      });
      const enrollments = pool.map((u) => ({
        userId: u.id,
        courseId: resolvedCourseId,
        batchId: batchId ?? null,
        status: "APPROVED",
        reviewedAt: new Date(),
      }));
      for (const part of chunk(enrollments, 1000)) {
        const res = await prisma.enrollmentRequest.createMany({
          data: part,
        });
        enrolled += res.count;
      }
      console.log(`Enrolled ${enrolled} users in ${resolvedCourseId}.`);
    }

    return { count: n, created, enrolled };
  } finally {
    await prisma.$disconnect();
  }
}

function parseArgs(argv) {
  const out = {
    count:
      process.env.TARGET_VUS || process.env.LOAD_USER_COUNT || "500",
    password: DEFAULT_PASSWORD,
    courseId: null,
    batchId: null,
    cleanup: false,
    dryRun: false,
    help: false,
  };
  for (const arg of argv) {
    if (arg === "--cleanup") out.cleanup = true;
    else if (arg === "--dry-run") out.dryRun = true;
    else if (arg === "--help" || arg === "-h") out.help = true;
    else if (arg.startsWith("--count=")) out.count = arg.slice("--count=".length);
    else if (arg.startsWith("--password="))
      out.password = arg.slice("--password=".length);
    else if (arg.startsWith("--course-id="))
      out.courseId = arg.slice("--course-id=".length);
    else if (arg.startsWith("--batch-id="))
      out.batchId = arg.slice("--batch-id=".length);
    else throw new Error(`Unknown argument: ${arg}\n${USAGE}`);
  }
  return out;
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(USAGE);
    process.exit(0);
  }
  try {
    if (args.cleanup) {
      await cleanupUsers({ dryRun: args.dryRun });
    } else {
      await seedUsers({
        count: args.count,
        password: args.password,
        courseId: args.courseId,
        batchId: args.batchId,
        dryRun: args.dryRun,
      });
    }
    process.exit(0);
  } catch (err) {
    console.error(`x ${firstLine(err)}`);
    process.exit(1);
  }
}
