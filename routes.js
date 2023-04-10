const express = require('express');
const router = express.Router();
const MainController = require('./controllers/MainController');

router.get('/', MainController.getIndex);
router.get('/node1', MainController.getCentralNode);
router.get('/node2', MainController.getNode2);
router.get('/node3', MainController.getNode3);
router.get('/sample', MainController.sampleQuery);

module.exports = router;