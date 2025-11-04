<template>
  <div class="csv-upload">
    <h1>Upload Employee CSV</h1>
    
    <div class="upload-section">
      <div class="upload-box">
        <input
          type="file"
          ref="fileInput"
          @change="handleFileSelect"
          accept=".csv"
          style="display: none"
        />
        <button @click="fileInput?.click()" class="select-file-button">
          Choose CSV File
        </button>
        <span v-if="selectedFile" class="file-name">{{ selectedFile.name }}</span>
      </div>

      <button 
        @click="uploadFile" 
        :disabled="!selectedFile || uploading"
        class="upload-button"
      >
        {{ uploading ? 'Uploading...' : 'Upload' }}
      </button>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="result" class="result-message" :class="{ success: result.success, error: !result.success }">
      <h3>{{ result.success ? '✅ Success' : '❌ Error' }}</h3>
      <p>{{ result.message }}</p>
      <div v-if="result.summary" class="summary">
        <p><strong>Total:</strong> {{ result.summary.total }}</p>
        <p><strong>Valid:</strong> {{ result.summary.valid }}</p>
        <p v-if="result.summary.invalid > 0"><strong>Invalid:</strong> {{ result.summary.invalid }}</p>
      </div>
      <div v-if="result.errors && result.errors.length > 0" class="errors">
        <h4>Validation Errors:</h4>
        <ul>
          <li v-for="(error, index) in result.errors.slice(0, 10)" :key="index">
            {{ error.errors?.join(', ') || JSON.stringify(error) }}
          </li>
        </ul>
        <p v-if="result.errors.length > 10">... and {{ result.errors.length - 10 }} more errors</p>
      </div>
    </div>

    <div class="instructions">
      <h3>CSV Format Requirements:</h3>
      <ul>
        <li>CSV file must include headers</li>
        <li>Required columns: first_name, last_name, email</li>
        <li>Optional columns: phone, home_address, department, role, salary, manager_name, manager_email</li>
        <li>Only one employee can have empty manager_name and manager_email (CEO)</li>
        <li>Email addresses must be valid format</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { apiService } from '../services/apiService.js';

const fileInput = ref(null);
const selectedFile = ref(null);
const uploading = ref(false);
const error = ref(null);
const result = ref(null);

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    if (!file.name.endsWith('.csv')) {
      error.value = 'Please select a CSV file';
      selectedFile.value = null;
      return;
    }
    selectedFile.value = file;
    error.value = null;
    result.value = null;
  }
}

async function uploadFile() {
  if (!selectedFile.value) return;

  uploading.value = true;
  error.value = null;
  result.value = null;

  try {
    const response = await apiService.uploadCSV(selectedFile.value);
    result.value = response;
    
    if (response.success) {
      selectedFile.value = null;
      if (fileInput.value) {
        fileInput.value.value = '';
      }
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to upload CSV file';
    result.value = err.response?.data || { success: false, message: error.value };
  } finally {
    uploading.value = false;
  }
}
</script>

<style scoped>
.csv-upload {
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  color: #2c3e50;
  margin-bottom: 2rem;
}

.upload-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.upload-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.select-file-button {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s;
}

.select-file-button:hover {
  background: #2980b9;
}

.file-name {
  color: #2c3e50;
  font-weight: 500;
}

.upload-button {
  background: #2ecc71;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s;
}

.upload-button:hover:not(:disabled) {
  background: #27ae60;
}

.upload-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  padding: 1rem;
  background: #fee;
  color: #c33;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.result-message {
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.result-message.success {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.result-message.error {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.instructions {
  margin-top: 1rem;
  background: #fff;
  padding: 1rem;
  border-radius: 8px;
}
</style>