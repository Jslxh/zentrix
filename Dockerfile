# Use official Python 3.12 slim image
FROM python:3.12-slim

# Set system environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

# Set working directory
WORKDIR /app

# Install system dependencies required for OpenCV and YOLO
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*


# Copy requirements file first to utilize Docker layer caching
COPY requirements.txt .

# Install python dependencies (Pre-install CPU-only PyTorch to bypass CUDA packages)
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir torch==2.4.0 torchvision==0.19.0 --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application files
COPY . .

# Create directory structure for uploads and static outputs
RUN mkdir -p static/uploads static/processed

# Expose port for Flask backend (8000)
EXPOSE 8000

# Default command to run the backend Flask server
CMD ["python", "app.py"]

