from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
import os

app = Flask(__name__)

# Load the model
model = load_model('plant_disease_model.keras')  # Ensure this path is correct

# Define class indices (class mapping)
class_indices = {
    0: {'predicted_class': 'Bacterial_spot', 'recommended_action': 'Apply antibacterial treatment and remove infected leaves.'},
    1: {'predicted_class': 'healthy', 'recommended_action': 'No action needed.'},
    2: {'predicted_class': 'Early_blight', 'recommended_action': 'Apply fungicide and remove affected leaves.'},
    3: {'predicted_class': 'Late_blight', 'recommended_action': 'Apply fungicide and remove affected leaves.'},
    4: {'predicted_class': 'healthy', 'recommended_action': 'No action needed.'},
    5: {'predicted_class': 'Bacterial_spot', 'recommended_action': 'Apply antibacterial treatment and remove infected leaves.'},
    6: {'predicted_class': 'Early_blight', 'recommended_action': 'Apply fungicide and remove affected leaves.'},
    7: {'predicted_class': 'Late_blight', 'recommended_action': 'Apply fungicide and remove affected leaves.'},
    8: {'predicted_class': 'Leaf_Mold', 'recommended_action': 'Remove infected leaves and apply fungicide.'},
    9: {'predicted_class': 'Septoria_leaf_spot', 'recommended_action': 'Apply fungicide and remove affected leaves.'},
    10: {'predicted_class': 'Spider_mites_Two_spotted_spider_mite', 'recommended_action': 'Apply pesticide and remove infected leaves.'},
    11: {'predicted_class': 'Target_Spot', 'recommended_action': 'Apply fungicide and remove affected leaves.'},
    12: {'predicted_class': 'YellowLeaf__Curl_Virus', 'recommended_action': 'No cure available, remove infected plant.'},
    13: {'predicted_class': 'mosaic_virus', 'recommended_action': 'No cure available, remove infected plant.'},
    14: {'predicted_class': 'healthy', 'recommended_action': 'No action needed.'}
}



def load_and_predict_image(img_path):
    img = image.load_img(img_path, target_size=(224, 224))
    img_array = image.img_to_array(img)
    img_array = img_array / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    prediction = model.predict(img_array)
    
    
    predicted_class_index = np.argmax(prediction, axis=1)[0]
    
   
    confidence_score = prediction[0][predicted_class_index]
    
    predicted_class_name = class_indices[predicted_class_index]['predicted_class']
    recommended_action = class_indices[predicted_class_index]['recommended_action']
    
    return predicted_class_name, recommended_action, confidence_score


# Endpoint for prediction
@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Save the uploaded image temporarily
    img_path = 'uploaded_image.jpg'
    file.save(img_path)

    # Make prediction
    predicted_class, recommended_action, confidence_score = load_and_predict_image(img_path)

    # Return prediction result along with recommended action and confidence score
    return jsonify({
        'predicted_class': predicted_class,
        'recommended_action': recommended_action,
        'confidence_score': float(confidence_score)
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
