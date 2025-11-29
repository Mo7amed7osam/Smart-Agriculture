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
// Allow overrides via env; defaults to models your key actually lists (2.5 family)
const geminiModelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const geminiModelFallback = process.env.GEMINI_MODEL_FALLBACK || 'gemini-2.5-pro';
const geminiTextMode = process.env.GEMINI_TEXT_MODE === 'true';
const geminiTextQuery =
  process.env.GEMINI_TEXT_QUERY ||
  'Give concise plant health and disease-prevention tips. Return JSON with keys healthStatus, diseaseType, confidence, recommendation.';
const prompt = `You are a plant disease detector. Given a leaf photo, respond with JSON:
{
  "healthStatus": "Healthy" or "Diseased",
  "diseaseType": "short name",
  "confidence": number 0-1,
  "recommendation": "short action"
}
Only return JSON.`;

const parseGeminiResponse = (text) => {
  if (!text) throw new Error('Empty Gemini response');

  const extractJson = (raw) => {
    // Prefer fenced code blocks if present
    const fenced = raw.match(/```(?:json)?\\s*([\\s\\S]*?)```/i);
    if (fenced && fenced[1]) return fenced[1];
    // Otherwise trim to first/last brace
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return raw.slice(start, end + 1);
    }
    return raw;
  };

  const cleaned = extractJson(text).trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Gemini JSON parse failed: ${err.message}`);
  }
  return {
    healthStatus: parsed.healthStatus || 'Healthy',
    diseaseType: parsed.diseaseType || 'Unknown',
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
    recommendation: parsed.recommendation || 'Monitor the plant.'
  };
};

const callGemini = async (filePath) => {
  if (!geminiKey) return null;
  const genAI = new GoogleGenerativeAI(geminiKey);

  const imageData = geminiTextMode ? null : fs.readFileSync(filePath).toString('base64');
  const mimeType = 'image/jpeg'; // adjust if you normalize to png

  const tryModel = async (modelName, apiVersion) => {
    const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion });
    console.info(
      `[ML] Gemini request starting model=${modelName} apiVersion=${apiVersion} textMode=${geminiTextMode}`
    );
    const parts = geminiTextMode
      ? [prompt, geminiTextQuery]
      : [
          prompt,
          {
            inlineData: {
              data: imageData,
              mimeType
            }
          }
        ];
    const result = await model.generateContent(parts);
    const text = result?.response?.text?.() || '';
    console.info(`[ML] Gemini response model=${modelName} apiVersion=${apiVersion} textLength=${text.length}`);
    return parseGeminiResponse(text);
  };

  const modelsToTry = [
    geminiModelName,
    geminiModelFallback,
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.5-pro-preview-06-05',
    'gemini-2.5-pro-preview-05-06',
    'gemini-2.5-pro-preview-03-25',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash-lite-001',
    'gemini-flash-latest',
    'gemini-pro-latest'
  ].filter(Boolean);
  const apiVersions = ['v1', 'v1beta'];
  const errors = [];

  for (const apiVersion of apiVersions) {
    for (const modelName of modelsToTry) {
      try {
        return await tryModel(modelName, apiVersion);
      } catch (err) {
        const status = err?.status || err?.response?.status;
        const message = err?.message || 'Unknown Gemini error';
        console.warn(`[ML] Gemini error model=${modelName} apiVersion=${apiVersion}`, { status, message });
        errors.push(`${modelName}(${apiVersion}): ${message}`);
        // 404 means bad model name/version; keep trying others
        if (status && status !== 404) throw err;
      }
    }
  }

  throw new Error(`Gemini call failed (${errors.join('; ')})`);
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
    console.info('[ML] analyzeImage: attempting Gemini path');
    const geminiResult = await callGemini(filePath);
    if (geminiResult) return geminiResult;

    // Otherwise optional HTTP service
    const httpResult = await callHttpService(filePath);
    if (httpResult) return httpResult;

    // Keep the mock generator for local/dev, but do not silently fallback in production
    if (process.env.ALLOW_FALLBACK === 'true') {
      console.warn('[ML] analyzeImage: using fallbackPrediction()');
      return fallbackPrediction();
    }

    throw new Error('ML service unavailable: configure GEMINI_API_KEY or ML_SERVICE_URL.');
  } catch (err) {
    console.warn('ML service failed', err.message);
    if (process.env.ALLOW_FALLBACK === 'true') {
      return fallbackPrediction();
    }
    throw err;
  }
};
