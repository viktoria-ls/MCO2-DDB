const express = require('express');
const router = express.Router();
const MainController = require('../controllers/MainController');

// API endpoints for getting info from appropriate nodes and rendering pages
router.get('/', MainController.getIndex);
router.get('/node1', MainController.getCentralNode);
router.get('/node2', MainController.getNode2);
router.get('/node3', MainController.getNode3);

// API endpoints for transactions
//router.post('/updateMovie', MainController.updateMovie);
router.post('/deleteMovie', MainController.deleteMovie);

module.exports = router;