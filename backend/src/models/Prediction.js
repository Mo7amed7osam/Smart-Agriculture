const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    imageUrl: { type: String, required: true },
    healthStatus: { type: String, enum: ['Healthy', 'Diseased'], required: true },
    diseaseType: { type: String, required: true },
    confidence: { type: Number, min: 0, max: 1, required: true },
    recommendation: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Prediction', predictionSchema);
