import { Router } from 'express';
import {
  uploadAsset,
  uploadProfileImage,
  getAssetById,
  getPublicAssetById,
  deleteAsset,
  getBucketAssets,
} from '../src/controllers/assetController';
import { protect } from '../src/middleware/authMiddleware';

const router = Router();

// Public asset read
router.get('/public/:id', getPublicAssetById);

// All remaining asset routes require authentication
router.use(protect);

// Get bucket assets (unlinked to any project)
router.get('/bucket', getBucketAssets);

// Upload a new asset
router.post('/upload', uploadAsset);

// Upload profile image
router.post('/profile-image', uploadProfileImage);

// Get asset by ID
router.get('/:id', getAssetById);

// Delete asset
router.delete('/:id', deleteAsset);

module.exports = router; 