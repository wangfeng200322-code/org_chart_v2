<template>
  <div class="employee-search">
    <div class="search-container">
      <input 
        v-model="searchQuery" 
        @input="handleInput"
        placeholder="Search employees by name or email..."
        class="search-input"
      />
      <button @click="performSearch" class="search-button">Search</button>
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
        <div class="employee-title">{{ employee.role }}</div>
      </div>
    </div>
    
    <div v-else-if="searchQuery && !loading && searchPerformed" class="no-results">
      No employees found
    </div>
    
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { apiService } from '../services/apiService.js';
import logger from '../services/logger.js';

const searchQuery = ref('');
const results = ref([]);
const loading = ref(false);
const error = ref('');
const searchPerformed = ref(false);

const emit = defineEmits(['employee-selected']);

let searchTimeout = null;

function handleInput() {
  logger.debug('Search input changed', { query: searchQuery.value });
  
  error.value = '';
  
  // Reset searchPerformed when input changes
  const oldValue = searchPerformed.value;
  searchPerformed.value = false;
  logger.debug('Reset searchPerformed', { from: oldValue, to: searchPerformed.value });
  
  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  // Don't search for empty queries
  if (!searchQuery.value.trim()) {
    logger.debug('Empty query, clearing results');
    results.value = [];
    return;
  }
  
  // Debounce search requests
  searchTimeout = setTimeout(() => {
    logger.info('Performing debounced search', { query: searchQuery.value });
    performSearch();
  }, 300);
}

async function performSearch() {
  logger.info('Performing search', { query: searchQuery.value });
  
  // Clear previous timeout to prevent duplicate search
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  loading.value = true;
  logger.debug('Set loading to true');
  
  error.value = '';
  
  try {
    const data = await apiService.searchEmployees(searchQuery.value);
    logger.debug('Received search results', { resultCount: data.length, results: data });
    
    results.value = data;
    const oldValue = searchPerformed.value;
    searchPerformed.value = true;
    logger.debug('Updated searchPerformed', { from: oldValue, to: searchPerformed.value });
    
    logger.debug('Search completed successfully', { 
      query: searchQuery.value, 
      resultCount: data.length 
    });
  } catch (err) {
    logger.error('Search failed', { 
      query: searchQuery.value, 
      error: err.message 
    });
    
    if (err.response && err.response.status === 401) {
      error.value = 'Authentication failed. Please check your API key.';
    } else if (err.response && err.response.status === 403) {
      error.value = 'Access forbidden. Please check your API key permissions.';
    } else {
      error.value = 'Failed to search employees. Please try again.';
    }
    
    results.value = [];
    const oldValue = searchPerformed.value;
    searchPerformed.value = true;
    logger.debug('Updated searchPerformed after error', { from: oldValue, to: searchPerformed.value });
  } finally {
    loading.value = false;
    logger.debug('Set loading to false');
  }
}

function selectEmployee(employee) {
  logger.debug('Employee selected', { employeeEmail: employee.email });
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
  display: flex;
  gap: 0.5rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.search-button {
  padding: 0.75rem 1.5rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.search-button:hover {
  background-color: #2980b9;
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

.debug-info {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}
</style>