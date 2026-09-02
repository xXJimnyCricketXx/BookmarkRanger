const express = require('express');
const router = express.Router();
const sharePageController = require('../controllers/sharePageController');

router.get('/', sharePageController.list);
router.post('/', sharePageController.create);
router.post('/:id/rename', sharePageController.rename);
router.post('/:id/delete', sharePageController.delete);
router.post('/:id/categories/:categoryId/remove', sharePageController.removeCategory);
router.post('/:id/snippets/:snippetId/remove', sharePageController.removeSnippet);
router.post('/items/:type/:id', sharePageController.updateItemSharing);

module.exports = router;
