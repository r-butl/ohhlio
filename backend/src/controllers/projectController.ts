import { Response } from 'express';
const prisma = require('../models/db');
import { AuthenticatedRequest } from '../middleware/authMiddleware';

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
    res.status(201).json(newProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Error creating project' });
  }
};

// Update an existing project
export const updateProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, description, items, isPublic } = req.body;
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

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        title,
        description,
        items,
        isPublic,
      },
    });
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
        await prisma.asset.delete({
          where: { id: asset.id }
        })
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
  createProject,
  updateProject,
  deleteProject,
};