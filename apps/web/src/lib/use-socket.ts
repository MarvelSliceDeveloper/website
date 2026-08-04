"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface RealtimeNotification {
  id?: string;
  title: string;
  message: string;
  type: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export function useSocket(
  onNotificationReceived?: (notification: RealtimeNotification) => void,
) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to backend socket
    const socket = io(API_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(
        "[socket] Connected to real-time notification gateway:",
        socket.id,
      );
    });

    socket.on("notification:new", (notification: RealtimeNotification) => {
      console.log("[socket] Received real-time notification:", notification);

      // Display dynamic toast alert based on notification type
      toast(notification.title || "New Notification", {
        description: notification.message,
        duration: 5000,
        action: notification.metadata?.joinUrl
          ? {
              label: "Join Session",
              onClick: () =>
                window.open(notification.metadata?.joinUrl as string, "_blank"),
            }
          : undefined,
      });

      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    socket.on("disconnect", () => {
      console.log("[socket] Disconnected from real-time gateway");
    });

    return () => {
      socket.disconnect();
    };
  }, [onNotificationReceived]);

  const joinBatch = (batchId: string) => {
    if (socketRef.current && batchId) {
      socketRef.current.emit("join:batch", batchId);
    }
  };

  return {
    socket: socketRef.current,
    joinBatch,
  };
}
