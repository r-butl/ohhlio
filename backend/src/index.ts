const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const prisma = require('./models/db');

import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { createMetaRouter, buildMetaTags } from './middleware/metaMiddleware';
import { sitemapHandler } from './controllers/sitemapController';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const FRONTEND_DIST_PATH = process.env.FRONTEND_DIST_PATH || path.join(__dirname, '../../frontend/dist');
const INDEX_HTML_PATH = path.join(FRONTEND_DIST_PATH, 'index.html');

let indexHtml = '';
if (fs.existsSync(INDEX_HTML_PATH)) {
  indexHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');
}

const genericMetaTags = buildMetaTags({
  title: 'Ohhlio',
  description: 'Build and share your portfolio with Ohhlio.',
  url: process.env.APP_URL || 'https://ohhlio.com',
});
const genericHtml = indexHtml ? indexHtml.replaceAll('<title>Ohhlio</title>\n    <meta name="description" content="Build and share your portfolio with Ohhlio." />', genericMetaTags) : '';

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
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

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

// robots.txt and sitemap must come before static file serving
app.get('/robots.txt', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(`User-agent: *\nAllow: /\nSitemap: ${process.env.APP_URL || 'https://ohhlio.com'}/sitemap.xml`);
});

app.get('/sitemap.xml', sitemapHandler);

// Serve built frontend assets (JS, CSS, images) without serving index.html
app.use(express.static(FRONTEND_DIST_PATH, { index: false }));


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

// Per-route meta tag injection for profile and project pages
if (indexHtml) {
  app.use(createMetaRouter(indexHtml));
}

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  console.error('Express error:', err);
  res.status(500).json({ error: 'Something went wrong!' });
});

// API 404 — JSON response for unknown API routes
app.use('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// SPA catch-all — serve index.html with generic meta for all other routes
app.use((_req: Request, res: Response) => {
  if (genericHtml) {
    res.send(genericHtml);
  } else {
    res.status(404).json({ error: 'Frontend not built' });
  }
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