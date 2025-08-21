import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
const prisma = require('../models/db');

const getAllUsers = async (req: Request, res: Response) => {
    const users = await prisma.user.findMany();
    res.json(users);
};

// Get current user profile
const getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    
    if (!userId) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                profileImageId: true,
                description: true,
                createdAt: true,
                updatedAt: true,
                profileImage: {
                    select: {
                        id: true,
                        filename: true,
                        filePath: true,
                        mimeType: true,
                    }
                }
            }
        });

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Error fetching user profile' });
    }
};

// Update user profile
const updateUserProfile = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { profileImageId, description } = req.body;
    
    if (!userId) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }

    try {
        // Verify the user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // If profileImageId is provided, verify the asset exists and belongs to the user
        if (profileImageId) {
            const asset = await prisma.asset.findFirst({
                where: {
                    id: profileImageId,
                    userId: userId,
                    type: 'image'
                }
            });

            if (!asset) {
                res.status(400).json({ message: 'Invalid profile image or image not found' });
                return;
            }
        }

        // Build update data object with only provided fields
        const updateData: any = {};
        
        if (profileImageId !== undefined) {
            updateData.profileImageId = profileImageId;
        }
        
        if (description !== undefined) {
            updateData.description = description;
        }

        // Update the user profile
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                username: true,
                profileImageId: true,
                createdAt: true,
                updatedAt: true,
                profileImage: {
                    select: {
                        id: true,
                        filename: true,
                        filePath: true,
                        mimeType: true,
                    }
                }
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Error updating user profile' });
    }
};

module.exports = { getAllUsers, getCurrentUser, updateUserProfile };

