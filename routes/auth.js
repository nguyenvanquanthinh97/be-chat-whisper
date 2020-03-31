const express = require('express');
const router = express.Router();
const authentication = require('../middleware/authentication');

const authController = require('../controllers/auth');

router.post('/login', authController.login);
router.get('/logout', authentication, authController.logout);

module.exports = router;