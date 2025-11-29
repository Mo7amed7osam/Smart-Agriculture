const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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

// Gemini client
const geminiKey = process.env.GEMINI_API_KEY;
const geminiModelName = 'gemini-1.5-flash'; // or gemini-1.5-pro if you prefer
const prompt = `You are a plant disease detector. Given a leaf photo, respond with JSON:
{
  "healthStatus": "Healthy" or "Diseased",
  "diseaseType": "short name",
  "confidence": number 0-1,
  "recommendation": "short action"
}
Only return JSON.`;

const callGemini = async (filePath) => {
  if (!geminiKey) return null;

  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: geminiModelName });

  const imageData = fs.readFileSync(filePath).toString('base64');
  const mimeType = 'image/jpeg'; // adjust if you normalize to png

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: imageData,
        mimeType
      }
    }
  ]);

  const text = result?.response?.text?.() || '';
  const parsed = JSON.parse(text);
  return {
    healthStatus: parsed.healthStatus || 'Healthy',
    diseaseType: parsed.diseaseType || 'Unknown',
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
    recommendation: parsed.recommendation || 'Monitor the plant.'
  };
};

// Optional external ML service via URL remains supported
const callHttpService = async (filePath) => {
  const url = process.env.ML_SERVICE_URL;
  if (!url) return null;
  const imageData = fs.readFileSync(filePath, { encoding: 'base64' });
  const payload = { image: imageData, filename: path.basename(filePath) };
  const { data } = await axios.post(url, payload, { timeout: 10000 });
  return {
    healthStatus: data.healthStatus || 'Healthy',
    diseaseType: data.diseaseType || 'Unknown',
    confidence: typeof data.confidence === 'number' ? data.confidence : 0.5,
    recommendation: data.recommendation || 'Monitor the plant and apply best practices.'
  };
};

exports.analyzeImage = async (filePath) => {
  try {
    // Prefer Gemini if key is present
    const geminiResult = await callGemini(filePath);
    if (geminiResult) return geminiResult;

    // Otherwise optional HTTP service
    const httpResult = await callHttpService(filePath);
    if (httpResult) return httpResult;
  } catch (err) {
    console.warn('ML service failed, using mock prediction', err.message);
  }
  return fallbackPrediction();
};
