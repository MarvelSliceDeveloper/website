import { Router } from "express";
import { webhookController } from "./webhook.controller";

const router = Router();

// POST /api/webhooks/calendar — Microsoft Graph webhook notification endpoint
// This endpoint must NOT require authentication (Microsoft sends notifications here)
router.post("/calendar", webhookController.handleCalendarWebhook);

export const webhookRouter = router;
