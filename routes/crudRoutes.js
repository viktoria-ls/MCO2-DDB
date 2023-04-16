const express = require('express');
const router = express.Router();
const DatabaseController = require('../controllers/DatabaseController');

// API endpoints for CRUD operations
router.post('/create', DatabaseController.create);
router.get('/readOne', DatabaseController.readOne);
router.patch('/update', DatabaseController.update);
router.delete('/delete', DatabaseController.delete);

// API endpoint for getting max IDs
router.get('/maxId/:table/:isolation', DatabaseController.maxId);

// API endpoint for getting report data
router.get('/report1/:table/:isolation', DatabaseController.report1);
router.get('/report2/:table/:isolation', DatabaseController.report2);
router.get('/report3/:table/:isolation', DatabaseController.report3);

module.exports = router;