import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { notesController } from './notes.controller';

const router = Router();

router.use(requireAuth);

router.get('/', notesController.list);
router.get('/:id', notesController.get);
router.post('/', notesController.create);
router.patch('/:id', notesController.update);
router.delete('/:id', notesController.delete);

export const noteRouter = router;
