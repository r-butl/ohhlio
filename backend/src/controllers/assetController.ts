import { Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
const prisma = require('../models/db');
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Support multiple file types
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Documents
      'application/pdf', 'text/plain', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // Videos
      'video/mp4', 'video/webm', 'video/ogg',
      // Audio
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      // Archives
      'application/zip', 'application/x-rar-compressed'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

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

      console.log(`Writing file with name ${req.file.filename}`);
      
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
          filePath: req.file.filename,
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
        filePath: asset.filePath,
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

    // Serve the actual file
    const filePath = path.join(__dirname, '../uploads', asset.filePath);
    
    console.log(`Looking for file at: ${filePath}`);
    console.log(`Asset filePath: ${asset.filePath}`);
    console.log(`__dirname: ${__dirname}`);
    console.log(`Resolved path: ${path.resolve(filePath)}`);
    
    // Check if uploads directory exists
    const uploadsDir = path.join(__dirname, '../uploads');
    console.log(`Uploads directory: ${uploadsDir}`);
    console.log(`Uploads directory exists: ${fs.existsSync(uploadsDir)}`);
    
    // List files in uploads directory
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      console.log(`Files in uploads directory: ${files.join(', ')}`);
    }
    
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: 'File not found on disk' });
      return;
    }

    // Set appropriate headers
    res.setHeader('Content-Type', asset.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${asset.filename}"`);
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
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

    // Delete the file from disk
    const filePath = path.join(__dirname, '../uploads', asset.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

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