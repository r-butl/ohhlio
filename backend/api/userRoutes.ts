const { Router } = require('express');
const { getAllUsers, getCurrentUser, updateUserProfile } = require('../src/controllers/userController');
const { protect } = require('../src/middleware/authMiddleware');

const router = Router();

router.get('/users', getAllUsers);

// Profile routes (require authentication)
router.get('/profile', protect, getCurrentUser);
router.put('/profile', protect, updateUserProfile);

module.exports = router;