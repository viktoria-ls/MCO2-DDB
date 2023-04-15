const express = require('express');
const router = express.Router();
const MainController = require('../controllers/MainController');

// API endpoints for getting info from appropriate nodes and rendering pages
router.get('/', MainController.getIndex);
router.get('/node1', MainController.getCentralNode);
router.get('/node2', MainController.getNode2);
router.get('/node3', MainController.getNode3);

// API endpoints for transactions
router.post('/updateMovie', MainController.updateMovie);
router.post('/createMovie', MainController.createMovie)
router.post('/deleteMovie', MainController.deleteMovie);

// API endpoints for reports
router.get('/report1', MainController.report1);
router.get('/report2', MainController.report2);
router.get('/report3', MainController.report3);

module.exports = router;