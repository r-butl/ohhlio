import { app } from '../src/index';

// Vercel serverless function handler
export default async function handler(req: any, res: any) {
  // Set CORS headers for Vercel
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://ohhlio.vercel.app',
    'https://ohhlio.netlify.app'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Pass the request to your Express app
  return app(req, res);
}