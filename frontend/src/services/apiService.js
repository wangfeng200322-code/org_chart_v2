import axios from 'axios';
import logger from './logger.js';

export const api = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
});

api.interceptors.request.use((config) => {
  logger.debug('API Request', {
    method: config.method,
    url: config.url,
    params: config.params,
    headers: config.headers
  });
  
  const key = sessionStorage.getItem('apiKey') || localStorage.getItem('apiKey') || getCookie('apiKey');
  if (key) config.headers['X-API-Key'] = key;
  return config;
});

api.interceptors.response.use(
  (response) => {
    logger.debug('API Response', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    logger.error('API Error', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      requestData: error.config?.data
    });
    return Promise.reject(error);
  }
);

export const apiService = {
  searchEmployees: (q) => {
    logger.info('Searching employees', { query: q });
    return api.get('/employees/search', { params: { q } })
      .then((r) => {
        logger.debug('Employee search response', { 
          resultCount: r.data?.data?.length,
          fullResponse: r.data 
        });
        return r.data.data; // Extract data from { success: true, data: [...] }
      });
  },
  getEmployeeDetails: (email) => api.get(`/employees/${encodeURIComponent(email)}`).then((r) => r.data.data),
  getOrgChart: (email) => {
    logger.info('Fetching org chart', { email });
    return api.get('/org-chart', { params: { email } })
      .then((r) => {
        logger.debug('Org chart response', { 
          nodeCount: r.data?.data?.nodes?.length,
          edgeCount: r.data?.data?.edges?.length,
          fullResponse: r.data 
        });
        return r.data.data; // Extract data from { success: true, data: { nodes: [...], edges: [...] } }
      });
  },
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
