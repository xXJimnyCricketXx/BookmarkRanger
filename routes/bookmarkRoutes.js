const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmarkController');

router.get('/', bookmarkController.list);

router.post('/boards', bookmarkController.createBoard);
router.post('/boards/:id/delete', bookmarkController.deleteBoard);

router.post('/categories', bookmarkController.createCategory);
router.post('/categories/:id/delete', bookmarkController.deleteCategory);

router.get('/add', bookmarkController.showAddForm);
router.post('/', bookmarkController.create);

router.get('/:id/edit', bookmarkController.showEditForm);
router.post('/:id', bookmarkController.update);
router.post('/:id/delete', bookmarkController.delete);
router.post('/:id/pin', bookmarkController.togglePin);

module.exports = router;
