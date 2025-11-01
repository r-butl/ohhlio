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

// Public: Get a user's public profile by username
import { getSignedDownloadUrl } from '../services/s3Service';
import { verifyToken } from '../utils/jwt';

export const getPublicUserByUsername = async (req: Request, res: Response) => {
    const { username } = req.params as { username: string };
    try {
        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                description: true,
                profileImageId: true,
            }
        });

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // If profile image exists, resolve signed URL
        let profileImageUrl: string | undefined = undefined;
        if (user.profileImageId) {
            const asset = await prisma.asset.findUnique({ where: { id: user.profileImageId } });
            if (asset) {
                try {
                    profileImageUrl = await getSignedDownloadUrl(asset.filePath);
                } catch (e) {
                    console.warn('Failed to sign profile image URL');
                }
            }
        }

        res.json({ ...user, profileImageUrl });
    } catch (error) {
        console.error('Error fetching public user:', error);
        res.status(500).json({ message: 'Error fetching public user profile' });
    }
};

module.exports.getPublicUserByUsername = getPublicUserByUsername;

// Unified: public profile + projects, or private if owner
export const getProfileWithProjects = async (req: Request, res: Response) => {
    const { username } = req.params as { username: string };
    // Try read bearer token if present
    let requesterUserId: string | null = null;
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
            const decoded = verifyToken(token);
            requesterUserId = decoded.userId;
        } catch {
            // ignore invalid token; treat as public
        }
    }

    try {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Build profile with signed profile image URL
        let profileImageUrl: string | undefined = undefined;
        if (user.profileImageId) {
            const asset = await prisma.asset.findUnique({ where: { id: user.profileImageId } });
            if (asset) {
                try {
                    profileImageUrl = await getSignedDownloadUrl(asset.filePath);
                } catch {}
            }
        }

        const isOwner = requesterUserId === user.id;

        // Fetch projects: all for owner, only public otherwise
        const projects = await prisma.project.findMany({
            where: { userId: user.id, ...(isOwner ? {} : { isPublic: true }) },
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                title: true,
                description: true,
                headerPhotoId: true,
                isPublic: true,
                updatedAt: true,
            }
        });

        // Optionally include signed headerPhoto URLs
        const projectsWithHeaderUrls = await Promise.all(projects.map(async (p: { headerPhotoId: string | null }) => {
            if (!p.headerPhotoId) return { ...p, headerPhotoUrl: undefined };
            const asset = await prisma.asset.findUnique({ where: { id: p.headerPhotoId } });
            if (!asset) return { ...p, headerPhotoUrl: undefined };
            try {
                const url = await getSignedDownloadUrl(asset.filePath);
                return { ...p, headerPhotoUrl: url };
            } catch {
                return { ...p, headerPhotoUrl: undefined };
            }
        }));

        res.json({
            profile: {
                username: user.username,
                description: user.description,
                profileImageUrl,
            },
            projects: projectsWithHeaderUrls,
            canEdit: isOwner,
        });
    } catch (error) {
        console.error('Error fetching unified profile:', error);
        res.status(500).json({ message: 'Error fetching unified profile' });
    }
};

module.exports.getProfileWithProjects = getProfileWithProjects;

