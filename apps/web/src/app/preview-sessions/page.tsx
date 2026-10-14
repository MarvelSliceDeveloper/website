"use client";

import StudentPortalShell from "@/components/StudentPortalShell";
import LiveSessionsView from "@/app/student/_views/LiveSessionsView";
import type { LiveSession } from "@/lib/api-types";

// Dev-only preview — renders LiveSessionsView with mock data.
// No login, no DB, no API needed (API is only hit on Join click).
// Delete this folder before shipping if you don't need it.
const now = Date.now();
const iso = (ms: number) => new Date(ms).toISOString();

const MOCK_SESSIONS: LiveSession[] = [
  {
    id: "preview-live-1",
    title: "React Hooks Deep Dive — Live Class",
    courseTitle: "Full Stack Web Development",
    instructor: "Priya Sharma",
    batchLabel: "Batch A · Morning",
    status: "LIVE",
    scheduledAt: iso(now - 10 * 60_000),
    endDateTime: iso(now + 50 * 60_000),
    joinUrl: "https://teams.microsoft.com/l/meetup-join/preview",
  },
  {
    id: "preview-upcoming-1",
    title: "Node.js REST APIs — Live Class",
    courseTitle: "Full Stack Web Development",
    instructor: "Rahul Verma",
    batchLabel: "Batch A · Morning",
    status: "UPCOMING",
    scheduledAt: iso(now + 2 * 60 * 60_000),
    endDateTime: iso(now + 3 * 60 * 60_000),
    joinUrl: "https://teams.microsoft.com/l/meetup-join/preview",
  },
  {
    id: "preview-upcoming-2",
    title: "Data Structures: Trees & Graphs",
    courseTitle: "DSA Bootcamp",
    instructor: "Anita Desai",
    batchLabel: "Batch B · Evening",
    status: "UPCOMING",
    scheduledAt: iso(now + 26 * 60 * 60_000),
    endDateTime: iso(now + 27 * 60 * 60_000),
    joinUrl: "https://teams.microsoft.com/l/meetup-join/preview",
  },
  {
    id: "preview-past-1",
    title: "HTML & CSS Foundations — Live Class",
    courseTitle: "Full Stack Web Development",
    instructor: "Priya Sharma",
    batchLabel: "Batch A · Morning",
    status: "PAST",
    scheduledAt: iso(now - 26 * 60 * 60_000),
    endDateTime: iso(now - 25 * 60 * 60_000),
    recordingSyncingIn: "~20 min",
  },
];

export default function PreviewSessionsPage() {
  return (
    <StudentPortalShell breadcrumbs={[{ label: "Preview Sessions" }]}>
      <p className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2 text-xs font-medium text-warning">
        Preview mode — mock data, no login or database needed.
      </p>
      <LiveSessionsView sessions={MOCK_SESSIONS} />
    </StudentPortalShell>
  );
}
