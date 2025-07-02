import { generateToken } from '../utils/jwt.js';
import { Request, Response } from 'express';
import bcrypt from "bcrypt";
import { prisma } from '../models/db.js';
import validator from 'validator';

export const register = async (req: Request, res: Response) => {
    let { username, email, password } = req.body;

    // Input validation
    if (!email || !validator.isEmail(email)) {
        return res.status(400).json({ message: 'Invalid email or password.' });
    }
    if (!password) {
        return res.status(400).json({ message: 'Invalid email or password.' });
    }

    email = validator.normalizeEmail(email);
    username = username.trim();

    // Check if the user already exists
    try {

        // Check if the email has a valid format using regex
        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
    
        // Check if the email already exists
        const existingEmail = await prisma.user.findUnique({ where: { email } });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Check if the username already exists
        const existingUsername = await prisma.user.findUnique({ where: { username } });
        if (existingUsername) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Check if the password is at least 8 characters long
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user
        const user = await prisma.user.create({
            data: { username, email, password: hashedPassword },
        });

        // Generate a JWT token
        const token = generateToken(user.id);
        res.status(201).json({ token });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Registration failed' });
    }
}

export const login = async (req: Request, res: Response) => {
    let { email, password } = req.body;

    // Input validation
    if (!email || !validator.isEmail(email)) {
        return res.status(400).json({ message: 'Invalid email or password.' });
    }
    if (!password) {
        return res.status(400).json({ message: 'Invalid email or password.' });
    }

    email = validator.normalizeEmail(email);

    try {

        // Check if the user exists
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        // Check if the password is valid
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid password.' });
        }

        // Generate a JWT token
        const token = generateToken(user.id);
        res.status(200).json({ token });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed' });
    }
}
