const { Router } = require('express');
const { getAllUsers } = require('../controllers/userController');

const router = Router();

router.get('/users', getAllUsers);

module.exports = router;