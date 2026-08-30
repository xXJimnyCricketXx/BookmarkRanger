const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

router.get('/', (req, res) => res.redirect(`${res.locals.baseUrl}/settings/theme`));

router.post('/update-theme', settingsController.updateDarkMode);

router.get('/theme', settingsController.showTheme);
router.post('/theme', settingsController.saveTheme);

router.get('/general', settingsController.showGeneral);
router.post('/general', settingsController.saveGeneral);

router.get('/interface', settingsController.showInterface);
router.post('/interface', settingsController.saveInterface);

router.get('/account', settingsController.showAccount);
router.post('/account', settingsController.updateAccount);
router.post('/account/backup', settingsController.createBackup);
router.get('/account/backup/:file', settingsController.downloadBackup);

module.exports = router;
