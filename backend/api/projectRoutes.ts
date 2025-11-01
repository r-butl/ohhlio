import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectUnified,
  updateProject,
  deleteProject,
} from '../src/controllers/projectController';
import { protect } from '../src/middleware/authMiddleware';

const router = Router();

// Unified auth-optional project fetch
router.get('/:id', getProjectUnified);

// Apply the protect middleware to the remaining routes
router.use(protect);

router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .put(updateProject)
  .delete(deleteProject);

module.exports = router;