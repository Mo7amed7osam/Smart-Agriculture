# # Use an official TensorFlow runtime as the base image
# FROM tensorflow/tensorflow:2.10.0-py3

# Use an official TensorFlow runtime as the base image (replace with available tag)
FROM tensorflow/tensorflow


# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir --ignore-installed blinker -r requirements.txt

# Expose the port the app will run on
EXPOSE 5000

# Run app.py when the container launches
CMD ["python", "app.py"]
