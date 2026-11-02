const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { limitLogin } = require('../middleware/loginLimit');

router.get('/login', authController.showLogin);
router.post('/login', limitLogin, authController.login);
router.post('/logout', authController.logout);

module.exports = router;
