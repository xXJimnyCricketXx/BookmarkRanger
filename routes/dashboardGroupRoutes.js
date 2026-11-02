const express = require('express');
const router = express.Router();
const dashboardGroupController = require('../controllers/dashboardGroupController');
const { validateId } = require('../middleware/validateId');

router.param('id', validateId);
router.param('bookmarkId', validateId);

router.post('/', dashboardGroupController.create);
router.post('/reorder', dashboardGroupController.reorderGroups);
router.post('/members/reorder', dashboardGroupController.reorderMembers);
router.post('/:id/bookmarks', dashboardGroupController.addBookmark);
router.post('/:id/rename', dashboardGroupController.rename);
router.post('/:id/delete', dashboardGroupController.delete);
router.post('/bookmarks/:bookmarkId/remove', dashboardGroupController.removeBookmark);

module.exports = router;
