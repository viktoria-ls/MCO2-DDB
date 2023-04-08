const express = require('express');
const router = express.Router();
const MainController = require('./controllers/MainController');

router.get('/', MainController.getIndex);
router.get('/sample', MainController.sampleQuery);

module.exports = router;