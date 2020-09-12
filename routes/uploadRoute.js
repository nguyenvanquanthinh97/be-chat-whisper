const express = require('express');
const router = express.Router();

const authentication = require('../middleware/authentication');
const uploadController = require('../controllers/upload');

router.get('/upload', authentication, uploadController);

module.exports = router;
