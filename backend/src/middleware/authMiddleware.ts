import { Request, Response, NextFunction } from 'express';
import { verifyToken, DecodedToken } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export const protect = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = verifyToken(token) as DecodedToken;
      req.user = { id: decoded.userId };
      return next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
      return;
    }
  }

  res.status(401).json({ message: 'Not authorized, no token' });
}; 

