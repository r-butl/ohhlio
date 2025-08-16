import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
const prisma = require('../models/db');
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { upload, uploadFileToS3, deleteFileFromS3, getSignedDownloadUrl } from '../services/s3Service';

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
      
      // Upload to S3 and get the key
      const s3Key = await uploadFileToS3(req.file, key);
      
      // Generate signed URL for immediate access
      const signedUrl = await getSignedDownloadUrl(s3Key);
      
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
          filePath: s3Key, // Store S3 key instead of URL
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
        filePath: signedUrl, // Return signed URL for immediate access
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

    // Generate signed URL for the asset
    const signedUrl = await getSignedDownloadUrl(asset.filePath);

    res.json({
      id: asset.id,
      filename: asset.filename,
      filePath: signedUrl, // Return signed URL
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

    // The filePath now contains the S3 key directly
    const s3Key = asset.filePath;
    
    // Delete from S3
    await deleteFileFromS3(s3Key);

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