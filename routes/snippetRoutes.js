const express = require('express');
const router = express.Router();
const snippetController = require('../controllers/snippetController');
const { validateId } = require('../middleware/validateId');

router.param('id', validateId);

router.get('/', snippetController.list);
router.get('/add', snippetController.showAddForm);
router.post('/', snippetController.create);
router.post('/reorder', snippetController.reorder);

router.get('/:id', snippetController.detail);
router.get('/:id/raw', snippetController.raw);
router.get('/:id/edit', snippetController.showEditForm);
router.post('/:id', snippetController.update);
router.post('/:id/delete', snippetController.delete);
router.post('/:id/pin', snippetController.togglePin);

module.exports = router;
