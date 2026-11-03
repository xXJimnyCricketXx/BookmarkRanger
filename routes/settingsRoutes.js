const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { validateId } = require('../middleware/validateId');

router.param('id', validateId);

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

router.get('/interface', settingsController.showInterface);
router.post('/interface', settingsController.saveInterface);

router.get('/weather', settingsController.showWeather);
router.post('/weather', settingsController.saveWeather);

router.get('/account', settingsController.showAccount);
router.post('/account', settingsController.updateAccount);

router.get('/app', settingsController.showApp);

router.get('/backups', settingsController.showBackups);
router.post('/backups', settingsController.createBackup);
router.post('/backups/settings', settingsController.saveBackupSettings);
router.post('/backups/upload', settingsController.uploadBackup);
router.get('/backups/:file', settingsController.downloadBackup);
router.post('/backups/:file/restore', settingsController.restoreBackup);
router.post('/backups/:file/delete', settingsController.deleteBackup);

module.exports = router;
