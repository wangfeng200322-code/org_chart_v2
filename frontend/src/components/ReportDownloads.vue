<template>
  <div class="report-downloads">
    <h2>Download Reports</h2>
    
    <div v-if="loading" class="loading">
      Loading reports...
    </div>
    
    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div v-else-if="reports.length === 0" class="no-reports">
      No reports available
    </div>
    
    <div v-else class="reports-list">
      <div v-for="report in reports" :key="report.name" class="report-item">
        <div class="report-info">
          <h3>{{ report.name }}</h3>
          <p class="report-meta">
            Size: {{ formatFileSize(report.size) }} • 
            Modified: {{ formatDate(report.modified) }}
          </p>
        </div>
        <a 
          :href="getDownloadUrl(report.name)" 
          class="download-button"
          download
        >
          Download
        </a>
      </div>
    </div>
    
    <button @click="refreshReports" class="refresh-button">
      Refresh
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { apiService } from '../services/apiService.js';

const reports = ref([]);
const loading = ref(false);
const error = ref(null);

async function fetchReports() {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await apiService.getReports();
    reports.value = response.reports || [];
  } catch (err) {
    error.value = 'Failed to load reports';
    console.error('Error fetching reports:', err);
  } finally {
    loading.value = false;
  }
}

function getDownloadUrl(filename) {
  return `${apiService.baseURL}/reports/${filename}`;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString();
}

function refreshReports() {
  fetchReports();
}

onMounted(() => {
  fetchReports();
});
</script>

<style scoped>
.report-downloads {
  max-width: 800px;
  margin: 0 auto;
}

h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.loading, .no-reports {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error-message {
  padding: 1rem;
  background: #fee;
  color: #c33;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.reports-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.report-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
}

.report-item:last-child {
  border-bottom: none;
}

.report-info h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.report-meta {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.download-button {
  background: #3498db;
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: bold;
  transition: background 0.3s;
}

.download-button:hover {
  background: #2980b9;
}

.refresh-button {
  margin-top: 1rem;
  background: #95a5a6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.refresh-button:hover {
  background: #7f8c8d;
}
</style>