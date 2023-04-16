const express = require('express');
const router = express.Router();
const MainController = require('../controllers/MainController');

router.get('/testing', (req, res) => {
    res.send({msg: "Please god work"});
});

// API endpoints for getting info from appropriate nodes and rendering pages
router.get('/', MainController.getIndex);
router.get('/node1', MainController.getCentralNode);
router.get('/node2', MainController.getNode2);
router.get('/node3', MainController.getNode3);

// API endpoints for transactions
router.post('/updateMovie', MainController.updateMovie);
router.post('/createMovie', MainController.createMovie)
router.post('/deleteMovie', MainController.deleteMovie);

router.get('/search/:searchQuery/:isolation', MainController.searchMovie);

// API endpoints for reports
router.get('/report1/:isolation', MainController.report1);
router.get('/report2/:isolation', MainController.report2);
router.get('/report3/:isolation', MainController.report3);

module.exports = router;