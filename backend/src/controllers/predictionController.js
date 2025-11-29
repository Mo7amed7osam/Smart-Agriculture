const path = require('path');
const Prediction = require('../models/Prediction');
const mlService = require('../services/mlService');

exports.createPrediction = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image file' });
    }

    const analysis = await mlService.analyzeImage(req.file.path);
    const imageUrl = `/uploads/${path.basename(req.file.path)}`;

    const prediction = await Prediction.create({
      user: req.user.id,
      imageUrl,
      healthStatus: analysis.healthStatus,
      diseaseType: analysis.diseaseType,
      confidence: analysis.confidence,
      recommendation: analysis.recommendation
    });

    res.status(201).json(prediction);
  } catch (err) {
    next(err);
  }
};

exports.getPredictions = async (req, res, next) => {
  try {
    const predictions = await Prediction.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(predictions);
  } catch (err) {
    next(err);
  }
};
