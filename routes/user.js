const express = require('express');
const router = express.Router();

const authentication = require('../middleware/authentication');
const userController = require('../controllers/user');

router.get('/:userId', authentication, userController.getUserDetail);

module.exports = router;