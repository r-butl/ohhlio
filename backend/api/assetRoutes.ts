import { Router } from 'express';
import {
  uploadAsset,
  uploadProfileImage,
  getAssetById,
  getPublicAssetById,
  deleteAsset,
} from '../src/controllers/assetController';
import { protect } from '../src/middleware/authMiddleware';

const router = Router();

// Public asset read
router.get('/public/:id', getPublicAssetById);

// All remaining asset routes require authentication
router.use(protect);

// Upload a new asset
router.post('/upload', uploadAsset);

// Upload profile image
router.post('/profile-image', uploadProfileImage);

// Get asset by ID
router.get('/:id', getAssetById);

// Delete asset
router.delete('/:id', deleteAsset);

module.exports = router; 