import { Router } from 'express';
import {
  uploadAsset,
  getAssetById,
  deleteAsset,
} from '../src/controllers/assetController';
import { protect } from '../src/middleware/authMiddleware';

const router = Router();

// All asset routes require authentication
router.use(protect);

// Upload a new asset
router.post('/upload', uploadAsset);

// Get asset by ID
router.get('/:id', getAssetById);

// Delete asset
router.delete('/:id', deleteAsset);

module.exports = router; 