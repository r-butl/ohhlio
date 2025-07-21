const { Router } = require('express');
const { register, login } = require('../src/controllers/authController');
import { Request, Response, NextFunction } from 'express';

const router = Router();

router.post('/register', (req: Request, res: Response, next: NextFunction) => {
  register(req, res).catch(next);
});

router.post('/login', (req: Request, res: Response, next: NextFunction) => {
  login(req, res).catch(next);
});

module.exports = router;