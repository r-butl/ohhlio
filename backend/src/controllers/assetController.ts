import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
const prisma = require('../models/db');
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { upload, uploadFileToS3, deleteFileFromS3 } from '../services/s3Service';

// Upload a single file
export const uploadAsset = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  upload.single('file')(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      res.status(400).json({ message: err.message });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    try {
      const { projectId } = req.body;

      // Generate unique S3 key
      const key = `users/${userId}/${uuidv4()}-${req.file.originalname}`;
      
      // Upload to S3
      const s3Url = await uploadFileToS3(req.file, key);
      
      // Determine asset type based on MIME type
      const getAssetType = (mimeType: string): string => {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        if (mimeType.startsWith('application/pdf') || mimeType.startsWith('text/') || mimeType.includes('word')) return 'document';
        if (mimeType.includes('zip') || mimeType.includes('rar')) return 'archive';
        return 'other';
      };

      const asset = await prisma.asset.create({
        data: {
          filename: req.file.originalname,
          filePath: s3Url, // Store S3 URL instead of local path
          mimeType: req.file.mimetype,
          fileSize: req.file.size,
          type: getAssetType(req.file.mimetype),
          userId,
          projectId: projectId || null,
        },
      });

      res.status(201).json({
        id: asset.id,
        filename: asset.filename,
        filePath: asset.filePath, // This is now the S3 URL
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
        type: asset.type,
      });
    } catch (error) {
      console.error('Error creating asset:', error);
      res.status(500).json({ message: 'Error uploading file' });
    }
  });
};

// Get asset by ID
export const getAssetById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  try {
    const asset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!asset) {
      res.status(404).json({ message: 'Asset not found' });
      return;
    }

    // Check if user owns the asset or if it's public
    if (asset.userId !== userId) {
      res.status(403).json({ message: 'Not authorized to access this asset' });
      return;
    }

    // Return the S3 URL directly
    res.json({
      id: asset.id,
      filename: asset.filename,
      filePath: asset.filePath, // This is the S3 URL
      mimeType: asset.mimeType,
      fileSize: asset.fileSize,
      type: asset.type,
    });
  } catch (error) {
    console.error(`Error fetching asset ${id}:`, error);
    res.status(500).json({ message: 'Error fetching asset' });
  }
};

// Delete asset
export const deleteAsset = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  try {
    const asset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!asset) {
      res.status(404).json({ message: 'Asset not found' });
      return;
    }

    if (asset.userId !== userId) {
      res.status(403).json({ message: 'Not authorized to delete this asset' });
      return;
    }

    // Extract S3 key from URL
    const s3Url = asset.filePath;
    const key = s3Url.split('.com/')[1]; // Extract key from S3 URL
    
    // Delete from S3
    await deleteFileFromS3(key);

    // Delete from database
    await prisma.asset.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting asset ${id}:`, error);
    res.status(500).json({ message: 'Error deleting asset' });
  }
};

module.exports = {
  uploadAsset,
  getAssetById,
  deleteAsset,
}; 