const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController');

router.get('/', indexController.dashboard);
router.get('/api/search-check', indexController.searchCheck);
router.post('/search-providers', indexController.createSearchProvider);

module.exports = router;
