<template>
  <div class="employee-details">
    <button @click="$emit('back')">Back</button>
    <h2>{{ employee.first_name }} {{ employee.last_name }}</h2>
    <p><strong>Email:</strong> {{ employee.email }}</p>
    <p><strong>Department:</strong> {{ employee.department }}</p>
    <p><strong>Role:</strong> {{ employee.role }}</p>
    <button @click="$emit('view-org-chart', employee)">View Org Chart</button>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
const props = defineProps({ employee: Object });
</script>

<style scoped>
.employee-details {
  background: white;
  padding: 1rem;
  border-radius: 8px;
}
</style>