import { generateToken } from '../utils/jwt';
import bcrypt from 'bcrypt';
const prisma = require('../models/db');
const validator = require('validator');
import type { Request, Response } from 'express';

const register = async (req: Request, res: Response) => {
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

        // Check if the password is valid
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user
        const user = await prisma.user.create({
            data: { username, email, password: hashedPassword },
        });

        if (!user) {
            res.status(400).json({ message: "User creation failed."})
        }

        // Generate a JWT token
        const token = generateToken(user.id);
        res.status(201).json({ token: token, username: user.username, email: user.email });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: `Registration failed: ${error}` });
    }
}

const login = async (req: Request, res: Response) => {
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
        const user = await prisma.user.findUnique({ where: {email: email}, });
        console.log(`Found user`);
        console.log(user)
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        // Check if the password is valid
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid password.' });
        }

        // Generate a JWT token
        const token = generateToken(user.id);
        res.status(200).json({ token: token, username: user.username, email: user.email });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed' });
    }
}

module.exports = { register, login };