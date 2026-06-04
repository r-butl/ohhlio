import { Request, Response } from 'express';
const prisma = require('../models/db');
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { verifyToken } from '../utils/jwt';
import { deleteAsset } from '../services/storageService';

// Get all projects for the logged-in user
export const getProjects = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  try {
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Error fetching projects' });
  }
};

// Get a single project by its ID
export const getProjectById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }
  
  try {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // Ensure the user is authorized to see this project
    if (project.userId !== userId) {
        res.status(403).json({ message: 'Not authorized to view this project' });
        return;
    }

    res.json(project);
  } catch (error) {
    console.error(`Error fetching project ${id}:`, error);
    res.status(500).json({ message: 'Error fetching project' });
  }
};

// Public: Get a single project by its ID if it is public
export const getPublicProjectById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    if (!project.isPublic) {
      res.status(403).json({ message: 'This project is not public' });
      return;
    }

    res.json(project);
  } catch (error) {
    console.error(`Error fetching public project ${id}:`, error);
    res.status(500).json({ message: 'Error fetching public project' });
  }
};

// Unified: public if not owner, private if owner (auth optional)
export const getProjectUnified = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  // Try optional token
  let requesterUserId: string | null = null;
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = verifyToken(token);
      requesterUserId = decoded.userId;
    } catch {}
  }
  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    const isOwner = requesterUserId === project.userId;
    if (!isOwner && !project.isPublic) {
      res.status(403).json({ message: 'This project is not public' });
      return;
    }
    res.json({ ...project, canEdit: isOwner });
  } catch (error) {
    console.error(`Error fetching unified project ${id}:`, error);
    res.status(500).json({ message: 'Error fetching project' });
  }
};

// Public: Get public projects for a user by username
export const getPublicProjectsByUsername = async (req: Request, res: Response): Promise<void> => {
  const { username } = req.params as { username: string };
  try {
    const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const projects = await prisma.project.findMany({
      where: { userId: user.id, isPublic: true },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(projects);
  } catch (error) {
    console.error('Error fetching public projects by username:', error);
    res.status(500).json({ message: 'Error fetching public projects' });
  }
};

// Create a new project
export const createProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { title, description, items } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  if (!title || !items) {
    res.status(400).json({ message: 'Title and items are required' });
    return;
  }

  try {
    const newProject = await prisma.project.create({
      data: {
        title,
        description: description || '',
        items,
        userId,
      },
    });
    await syncProjectAssets(newProject.id, items);
    res.status(201).json(newProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Error creating project' });
  }
};


const extractAssetIds = (items: Record<string, unknown>): string[] => {
  const ids: string[] = [];
  Object.values(items).forEach((item: unknown) => {
    const i = item as { props?: { assetId?: string } };
    if (i.props?.assetId) ids.push(i.props.assetId);
  });
  return ids;
};

const syncProjectAssets = async (projectId: string, items: Record<string, unknown>) => {
  const assetIds = extractAssetIds(items);
  await prisma.projectAsset.deleteMany({ where: { projectId } });
  if (assetIds.length > 0) {
    await prisma.projectAsset.createMany({
      data: assetIds.map((assetId: string) => ({ projectId, assetId })),
      skipDuplicates: true,
    });
  }
};

// Helper function to find and delete orphaned assets
const cleanupOrphanedAssets = async (projectId: string, oldItems: Record<string, unknown>, newItems: Record<string, unknown>) => {
  try {
    // Extract asset IDs from old items
    const oldAssetIds = new Set<string>();
    Object.values(oldItems).forEach((item: unknown) => {
      const i = item as { props?: { assetId?: string } };
      if (i.props && i.props.assetId) {
        oldAssetIds.add(i.props.assetId);
      }
    });

    // Extract asset IDs from new items
    const newAssetIds = new Set<string>();
    Object.values(newItems).forEach((item: unknown) => {
      const i = item as { props?: { assetId?: string } };
      if (i.props && i.props.assetId) {
        newAssetIds.add(i.props.assetId);
      }
    });

    // Find orphaned assets (in old but not in new)
    const orphanedAssetIds = Array.from(oldAssetIds).filter(id => !newAssetIds.has(id));

    console.log(`Found ${orphanedAssetIds.length} orphaned assets to delete`);

    // Delete orphaned assets
    for (const assetId of orphanedAssetIds) {
      await deleteAsset(assetId);
    }

    return orphanedAssetIds.length;
  } catch (error) {
    console.error('Error cleaning up orphaned assets:', error);
    return 0;
  }
};

// Update an existing project
export const updateProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, description, items, isPublic, headerPhotoId } = req.body;
  const userId = req.user?.id;

  console.log(`${items}`)

  if (!userId) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    
    if (project.userId !== userId) {
      res.status(403).json({ message: 'Not authorized to update this project' });
      return;
    }

    // Clean up orphaned assets before updating
    const oldItems = project.items || {};
    const deletedCount = await cleanupOrphanedAssets(id, oldItems, items);
    
    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} orphaned assets for project ${id}`);
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        title,
        description,
        items,
        isPublic,
        headerPhotoId,
      },
    });
    if (items !== undefined) {
      await syncProjectAssets(id, items);
    }
    res.json(updatedProject);
  } catch (error) {
    console.error(`Error updating project ${id}:`, error);
    res.status(500).json({ message: 'Error updating project' });
  }
};


// Delete a project
export const deleteProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  try {

    // Find the project
    const project = await prisma.project.findUnique({
        where: { id },
    });

    if (!project) {
        res.status(404).json({ message: 'Project not found' });
        return;
    }
    
    if (project.userId !== userId) {
        res.status(403).json({ message: 'Not authorized to delete this project' });
        return;
    }

    // Delete all of the assets associated with the project
    const projectAssets = await prisma.asset.findMany({
        where: { projectId: id }
    })

    if (projectAssets.length > 0) {
      for (const asset of projectAssets) {
        await deleteAsset(asset.id);
      }
    }

    // Delete the project itself
    await prisma.project.delete({
      where: { id },
    });

    res.status(204).send(); 
  } catch (error) {
    console.error(`Error deleting project ${id}:`, error);
    res.status(500).json({ message: 'Error deleting project' });
  }
};

module.exports = {
  getProjects,
  getProjectById,
  getPublicProjectById,
  getProjectUnified,
  getPublicProjectsByUsername,
  createProject,
  updateProject,
  deleteProject,
};