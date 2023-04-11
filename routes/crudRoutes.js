const express = require('express');
const router = express.Router();
const DatabaseController = require('../controllers/DatabaseController');

// API endpoints for CRUD operations
router.post('/create', DatabaseController.create);
router.patch('/update', DatabaseController.update);
router.delete('/delete', DatabaseController.delete);

// TODO: make endpoints for changing isolation levels

module.exports = router;