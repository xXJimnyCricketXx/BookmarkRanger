const express = require('express');
const router = express.Router();
const setupController = require('../controllers/setupController');

router.get('/', setupController.showSetup);
router.post('/', setupController.setup);

module.exports = router;
