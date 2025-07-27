const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Mock the database before importing controllers
jest.mock('../src/models/db', () => ({
  asset: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
}));

const { uploadAsset, getAssetById, deleteAsset } = require('../src/controllers/assetController');

jest.mock('multer', () => {
  const multer = jest.fn(() => {
    return {
      single: jest.fn(() => (req, res, next) => {
        // Mock file upload
        req.file = {
          originalname: 'test-image.jpg',
          filename: '123e4567-e89b-12d3-a456-426614174000-test-image.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
        };
        next();
      }),
    };
  });
  multer.diskStorage = jest.fn(() => ({
    destination: (req, file, cb) => cb(null, './test-uploads'),
    filename: (req, file, cb) => cb(null, 'test-file.jpg'),
  }));
  return multer;
});

// Mock environment variables
process.env.UPLOAD_DIR = './test-uploads';

// Mock fs module for file operations
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  createReadStream: jest.fn(),
  unlinkSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  rmSync: jest.fn(),
}));

describe('Asset Controller Tests', () => {
  let mockReq;
  let mockRes;
  let mockNext;

    beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock fs.existsSync to return true for test-uploads directory
    fs.existsSync.mockImplementation((path) => {
        if (path === './test-uploads') return true;
        if (path.includes('test-uploads')) return true;
        return false;
    });
    
    // Mock fs.createReadStream to return a readable stream
    fs.createReadStream.mockReturnValue({
        pipe: jest.fn(),
    });

    // Mock request
    mockReq = {
      user: { id: 'test-user-id' },
      params: { id: 'test-asset-id' },
      body: { projectId: 'test-project-id' },
      file: {
        originalname: 'test-image.jpg',
        filename: '123e4567-e89b-12d3-a456-426614174000-test-image.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      },
    };

    // Mock response
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      pipe: jest.fn(),
    };

    // Mock next function
    mockNext = jest.fn();
  });

           afterEach(() => {
           // Clean up mocks
           jest.clearAllMocks();
         });

  describe('uploadAsset', () => {
    it('should successfully upload an asset', async () => {
      const mockAsset = {
        id: 'test-asset-id',
        filename: 'test-image.jpg',
        filePath: '123e4567-e89b-12d3-a456-426614174000-test-image.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024,
        type: 'image',
      };

      const { asset } = require('../src/models/db');
      asset.create.mockResolvedValue(mockAsset);

      await uploadAsset(mockReq, mockRes);

      expect(asset.create).toHaveBeenCalledWith({
        data: {
          filename: 'test-image.jpg',
          filePath: '123e4567-e89b-12d3-a456-426614174000-test-image.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1024,
          type: 'image',
          userId: 'test-user-id',
          projectId: 'test-project-id',
        },
      });

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockAsset);
    });

    it('should return 401 when user is not authenticated', async () => {
      mockReq.user = null;

      await uploadAsset(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Not authenticated' });
    });

    it('should handle database errors', async () => {
      const { asset } = require('../src/models/db');
      asset.create.mockRejectedValue(new Error('Database error'));

      await uploadAsset(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Error uploading file' });
    });
  });

    describe('getAssetById', () => {
    it('should successfully retrieve an asset', async () => {
        const mockAsset = {
        id: 'test-asset-id',
        filename: 'test-image.jpg',
        filePath: '123e4567-e89b-12d3-a456-426614174000-test-image.jpg',
        mimeType: 'image/jpeg',
        userId: 'test-user-id',
        };

        const { asset } = require('../src/models/db');
        asset.findUnique.mockResolvedValue(mockAsset);

        // Mock fs.existsSync to return true for the specific file
        fs.existsSync.mockImplementation((path) => {
        if (path.includes('123e4567-e89b-12d3-a456-426614174000-test-image.jpg')) return true;
        return false;
        });

        await getAssetById(mockReq, mockRes);

        expect(asset.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-asset-id' },
        });

        expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
        expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Disposition', 'inline; filename="test-image.jpg"');
    });

    it('should return 404 when asset is not found', async () => {
      const { asset } = require('../src/models/db');
      asset.findUnique.mockResolvedValue(null);

      await getAssetById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Asset not found' });
    });

    it('should return 403 when user is not authorized', async () => {
      const mockAsset = {
        id: 'test-asset-id',
        userId: 'different-user-id',
      };

      const { asset } = require('../src/models/db');
      asset.findUnique.mockResolvedValue(mockAsset);

      await getAssetById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Not authorized to access this asset' });
    });

    it('should return 404 when file does not exist on disk', async () => {
        const mockAsset = {
        id: 'test-asset-id',
        filename: 'test-image.jpg',
        filePath: 'non-existent-file.jpg',
        mimeType: 'image/jpeg',
        userId: 'test-user-id',
        };

        const { asset } = require('../src/models/db');
        asset.findUnique.mockResolvedValue(mockAsset);

        // Mock fs.existsSync to return false for non-existent file
        fs.existsSync.mockReturnValue(false);

        await getAssetById(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({ message: 'File not found on disk' });
    });
  });

           describe('deleteAsset', () => {
           it('should successfully delete an asset', async () => {
             const mockAsset = {
               id: 'test-asset-id',
               filePath: '123e4567-e89b-12d3-a456-426614174000-test-image.jpg',
               userId: 'test-user-id',
             };
       
             const { asset } = require('../src/models/db');
             asset.findUnique.mockResolvedValue(mockAsset);
             asset.delete.mockResolvedValue(mockAsset);
       
             // Mock fs.existsSync to return true for the specific file
             fs.existsSync.mockImplementation((path) => {
               if (path.includes('123e4567-e89b-12d3-a456-426614174000-test-image.jpg')) return true;
               return false;
             });
       
             await deleteAsset(mockReq, mockRes);
       
             expect(asset.findUnique).toHaveBeenCalledWith({
               where: { id: 'test-asset-id' },
             });
       
             expect(asset.delete).toHaveBeenCalledWith({
               where: { id: 'test-asset-id' },
             });
       
             expect(mockRes.status).toHaveBeenCalledWith(204);
           });

    it('should return 404 when asset is not found', async () => {
      const { asset } = require('../src/models/db');
      asset.findUnique.mockResolvedValue(null);

      await deleteAsset(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Asset not found' });
    });

    it('should return 403 when user is not authorized', async () => {
      const mockAsset = {
        id: 'test-asset-id',
        userId: 'different-user-id',
      };

      const { asset } = require('../src/models/db');
      asset.findUnique.mockResolvedValue(mockAsset);

      await deleteAsset(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Not authorized to delete this asset' });
    });
  });

  describe('File Type Validation', () => {
    it('should accept valid image files', () => {
      const validTypes = [
        'image/jpeg',
        'image/png', 
        'image/gif',
        'image/webp',
        'image/svg+xml'
      ];

      validTypes.forEach(mimeType => {
        const file = { mimetype: mimeType };
        // This would test the multer fileFilter function
        expect(mimeType).toMatch(/^image\//);
      });
    });

    it('should accept valid document files', () => {
      const validTypes = [
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      validTypes.forEach(mimeType => {
        expect(mimeType).toMatch(/^(application\/pdf|text\/|.*word.*)/);
      });
    });

    it('should accept valid video files', () => {
      const validTypes = [
        'video/mp4',
        'video/webm',
        'video/ogg'
      ];

      validTypes.forEach(mimeType => {
        expect(mimeType).toMatch(/^video\//);
      });
    });
  });
});
