const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const prisma = require('./models/db');

import { Request, Response, NextFunction } from 'express';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Routers
const authRoutes = require('../api/authRoutes');
const userRoutes = require('../api/userRoutes');
const profileRoutes = require('../api/profileRoutes');
const projectRoutes = require('../api/projectRoutes');
const assetRoutes = require('../api/assetRoutes');
const noteRoutes = require('../api/noteRoutes');

// Serve static files with CORS headers (before helmet middleware)
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(uploadDir));

// Middleware
app.use(helmet());

// CORS middleware (simplified for Vercel)
app.use(cors({
  origin: true, // Allow all origins - Vercel handler will filter
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// File uploading
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/notes', noteRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Ohhlio Backend is running!' });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  console.error('Express error:', err);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('/*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Only start the server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    try {
      // Connect to database
      await prisma.$connect();
      console.log('✅ Database connected successfully');
      
      console.log(`🚀 Server running on port ${PORT}`);
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      process.exit(1);
    }
  }); 

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

export { app };