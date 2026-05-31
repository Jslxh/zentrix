import axios from 'axios';

// Get API URL dynamically, defaulting to localhost:8000
const API_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`;

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 600000, // Large timeout for video inference processing (10 mins)
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export const getStats = async () => {
  const response = await apiClient.get('/stats');
  return response.data;
};

export const predictRisk = async (payload) => {
  const response = await apiClient.post('/predict-risk', payload);
  return response.data;
};

export const detectImage = async (formData) => {
  const response = await apiClient.post('/detect-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const detectVideo = async (formData, onUploadProgress) => {
  const response = await apiClient.post('/detect-video', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
  return response.data;
};

export const getWebcamStatus = async () => {
  const response = await apiClient.get('/webcam-status');
  return response.data;
};

export const getWebcamTelemetry = async () => {
  const response = await apiClient.get('/webcam-telemetry');
  return response.data;
};

export const connectCamera = async (source) => {
  const response = await apiClient.post('/connect-camera', { source });
  return response.data;
};

export default apiClient;
