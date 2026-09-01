const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmarkController');

router.get('/', bookmarkController.list);
router.get('/boards/:id/panel', bookmarkController.boardPanel);

router.post('/boards', bookmarkController.createBoard);
router.post('/boards/:id/rename', bookmarkController.renameBoard);
router.post('/boards/:id/delete', bookmarkController.deleteBoard);

router.post('/categories', bookmarkController.createCategory);
router.post('/categories/:id/rename', bookmarkController.renameCategory);
router.post('/categories/:id/delete', bookmarkController.deleteCategory);
router.post('/categories/:id/pin', bookmarkController.togglePinCategory);
router.post('/categories/reorder', bookmarkController.reorderCategories);
router.post('/categories/reorder-pinned', bookmarkController.reorderPinnedCategories);
router.post('/reorder', bookmarkController.reorder);

router.get('/add', bookmarkController.showAddForm);
router.post('/', bookmarkController.create);

router.get('/:id/edit', bookmarkController.showEditForm);
router.post('/:id', bookmarkController.update);
router.post('/:id/delete', bookmarkController.delete);
router.post('/:id/pin', bookmarkController.togglePin);
router.post('/:id/move/:direction', bookmarkController.moveBookmark);

module.exports = router;
