import { Router } from 'express';
import { calendarController } from './calendar.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

// All calendar routes require authentication
router.use(requireAuth);

// GET /api/calendar/events?start=...&end=...
router.get('/events', calendarController.getEvents);

// GET /api/calendar/events/today
router.get('/events/today', calendarController.getTodayEvents);

// GET /api/calendar/live
router.get('/live', calendarController.getLiveSessions);

// POST /api/calendar/sync — manually trigger sync
router.post('/sync', calendarController.syncCalendar);

export const calendarRouter = router;
