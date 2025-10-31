import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  getPublicProjectById,
  updateProject,
  deleteProject,
} from '../src/controllers/projectController';
import { protect } from '../src/middleware/authMiddleware';

const router = Router();

// Public route(s)
router.get('/public/:id', getPublicProjectById);

// Apply the protect middleware to the remaining routes
router.use(protect);

router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

module.exports = router;