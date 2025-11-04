<template>
  <div class="org-chart">
    <button @click="$emit('back')">Back</button>
    <div id="sigma-container"></div>
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue';
import { apiService } from '../services/apiService.js';

const props = defineProps({ employeeEmail: String });

let sigmaInstance = null;

async function renderChart() {
  const res = await apiService.getOrgChart(props.employeeEmail);
  // simplified: just console.log for now
  console.log('Org chart nodes', res.data.nodes);
}

onMounted(renderChart);
watch(() => props.employeeEmail, renderChart);
</script>

<style scoped>
#sigma-container {
  width: 100%;
  height: 600px;
  background: white;
  border-radius: 8px;
}
</style>