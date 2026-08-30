const express = require('express');
const router = express.Router();
const snippetController = require('../controllers/snippetController');

router.get('/', snippetController.list);
router.get('/add', snippetController.showAddForm);
router.post('/', snippetController.create);

router.get('/:id', snippetController.detail);
router.get('/:id/edit', snippetController.showEditForm);
router.post('/:id', snippetController.update);
router.post('/:id/delete', snippetController.delete);
router.post('/:id/pin', snippetController.togglePin);

module.exports = router;
