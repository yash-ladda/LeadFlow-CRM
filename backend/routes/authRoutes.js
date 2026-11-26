const express = require('express');
const { login, getMe } = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

//login
router.post('/login', login);

//get current loggedin user
router.get('/me', authenticateToken, getMe);

module.exports = router;