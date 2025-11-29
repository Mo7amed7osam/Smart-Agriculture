const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { createPrediction, getPredictions } = require('../controllers/predictionController');

const router = express.Router();

router.post('/', authMiddleware, upload.single('image'), createPrediction);
router.get('/', authMiddleware, getPredictions);

module.exports = router;
