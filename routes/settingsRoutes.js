const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

router.get('/', (req, res) => res.redirect(`${res.locals.baseUrl}/settings/theme`));

router.get('/theme', settingsController.showTheme);
router.post('/theme', settingsController.saveTheme);

router.get('/theme/custom/add', settingsController.showAddCustomTheme);
router.post('/theme/custom', settingsController.createCustomTheme);
router.get('/theme/custom/:id/edit', settingsController.showEditCustomTheme);
router.post('/theme/custom/:id', settingsController.updateCustomTheme);
router.post('/theme/custom/:id/delete', settingsController.deleteCustomTheme);

router.get('/general', settingsController.showGeneral);
router.post('/general', settingsController.saveGeneral);

router.get('/search-providers/add', settingsController.showAddSearchProvider);
router.post('/search-providers', settingsController.createSearchProvider);
router.post('/search-providers/:id/delete', settingsController.deleteSearchProvider);

router.get('/interface', settingsController.showInterface);
router.post('/interface', settingsController.saveInterface);

router.get('/account', settingsController.showAccount);
router.post('/account', settingsController.updateAccount);
router.post('/account/backup', settingsController.createBackup);
router.get('/account/backup/:file', settingsController.downloadBackup);

module.exports = router;
