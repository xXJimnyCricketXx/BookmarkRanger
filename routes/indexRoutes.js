const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController');

router.get('/', indexController.dashboard);
router.post('/search-providers', indexController.createSearchProvider);

module.exports = router;
