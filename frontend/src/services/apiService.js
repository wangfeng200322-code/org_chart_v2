import axios from 'axios';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api' });

function getApiKey() {
  return sessionStorage.getItem('apiKey') || localStorage.getItem('apiKey') || getCookie('apiKey');
}

api.interceptors.request.use((config) => {
  const key = getApiKey();
  if (key) config.headers['X-API-Key'] = key;
  return config;
});

export const apiService = {
  searchEmployees: (q) => api.get('/employees/search', { params: { q } }).then((r) => r.data),
  getEmployeeDetails: (email) => api.get(`/employees/${encodeURIComponent(email)}`).then((r) => r.data),
  getOrgChart: (email) => api.get('/org-chart', { params: { email } }).then((r) => r.data),
  uploadCSV: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/upload/csv', form).then((r) => r.data);
  }
};

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}