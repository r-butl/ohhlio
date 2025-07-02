import { Router } from 'express';
import { getAllUsers } from '../controllers/userController.js';

const router = Router();

router.get('/users', getAllUsers);

export default router;