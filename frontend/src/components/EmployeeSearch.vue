<template>
  <div class="employee-search">
    <div class="search-container">
      <input 
        v-model="searchQuery" 
        @input="handleSearch"
        placeholder="Search employees by name or email..."
        class="search-input"
      />
      <div v-if="loading" class="loading">Searching...</div>
    </div>
    
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div v-if="results.length > 0" class="results">
      <div 
        v-for="employee in results" 
        :key="employee.email" 
        @click="selectEmployee(employee)"
        class="result-item"
      >
        <div class="employee-name">{{ employee.first_name }} {{ employee.last_name }}</div>
        <div class="employee-email">{{ employee.email }}</div>
        <div class="employee-title">{{ employee.title }}</div>
      </div>
    </div>
    
    <div v-else-if="searchQuery && !loading" class="no-results">
      No employees found
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { apiService } from '../services/apiService.js';

const searchQuery = ref('');
const results = ref([]);
const loading = ref(false);
const error = ref('');

const emit = defineEmits(['employee-selected']);

let searchTimeout = null;

function handleSearch() {
  error.value = '';
  
  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  // Don't search for empty queries
  if (!searchQuery.value.trim()) {
    results.value = [];
    return;
  }
  
  // Debounce search requests
  searchTimeout = setTimeout(() => {
    performSearch();
  }, 300);
}

async function performSearch() {
  loading.value = true;
  error.value = '';
  
  try {
    const data = await apiService.searchEmployees(searchQuery.value);
    results.value = data;
  } catch (err) {
    console.error('Search error:', err);
    if (err.response && err.response.status === 401) {
      error.value = 'Authentication failed. Please check your API key.';
    } else if (err.response && err.response.status === 403) {
      error.value = 'Access forbidden. Please check your API key permissions.';
    } else {
      error.value = 'Failed to search employees. Please try again.';
    }
    results.value = [];
  } finally {
    loading.value = false;
  }
}

function selectEmployee(employee) {
  emit('employee-selected', employee);
}
</script>

<style scoped>
.employee-search {
  padding: 1rem;
}

.search-container {
  position: relative;
  margin-bottom: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.loading {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.error-message {
  color: #e74c3c;
  padding: 0.5rem;
  background-color: #fdf2f2;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.results {
  max-height: 400px;
  overflow-y: auto;
}

.result-item {
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: border-color 0.2s;
}

.result-item:hover {
  border-color: #3498db;
}

.employee-name {
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.employee-email {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.employee-title {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.no-results {
  text-align: center;
  color: #7f8c8d;
  padding: 2rem;
}
</style>