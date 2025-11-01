import { Router } from 'express';
import { getProfileWithProjects } from '../src/controllers/userController';

const router = Router();

// Auth-optional unified profile endpoint
router.get('/:username', getProfileWithProjects);

module.exports = router;


