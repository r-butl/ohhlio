import { Router } from 'express';
import { getAllUsers } from '../controllers/userController'

const router = Router();

router.get('/users', getAllUsers);

export default router;