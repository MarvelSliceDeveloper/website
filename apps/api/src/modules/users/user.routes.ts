import { Router } from 'express';
import { prisma } from '../../utils/prisma';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { UserRole } from '@lms/types';

const router = Router();

router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN]));

// GET /api/users — list all users (admin only)
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });
    return res.json(users);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export const userRouter = router;
