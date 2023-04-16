const express = require('express');
const router = express.Router();
const DatabaseController = require('../controllers/DatabaseController');

// API endpoints for CRUD operations
router.post('/create', DatabaseController.create);
router.patch('/update', DatabaseController.update);
router.delete('/delete', DatabaseController.delete);

router.get('/search/:searchQuery/:isolation', DatabaseController.search);
router.get('/search/:searchQuery/:table/:isolation', DatabaseController.searchFromNode);

// API endpoint for getting max IDs
router.get('/maxId/:table/:isolation', DatabaseController.maxId);

// API endpoint for getting report data
router.get('/report1/:isolation', DatabaseController.report1);
router.get('/report1/:table/:isolation', DatabaseController.report1FromNode);

router.get('/report2/:table/:isolation', DatabaseController.report2);
router.get('/report2/:table/:isolation', DatabaseController.report2FromNode);

router.get('/report3/:table/:isolation', DatabaseController.report3);
router.get('/report3/:table/:isolation', DatabaseController.report3FromNode);

module.exports = router;