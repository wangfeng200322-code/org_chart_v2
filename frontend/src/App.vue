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
        <ApiKeyPanel />
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

const currentView = ref('search');
const selectedEmployee = ref(null);
const selectedEmployeeEmail = ref('');
const isAdmin = ref(false);

onMounted(() => {
  checkAuth();
});

function checkAuth() {
  const apiKey = localStorage.getItem('apiKey');
  isAdmin.value = localStorage.getItem('userRole') === 'admin';
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
}

nav button {
  background: transparent;
  border: 2px solid white;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

nav button:hover {
  background: white;
  color: #2c3e50;
}

nav button.active {
  background: white;
  color: #2c3e50;
}

main {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}
</style>