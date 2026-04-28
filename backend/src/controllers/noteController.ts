import { Response } from 'express';
const prisma = require('../models/db');
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const createNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }
  const { body } = req.body;
  if (!body || typeof body !== 'string' || body.trim().length === 0) {
    res.status(400).json({ message: 'body is required' });
    return;
  }
  try {
    const note = await prisma.note.create({
      data: { body: body.trim(), userId },
    });
    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ message: 'Error creating note' });
  }
};

export const getNotes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }
  try {
    const notes = await prisma.note.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Error fetching notes' });
  }
};

export const deleteNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { id } = req.params;
  if (!userId) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }
  try {
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) {
      res.status(404).json({ message: 'Note not found' });
      return;
    }
    if (note.userId !== userId) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }
    await prisma.note.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ message: 'Error deleting note' });
  }
};

module.exports = { createNote, getNotes, deleteNote };
