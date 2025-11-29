const fs = require('fs');
const path = require('path');
const axios = require('axios');

const mockDiseases = [
  { diseaseType: 'Leaf mold', recommendation: 'Improve ventilation and reduce humidity.' },
  { diseaseType: 'Bacterial spot', recommendation: 'Remove infected leaves and avoid overhead watering.' },
  { diseaseType: 'Early blight', recommendation: 'Apply appropriate fungicide and rotate crops.' },
  { diseaseType: 'Powdery mildew', recommendation: 'Prune crowded areas and apply sulfur-based spray.' }
];

const fallbackPrediction = () => {
  const sample = mockDiseases[Math.floor(Math.random() * mockDiseases.length)];
  const confidence = Number((0.6 + Math.random() * 0.35).toFixed(2));
  const healthStatus = confidence > 0.7 ? 'Diseased' : 'Healthy';
  return {
    healthStatus,
    diseaseType: healthStatus === 'Healthy' ? 'None' : sample.diseaseType,
    confidence,
    recommendation:
      healthStatus === 'Healthy'
        ? 'Plant looks healthy. Keep monitoring and maintain regular care.'
        : sample.recommendation
  };
};

exports.analyzeImage = async (filePath) => {
  const url = process.env.ML_SERVICE_URL;
  if (!url) {
    return fallbackPrediction();
  }

  try {
    const imageData = fs.readFileSync(filePath, { encoding: 'base64' });
    const payload = { image: imageData, filename: path.basename(filePath) };
    const { data } = await axios.post(url, payload, { timeout: 10000 });

    return {
      healthStatus: data.healthStatus || 'Healthy',
      diseaseType: data.diseaseType || 'Unknown',
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.5,
      recommendation: data.recommendation || 'Monitor the plant and apply best practices.'
    };
  } catch (err) {
    console.warn('ML service unreachable, using mock prediction', err.message);
    return fallbackPrediction();
  }
};
