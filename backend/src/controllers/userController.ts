const prisma = require('../models/db');
import { Request, Response } from 'express';

const getAllUsers = async (req: Request, res: Response) => {
    const users = await prisma.user.findMany();
    res.json(users);
};

module.exports = { getAllUsers };

