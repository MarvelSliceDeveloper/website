"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

type UnreadCounts = Record<string, number>;

async function safeGet<T>(url: string): Promise<T | null> {
  try {
    return await api.get<T>(url);
  } catch {
    return null;
  }
}

export function useUnreadCounts(pollIntervalMs = 120000): UnreadCounts {
  const [counts, setCounts] = useState<UnreadCounts>({});

  const fetchCounts = useCallback(async () => {
    const [notifData, msgData, mentorshipStats, supportStats] =
      await Promise.all([
        safeGet<{ unreadCount: number }>("/api/notifications"),
        safeGet<{ unreadCount: number }>("/api/messages/conversations"),
        safeGet<{ stats: { open: number } }>(
          "/api/tickets/stats?type=MENTORSHIP",
        ),
        safeGet<{ stats: { open: number } }>("/api/tickets/stats?type=SUPPORT"),
      ]);

    const notifications = notifData?.unreadCount ?? 0;
    const messages = msgData?.unreadCount ?? 0;
    const mentorshipPending = mentorshipStats?.stats?.open ?? 0;
    const supportOpen = supportStats?.stats?.open ?? 0;

    setCounts({
      notifications,
      messages,
      tickets: mentorshipPending,
      mentorship_pending: mentorshipPending,
      mentorship: mentorshipPending,
      support: supportOpen,
      inbox: notifications + messages + mentorshipPending,
    });
  }, []);

  useEffect(() => {
    fetchCounts();
    const id = setInterval(fetchCounts, pollIntervalMs);
    return () => clearInterval(id);
  }, [fetchCounts, pollIntervalMs]);

  return counts;
}
