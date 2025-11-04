<template>
  <div class="employee-search">
    <input v-model="query" placeholder="Search employees..." @input="lookup" />
    <ul>
      <li v-for="emp in results" :key="emp.email" @click="$emit('employee-selected', emp)">
        {{ emp.first_name }} {{ emp.last_name }} — {{ emp.email }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { apiService } from '../services/apiService.js';

const query = ref('');
const results = ref([]);

let timer = null;

async function lookup() {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    if (!query.value) {
      results.value = [];
      return;
    }
    const res = await apiService.searchEmployees(query.value);
    results.value = res.data || [];
  }, 300);
}
</script>

<style scoped>
.employee-search {
  background: white;
  padding: 1rem;
  border-radius: 8px;
}

.employee-search input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.employee-search ul {
  list-style: none;
}

.employee-search li {
  padding: 0.5rem 0;
  cursor: pointer;
}
</style>