import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import pino from 'pino';
import rateLimit from 'express-rate-limit';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

import { authRouter } from './modules/auth/auth.routes';

const app = express();

app.use(express.json());
app.use(cors());

// Mount Modular Routes
app.use('/api/auth', authRouter);

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
});
