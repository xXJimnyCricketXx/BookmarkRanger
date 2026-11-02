const express = require('express');
const router = express.Router();
const sharePageController = require('../controllers/sharePageController');
const { validateId } = require('../middleware/validateId');

router.param('id', validateId);
router.param('categoryId', validateId);
router.param('snippetId', validateId);

router.get('/', sharePageController.list);
router.post('/', sharePageController.create);
router.post('/:id/rename', sharePageController.rename);
router.post('/:id/delete', sharePageController.delete);
router.post('/:id/categories/:categoryId/remove', sharePageController.removeCategory);
router.post('/:id/snippets/:snippetId/remove', sharePageController.removeSnippet);
router.post('/items/:type/:id', sharePageController.updateItemSharing);

module.exports = router;
