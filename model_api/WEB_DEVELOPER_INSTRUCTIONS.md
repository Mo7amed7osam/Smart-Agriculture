# Plant Disease API - Integration Guide for Web Developer

## API Endpoint
**Base URL:** `https://plant-disease-api-production-31cb.up.railway.app`

**Prediction Endpoint:** `POST https://plant-disease-api-production-31cb.up.railway.app/predict`

---

## How to Use

### Request Format
- **Method:** POST
- **Content-Type:** multipart/form-data
- **Body:** File upload with field name `file`
- **Supported formats:** JPG, JPEG, PNG

### Response Format (JSON)
```json
{
    "predicted_class": "Early_blight",
    "recommended_action": "Apply fungicide and remove affected leaves.",
    "confidence_score": 0.95
}
```

---

## Integration Code Examples

### 1. HTML Form (Simple Example)
```html
<!DOCTYPE html>
<html>
<head>
    <title>Plant Disease Detector</title>
</head>
<body>
    <h1>Upload Plant Image</h1>
    <input type="file" id="imageInput" accept="image/*">
    <button onclick="uploadImage()">Check Disease</button>
    
    <div id="result"></div>

    <script>
        async function uploadImage() {
            const fileInput = document.getElementById('imageInput');
            const file = fileInput.files[0];
            
            if (!file) {
                alert('Please select an image');
                return;
            }

            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('https://plant-disease-api-production-31cb.up.railway.app/predict', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();
                
                document.getElementById('result').innerHTML = `
                    <h2>Results:</h2>
                    <p><strong>Disease:</strong> ${data.predicted_class}</p>
                    <p><strong>Confidence:</strong> ${(data.confidence_score * 100).toFixed(2)}%</p>
                    <p><strong>Recommendation:</strong> ${data.recommended_action}</p>
                `;
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to analyze image');
            }
        }
    </script>
</body>
</html>
```

### 2. React Component
```javascript
import React, { useState } from 'react';

function PlantDiseaseDetector() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(
                'https://plant-disease-api-production-31cb.up.railway.app/predict',
                {
                    method: 'POST',
                    body: formData
                }
            );

            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to analyze image');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Plant Disease Detector</h1>
            <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                disabled={loading}
            />
            
            {loading && <p>Analyzing image...</p>}
            
            {result && (
                <div>
                    <h2>Results:</h2>
                    <p><strong>Disease:</strong> {result.predicted_class}</p>
                    <p><strong>Confidence:</strong> {(result.confidence_score * 100).toFixed(2)}%</p>
                    <p><strong>Recommendation:</strong> {result.recommended_action}</p>
                </div>
            )}
        </div>
    );
}

export default PlantDiseaseDetector;
```

### 3. Next.js (Vercel) - API Route
```javascript
// pages/api/predict.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const formData = new FormData();
        formData.append('file', req.body.file);

        const response = await fetch(
            'https://plant-disease-api-production-31cb.up.railway.app/predict',
            {
                method: 'POST',
                body: formData
            }
        );

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to analyze image' });
    }
}
```

### 4. Next.js Client Component
```javascript
'use client';
import { useState } from 'react';

export default function PlantDetector() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.target);

        try {
            const response = await fetch(
                'https://plant-disease-api-production-31cb.up.railway.app/predict',
                {
                    method: 'POST',
                    body: formData
                }
            );

            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <input type="file" name="file" accept="image/*" required />
                <button type="submit" disabled={loading}>
                    {loading ? 'Analyzing...' : 'Analyze Plant'}
                </button>
            </form>

            {result && (
                <div>
                    <h3>Disease: {result.predicted_class}</h3>
                    <p>Confidence: {(result.confidence_score * 100).toFixed(2)}%</p>
                    <p>{result.recommended_action}</p>
                </div>
            )}
        </div>
    );
}
```

---

## Testing the API

### Using cURL
```bash
curl -X POST -F "file=@plant_image.jpg" https://plant-disease-api-production-31cb.up.railway.app/predict
```

### Using Postman
1. Create new request
2. Method: POST
3. URL: `https://plant-disease-api-production-31cb.up.railway.app/predict`
4. Body → form-data
5. Key: `file` (type: File)
6. Value: Select your image file
7. Send

---

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `predicted_class` | string | The detected disease name or "healthy" |
| `confidence_score` | float | Model confidence (0.0 to 1.0) |
| `recommended_action` | string | Treatment recommendation |

---

## Possible Disease Classes

- Bacterial_spot
- Early_blight
- Late_blight
- Leaf_Mold
- Septoria_leaf_spot
- Spider_mites_Two_spotted_spider_mite
- Target_Spot
- YellowLeaf__Curl_Virus
- mosaic_virus
- healthy

---

## Error Handling

### Common Errors

**400 Bad Request**
```json
{
    "error": "No file part"
}
```
or
```json
{
    "error": "No selected file"
}
```

**500 Internal Server Error**
- Server issue or model loading problem
- Retry the request

### Error Handling Example
```javascript
try {
    const response = await fetch(API_URL, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // Handle success
} catch (error) {
    console.error('Error:', error);
    // Show error message to user
}
```

---

## CORS (Cross-Origin Resource Sharing)

The API should work from any domain. If you encounter CORS issues, please contact the API administrator.

---

## Important Notes

1. **Image Size:** Keep images under 10MB for best performance
2. **Response Time:** First request may take 10-15 seconds (cold start), subsequent requests are faster
3. **Image Quality:** Better quality images = more accurate predictions
4. **Supported Plants:** The model is trained on tomato plant diseases

---

## Support

For any issues or questions, contact the development team.

**API Status:** https://plant-disease-api-production-31cb.up.railway.app/
