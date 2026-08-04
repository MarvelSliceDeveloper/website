import { prisma } from "../utils/prisma";

type AlertEvent = "health.failed" | "health.recovered" | "backup.failed" | "backup.completed";

export const alertingService = {
  async fire(event: AlertEvent, payload: Record<string, unknown>) {
    const webhooks = await prisma.notificationWebhook.findMany({
      where: { active: true },
    });

    const matching = webhooks.filter((w) => {
      const events = w.events as string[];
      return events.includes(event);
    });

    const body = {
      event,
      timestamp: new Date().toISOString(),
      ...payload,
      source: "lms-api",
    };

    const results = await Promise.allSettled(
      matching.map((w) =>
        fetch(w.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(10000),
        }).then(async () => {
          await prisma.notificationWebhook.update({
            where: { id: w.id },
            data: { lastFiredAt: new Date() },
          });
        }),
      ),
    );

    const failures = results.filter((r) => r.status === "rejected");
    if (failures.length > 0) {
      console.error(`[alerting] ${failures.length}/${matching.length} webhook(s) failed for event "${event}"`);
    }

    return { sent: matching.length, failed: failures.length };
  },
};
