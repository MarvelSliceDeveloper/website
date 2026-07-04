import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import {
  syncCalendarForUser,
  getEventsForUser,
  getTodayEvents,
  getLiveSessions,
} from "./calendar.service";

export const calendarController = {
  /**
   * GET /api/calendar/events?start=...&end=...
   * Fetch calendar events from the local DB for a date range.
   */
  async getEvents(req: AuthRequest, res: Response) {
    try {
      const { start, end } = req.query;

      const now = new Date();
      const defaultStart = new Date(
        now.getTime() - 90 * 24 * 60 * 60 * 1000,
      ).toISOString(); // 90 days ago
      const defaultEnd = new Date(
        now.getTime() + 180 * 24 * 60 * 60 * 1000,
      ).toISOString(); // 180 days from now

      const startDate = (start as string) || defaultStart;
      const endDate = (end as string) || defaultEnd;

      const events = await getEventsForUser(startDate, endDate);
      return res.status(200).json({ events });
    } catch (error: any) {
      console.error("Error fetching calendar events:", error.message);
      return res.status(500).json({ error: "Failed to fetch calendar events" });
    }
  },

  /**
   * GET /api/calendar/events/today
   * Fetch today's events with live status.
   */
  async getTodayEvents(req: AuthRequest, res: Response) {
    try {
      const events = await getTodayEvents();
      return res.status(200).json({ events });
    } catch (error: any) {
      console.error("Error fetching today events:", error.message);
      return res.status(500).json({ error: "Failed to fetch today's events" });
    }
  },

  /**
   * GET /api/calendar/live
   * Fetch currently active sessions only.
   */
  async getLiveSessions(req: AuthRequest, res: Response) {
    try {
      const sessions = await getLiveSessions();
      return res.status(200).json({ sessions });
    } catch (error: any) {
      console.error("Error fetching live sessions:", error.message);
      return res.status(500).json({ error: "Failed to fetch live sessions" });
    }
  },

  /**
   * POST /api/calendar/sync
   * Manually trigger a calendar sync for the authenticated user.
   * Requires the user to have a linked Microsoft account.
   */
  async syncCalendar(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Default: sync the next 30 days
      const now = new Date();
      const thirtyDaysLater = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000,
      );

      const startDate = req.body.startDate || now.toISOString();
      const endDate = req.body.endDate || thirtyDaysLater.toISOString();

      const result = await syncCalendarForUser(
        req.user.userId,
        startDate,
        endDate,
      );
      return res.status(200).json({
        message: "Calendar sync completed",
        ...result,
      });
    } catch (error: any) {
      console.error("Error syncing calendar:", error.message);
      if (error.message.includes("Microsoft account not linked")) {
        return res.status(400).json({
          error:
            "Microsoft account not linked. Please connect your Microsoft account first.",
        });
      }
      return res.status(500).json({ error: "Failed to sync calendar" });
    }
  },
};
