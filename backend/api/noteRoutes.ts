import { Router } from 'express';
import { createNote, getNotes, deleteNote } from '../src/controllers/noteController';
import { protect } from '../src/middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get('/', getNotes);
router.post('/', createNote);
router.delete('/:id', deleteNote);

module.exports = router;
