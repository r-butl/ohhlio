import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
const prisma = require('../models/db');
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { upload, uploadFileToS3, getSignedDownloadUrl } from '../services/s3Service';
import { deleteAsset as deleteAssetFromStorage } from '../services/storageService';

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
          filePath: s3Key,
          mimeType: req.file.mimetype,
          fileSize: req.file.size,
          type: getAssetType(req.file.mimetype),
          userId,
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

// Public: Get asset by ID if it belongs to at least one public project
export const getPublicAssetById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        projects: {
          include: { project: { select: { isPublic: true } } },
        },
        headerForProject: { select: { isPublic: true } },
      },
    });
    if (!asset) {
      res.status(404).json({ message: 'Asset not found' });
      return;
    }
    const isPublic =
      asset.projects.some((pa: { project: { isPublic: boolean } }) => pa.project.isPublic) ||
      asset.headerForProject?.isPublic === true;
    if (!isPublic) {
      res.status(403).json({ message: 'Asset is not publicly accessible' });
      return;
    }
    const signedUrl = await getSignedDownloadUrl(asset.filePath);
    res.json({
      id: asset.id,
      filename: asset.filename,
      filePath: signedUrl,
      mimeType: asset.mimeType,
      fileSize: asset.fileSize,
      type: asset.type,
    });
  } catch (error) {
    console.error(`Error fetching public asset ${id}:`, error);
    res.status(500).json({ message: 'Error fetching public asset' });
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

    await deleteAssetFromStorage(id);

    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting asset ${id}:`, error);
    res.status(500).json({ message: 'Error deleting asset' });
  }
};

// Upload profile image
export const uploadProfileImage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    // Validate that it's an image
    if (!req.file.mimetype.startsWith('image/')) {
      res.status(400).json({ message: 'Only image files are allowed for profile pictures' });
      return;
    }

    try {
      // Generate unique S3 key for profile image
      const key = `users/${userId}/profile/${uuidv4()}-${req.file.originalname}`;
      
      // Upload to S3 and get the key
      const s3Key = await uploadFileToS3(req.file, key);
      
      // Generate signed URL for immediate access
      const signedUrl = await getSignedDownloadUrl(s3Key);
      
      const asset = await prisma.asset.create({
        data: {
          filename: req.file.originalname,
          filePath: s3Key,
          mimeType: req.file.mimetype,
          fileSize: req.file.size,
          type: 'image',
          userId,
        },
      });

      // Get the user's current profile image to delete it later
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { profileImageId: true }
      });

      // Update the user's profile image
      await prisma.user.update({
        where: { id: userId },
        data: { profileImageId: asset.id }
      });

      // If there was a previous profile image, delete it
      if (currentUser?.profileImageId) {
        try {
          const oldAsset = await prisma.asset.findUnique({
            where: { id: currentUser.profileImageId }
          });
          
          if (oldAsset) {
            await deleteAssetFromStorage(currentUser.profileImageId);
          }
        } catch (error) {
          console.error('Error deleting old profile image:', error);
          // Don't fail the request if old image deletion fails
        }
      }

      res.status(201).json({
        id: asset.id,
        filename: asset.filename,
        filePath: signedUrl,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
        type: asset.type,
      });
    } catch (error) {
      console.error('Error uploading profile image:', error);
      res.status(500).json({ message: 'Error uploading profile image' });
    }
  });
};

// Get all assets not linked to any project (the bucket)
export const getBucketAssets = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }
  try {
    const assets = await prisma.asset.findMany({
      where: {
        userId,
        projects: { none: {} },
        profileForUser: null,
        headerForProject: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    const assetsWithUrls = await Promise.all(
      assets.map(async (asset: { id: string; filename: string; filePath: string; mimeType: string; fileSize: number; type: string; createdAt: Date }) => ({
        id: asset.id,
        filename: asset.filename,
        filePath: await getSignedDownloadUrl(asset.filePath),
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
        type: asset.type,
        createdAt: asset.createdAt,
      }))
    );

    res.json(assetsWithUrls);
  } catch (error) {
    console.error('Error fetching bucket assets:', error);
    res.status(500).json({ message: 'Error fetching bucket assets' });
  }
};

// Link an asset to a project
export const linkAssetToProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { id: projectId, assetId } = req.params;
  if (!userId) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }
  try {
    const [project, asset] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId } }),
      prisma.asset.findUnique({ where: { id: assetId } }),
    ]);
    if (!project || project.userId !== userId) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }
    if (!asset || asset.userId !== userId) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }
    await prisma.projectAsset.upsert({
      where: { projectId_assetId: { projectId, assetId } },
      update: {},
      create: { projectId, assetId },
    });
    res.status(201).json({ projectId, assetId });
  } catch (error) {
    console.error('Error linking asset to project:', error);
    res.status(500).json({ message: 'Error linking asset to project' });
  }
};

// Unlink an asset from a project
export const unlinkAssetFromProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { id: projectId, assetId } = req.params;
  if (!userId) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }
  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.userId !== userId) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }
    await prisma.projectAsset.delete({
      where: { projectId_assetId: { projectId, assetId } },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error unlinking asset from project:', error);
    res.status(500).json({ message: 'Error unlinking asset from project' });
  }
};

module.exports = {
  uploadAsset,
  uploadProfileImage,
  getAssetById,
  getPublicAssetById,
  deleteAsset,
  getBucketAssets,
  linkAssetToProject,
  unlinkAssetFromProject,
}; 