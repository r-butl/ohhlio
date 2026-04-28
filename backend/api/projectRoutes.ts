import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectUnified,
  updateProject,
  deleteProject,
} from '../src/controllers/projectController';
import { linkAssetToProject, unlinkAssetFromProject } from '../src/controllers/assetController';
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

router.post('/:id/assets/:assetId', linkAssetToProject);
router.delete('/:id/assets/:assetId', unlinkAssetFromProject);

module.exports = router;