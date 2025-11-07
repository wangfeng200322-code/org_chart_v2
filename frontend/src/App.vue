<template>
  <div id="app">
    <header>
      <h1>Org Chart Management System</h1>
      <nav>
        <button @click="currentView = 'search'" :class="{ active: currentView === 'search' }">
          Search Employees
        </button>
        <button @click="currentView = 'upload'" :class="{ active: currentView === 'upload' }" v-if="isAdmin">
          Upload CSV
        </button>
        <button
          @click="currentView = 'reports'"
          :class="{ active: currentView === 'reports' }"
          v-if="isAdmin"
        >
          Download Reports
        </button>
        <ApiKeyPanel @key-saved="checkAuth" />
      </nav>
    </header>

    <main>
      <EmployeeSearch v-if="currentView === 'search'" @employee-selected="handleEmployeeSelected" />
      <CSVUpload v-if="currentView === 'upload'" />
      <EmployeeDetails 
        v-if="selectedEmployee && currentView === 'details'" 
        :employee="selectedEmployee"
        @back="currentView = 'search'"
        @view-org-chart="handleViewOrgChart"
      />
      <OrgChart 
        v-if="currentView === 'org-chart'"
        :employee-email="selectedEmployeeEmail"
        @back="currentView = 'details'"
        @node-clicked="handleNodeClicked"
      />
      <ReportDownloads v-if="currentView === 'reports'" />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import EmployeeSearch from './components/EmployeeSearch.vue';
import EmployeeDetails from './components/EmployeeDetails.vue';
import OrgChart from './components/OrgChart.vue';
import CSVUpload from './components/CSVUpload.vue';
import ApiKeyPanel from './components/ApiKeyPanel.vue';
import ReportDownloads from './components/ReportDownloads.vue';
import { watch } from 'vue';

watch(currentView, (newView) => {
  console.log('currentView changed to:', newView);
});
const currentView = ref('search');
const selectedEmployee = ref(null);
const selectedEmployeeEmail = ref('');
const isAdmin = ref(false);

onMounted(() => {
  checkAuth();
});

function checkAuth() {
  const apiKey = localStorage.getItem('apiKey') || sessionStorage.getItem('apiKey') || getCookie('apiKey');
  // In a real application, you would verify the key with the backend
  // For now, we'll just check if a key exists
  isAdmin.value = !!apiKey;
}

function handleEmployeeSelected(employee) {
  selectedEmployee.value = employee;
  selectedEmployeeEmail.value = employee.email;
  currentView.value = 'details';
}

function handleViewOrgChart(employee) {
  selectedEmployeeEmail.value = employee.email;
  currentView.value = 'org-chart';
}

function handleNodeClicked(nodeData) {
  // Extract email from node data and navigate to it
  if (nodeData.email) {
    selectedEmployeeEmail.value = nodeData.email;
  } else if (typeof nodeData === 'string') {
    selectedEmployeeEmail.value = nodeData;
  }
  // The watch in OrgChart component will reload the chart
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}
</script>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background: #2c3e50;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

header h1 {
  margin: 0;
  font-size: 1.5rem;
}

nav {
  display: flex;
  gap: 1rem;
  align-items: center;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: #3498db;
  color: white;
  font-weight: bold;
}

button:hover {
  background: #2980b9;
}

button.active {
  background: #e74c3c;
}

button.secondary {
  background: #95a5a6;
}

button.secondary:hover {
  background: #7f8c8d;
}
</style>
