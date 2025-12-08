# Plant Disease API - Deployment Guide

## Docker Hub Repository
**Image:** `mohamedh782/plant-disease-api:latest`

**Docker Hub URL:** https://hub.docker.com/r/mohamedh782/plant-disease-api

---

## For Web Developers

### How to Run the API

Anyone can pull and run this container from anywhere with Docker installed:

```bash
docker pull mohamedh782/plant-disease-api:latest
docker run -d -p 5000:5000 --name plant-api mohamedh782/plant-disease-api:latest
```

This will start the API on port 5000.

---

## API Documentation

### Endpoint
**POST** `/predict`

### Request Format
- **Content-Type:** `multipart/form-data`
- **Parameter:** `file` (image file - JPG, JPEG, PNG)

### Example Request (cURL)
```bash
curl -X POST -F "file=@/path/to/plant_image.jpg" http://localhost:5000/predict
```

### Example Request (JavaScript - Fetch API)
```javascript
const formData = new FormData();
formData.append('file', imageFile); // imageFile is a File object

fetch('http://YOUR_SERVER_IP:5000/predict', {
    method: 'POST',
    body: formData
})
.then(response => response.json())
.then(data => {
    console.log('Predicted Class:', data.predicted_class);
    console.log('Confidence Score:', data.confidence_score);
    console.log('Recommended Action:', data.recommended_action);
})
.catch(error => console.error('Error:', error));
```

### Example Request (Python)
```python
import requests

url = 'http://localhost:5000/predict'
files = {'file': open('plant_image.jpg', 'rb')}
response = requests.post(url, files=files)
print(response.json())
```

### Response Format (JSON)
```json
{
    "predicted_class": "Early_blight",
    "recommended_action": "Apply fungicide and remove affected leaves.",
    "confidence_score": 0.95
}
```

### Response Fields
- **predicted_class** (string): The detected disease or "healthy"
- **recommended_action** (string): Treatment recommendation for the plant
- **confidence_score** (float): Model confidence (0.0 to 1.0)

### Supported Disease Classes
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

## Deployment Options

### Option 1: Local Server
Run on any server with Docker:
```bash
docker run -d -p 5000:5000 --restart unless-stopped mohamedh782/plant-disease-api:latest
```

### Option 2: Cloud Platforms

#### AWS EC2
1. Launch an EC2 instance
2. Install Docker
3. Run: `docker run -d -p 5000:5000 mohamedh782/plant-disease-api:latest`
4. Configure security group to allow port 5000

#### Google Cloud Run
```bash
gcloud run deploy plant-disease-api \
  --image mohamedh782/plant-disease-api:latest \
  --platform managed \
  --port 5000 \
  --allow-unauthenticated
```

#### Azure Container Instances
```bash
az container create \
  --resource-group myResourceGroup \
  --name plant-disease-api \
  --image mohamedh782/plant-disease-api:latest \
  --ports 5000 \
  --dns-name-label plant-disease-api
```

#### DigitalOcean
1. Create a Droplet
2. Install Docker
3. Run: `docker run -d -p 5000:5000 mohamedh782/plant-disease-api:latest`

---

## Testing the API

### Health Check
```bash
curl http://localhost:5000/predict
# Should return 405 Method Not Allowed (POST required)
```

### With Test Image
```bash
curl -X POST -F "file=@test_image.jpg" http://localhost:5000/predict
```

---

## Important Notes

1. **Port:** The API runs on port 5000 by default
2. **Image Size:** The container is ~2.5GB (includes TensorFlow and the trained model)
3. **Memory:** Recommended minimum 2GB RAM
4. **CPU:** Works on CPU (no GPU required)
5. **CORS:** If accessing from a web browser, you may need to add CORS headers

---

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker logs <container_id>
```

### Port Already in Use
```bash
# Use a different port
docker run -d -p 8080:5000 mohamedh782/plant-disease-api:latest
# API will be available at http://localhost:8080/predict
```

### Stop/Remove Container
```bash
docker stop plant-api
docker rm plant-api
```

---

## Contact
For issues or questions, contact the development team.
