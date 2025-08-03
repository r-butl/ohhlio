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
const projectRoutes = require('../api/projectRoutes');
const assetRoutes = require('../api/assetRoutes');

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

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// File uploading
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Add request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`🔍 ${req.method} ${req.path}`);
  console.log(`📊 Content-Length: ${req.headers['content-length']}`);
  console.log(`📋 Content-Type: ${req.headers['content-type']}`);
  console.log(`👤 User-Agent: ${req.headers['user-agent']}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/assets', assetRoutes);

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
      
      // Test database connection
      console.log('🔄 Testing database connection...');
      await prisma.$executeRaw`SELECT 1`;
      console.log('✅ Database connection successful');
      
      console.log(`🚀 Server running on port ${PORT}`);
      console.log('🔍 Console logging is working!');
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

module.exports = { app };