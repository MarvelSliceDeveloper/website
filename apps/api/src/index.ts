import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// ↓ everything else stays the same ↓
// DEBUG: show which DATABASE_URL the server loaded (credentials masked)
// eslint-disable-next-line no-console
if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    const maskedAuth = url.username ? `${url.username}:*****@` : '';
    // eslint-disable-next-line no-console
    console.debug('[config] Using DATABASE_URL:', `${url.protocol}//${maskedAuth}${url.host}${url.pathname}`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.debug('[config] DATABASE_URL (raw):', process.env.DATABASE_URL?.slice(0, 80));
  }
} else {
  // eslint-disable-next-line no-console
  console.debug('[config] DATABASE_URL not set');
}
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import pino from 'pino';

import rateLimit from 'express-rate-limit';
import fs from 'fs';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

import cookieParser from 'cookie-parser';
import { authRouter } from './modules/auth/auth.routes';
import { calendarRouter } from './modules/calendar/calendar.routes';
import { webhookRouter } from './modules/calendar/webhook.routes';
import { sessionRouter } from './modules/sessions/session.routes';
import { recordingRouter } from './modules/recordings/recording.routes';
import { mentorshipRouter } from './modules/mentorship/mentorship.routes';
import { courseRouter } from './modules/courses/course.routes';
import { batchRouter } from './modules/batches/batch.routes';
import { studentBatchRouter } from './modules/batches/student-batch.routes';
import { userRouter } from './modules/users/user.routes';
import { certificateRouter } from './modules/certificates/certificate.routes';
import { studentRouter } from './modules/student/student.routes';
import { studentCourseRouter } from './modules/courses/student-course.routes';
import { eventsWebhookController } from './modules/sessions/events-webhook.controller';
import { notificationRouter } from './modules/notifications/notification.routes';
import { attendanceRouter } from './modules/attendance/attendance.routes';
import { recordingSyncJob } from './jobs/recording-sync.job';
import { enrollmentRouter } from './modules/enrollments/enrollment.routes';
import assignmentRoutes from './modules/assignments/assignments.routes';

const app = express();

const uploadsRoot = path.resolve(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsRoot, { recursive: true });

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.WEB_URL || 'http://localhost:3000',
  credentials: true
}));

app.use('/uploads', express.static(uploadsRoot));

// Mount Modular Routes
app.use('/api/auth', authRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/recordings', recordingRouter);
app.use('/api/mentorship', mentorshipRouter);
app.use('/api/admin/courses', courseRouter);
app.use('/api/admin/batches', batchRouter);
app.use('/api/batches', studentBatchRouter);
app.use('/api/users', userRouter);
app.use('/api/certificates', certificateRouter);
app.use('/api/student', studentRouter);
app.use('/api/courses', studentCourseRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/admin/enrollments', enrollmentRouter);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/webhooks', webhookRouter);

// Events webhook — for Teams-created meetings (no auth required)
app.post('/api/webhooks/events', eventsWebhookController.handleEventsWebhook);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  logger.info(`API Server running on port ${PORT}`);
  // Start the background Teams recording poller
  recordingSyncJob.start();
});
