const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const Diseases = [
  { diseaseType: 'Leaf mold', recommendation: 'Improve ventilation and reduce humidity.' },
  { diseaseType: 'Bacterial spot', recommendation: 'Remove infected leaves and avoid overhead watering.' },
  { diseaseType: 'Early blight', recommendation: 'Apply appropriate fungicide and rotate crops.' },
  { diseaseType: 'Powdery mildew', recommendation: 'Prune crowded areas and apply sulfur-based spray.' }
];

const fallbackPrediction = () => {
  const sample = Diseases[Math.floor(Math.random() * Diseases.length)];
  const confidence = Number((0.6 + Math.random() * 0.35).toFixed(2));
  const healthStatus = confidence > 0.7 ? 'Diseased' : 'Healthy';
  return {
    healthStatus,
    diseaseType: healthStatus === 'Healthy' ? 'None' : sample.diseaseType,
    confidence,
    recommendation:
      healthStatus === 'Healthy'
        ? 'ط.'
        : sample.recommendation
  };
};

const geminiKey = process.env.GEMINI_API_KEY;
console.log(geminiKey);
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
  "recommendation": "short action if healthy Plant say looks healthy. Keep monitoring and maintain regular care"
}
  if the photo uploaded not aleaf, respond with healthStatus "Unknown" and diseaseType "Not a leaf".
Only return JSON.`;

const isNonLeafPrediction = (prediction) => {
  if (!prediction) return true;
  const diseaseText = `${prediction.diseaseType || ''}`.toLowerCase();
  const statusText = `${prediction.healthStatus || ''}`.toLowerCase();
  const looksUnknown =
    diseaseText === 'unknown' ||
    diseaseText.includes('unknown') ||
    diseaseText.includes('not a leaf') ||
    diseaseText.includes('non leaf') ||
    statusText.includes('unknown');
  const veryLowConfidence =
    typeof prediction.confidence === 'number' && prediction.confidence >= 0 ? prediction.confidence < 0.15 : false;
  return looksUnknown || veryLowConfidence;
};

const validateLeafPrediction = (prediction) => {
  if (isNonLeafPrediction(prediction)) {
    const err = new Error('Unknown image. Please upload a valid leaf photo.');
    err.status = 400;
    throw err;
  }
  return prediction;
};

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

const plantDiseaseApiUrl =
  process.env.PLANT_DISEASE_API_URL || 'https://plant-disease-api-production-cb.up.railway.app/predict';

const callPlantDiseaseApi = async (filePath) => {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath), path.basename(filePath));

  console.info(`[ML] Plant disease API request ${plantDiseaseApiUrl}`);
  const { data } = await axios.post(plantDiseaseApiUrl, formData, {
    headers: formData.getHeaders(),
    timeout: 15000,
  });

  const predictedClass = data.predicted_class || 'Unknown';
  const healthStatus = predictedClass.toLowerCase().includes('healthy') ? 'Healthy' : 'Diseased';

  return {
    healthStatus,
    diseaseType: predictedClass,
    confidence: typeof data.confidence_score === 'number' ? data.confidence_score : 0.5,
    recommendation: data.recommended_action || 'Monitor the plant.'
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
    // Primary: dedicated plant disease API
    try {
      console.info('[ML] analyzeImage: attempting plant-disease API');
      const apiResult = await callPlantDiseaseApi(filePath);
      if (apiResult) return validateLeafPrediction(apiResult);
    } catch (apiErr) {
      console.warn('[ML] Plant API failed, will fallback to Gemini', apiErr.message);
    }

    // Fallback: Gemini
    console.info('[ML] analyzeImage: attempting Gemini path');
    const geminiResult = await callGemini(filePath);
    if (geminiResult) return validateLeafPrediction(geminiResult);

    // Optional secondary HTTP service
    const httpResult = await callHttpService(filePath);
    if (httpResult) return validateLeafPrediction(httpResult);

    // Keep the mock generator for local/dev, but do not silently fallback in production
    if (process.env.ALLOW_FALLBACK === 'true') {
      console.warn('[ML] analyzeImage: using fallbackPrediction()');
      return validateLeafPrediction(fallbackPrediction());
    }

    throw new Error(
      'ML service unavailable: configure PLANT_DISEASE_API_URL, GEMINI_API_KEY, or ML_SERVICE_URL.'
    );
  } catch (err) {
    console.warn('ML service failed', err.message);
    if (process.env.ALLOW_FALLBACK === 'true') {
      return validateLeafPrediction(fallbackPrediction());
    }
    throw err;
  }
};
