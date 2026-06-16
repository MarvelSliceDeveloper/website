import { Router } from 'express';
import { authController } from './auth.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// GET /api/auth/me — return current authenticated user
router.get('/me', requireAuth, authController.me);

// --- Microsoft Azure AD OAuth ---
router.get('/azure-ad/status', requireAuth, authController.azureAdStatus);
router.get('/azure-ad/login', requireAuth, authController.azureAdLogin);
router.get('/azure-ad/callback', authController.azureAdCallback);

export const authRouter = router;
