<template>
  <div class="org-chart">
    <button @click="$emit('back')">Back</button>
    <div id="sigma-container"></div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch } from 'vue';
import { apiService } from '../services/apiService.js';
import Graph from 'graphology';
import Sigma from 'sigma';

const props = defineProps({ employeeEmail: String });
const emit = defineEmits(['node-clicked', 'back']);

let sigmaInstance = null;
let graph = null;

async function renderChart() {
  const res = await apiService.getOrgChart(props.employeeEmail);
  const { nodes, edges } = res.data || { nodes: [], edges: [] };

  if (!graph) graph = new Graph();
  else graph.clear();

  // Add nodes
  nodes.forEach((n) => {
    const id = n.email;
    if (!graph.hasNode(id)) {
      graph.addNode(id, {
        label: `${n.first_name || ''} ${n.last_name || ''}`.trim() || id,
        email: id,
        department: n.department,
        role: n.role,
        size: 8
      });
    }
  });

  // Add edges
  edges.forEach((e, idx) => {
    const edgeId = `e${idx}-${e.source}-${e.target}`;
    if (graph.hasNode(e.source) && graph.hasNode(e.target) && !graph.hasEdge(edgeId)) {
      graph.addEdgeWithKey(edgeId, e.source, e.target, { size: 1 });
    }
  });

  // Initialize Sigma if needed
  const container = document.getElementById('sigma-container');
  if (!sigmaInstance) {
    sigmaInstance = new Sigma(graph, container, {
      renderLabels: true
    });

    sigmaInstance.on('clickNode', ({ node }) => {
      const data = graph.getNodeAttributes(node);
      emit('node-clicked', data.email || node);
    });
  } else {
    sigmaInstance.setGraph(graph);
  }
}

onMounted(renderChart);
watch(() => props.employeeEmail, renderChart);

onBeforeUnmount(() => {
  if (sigmaInstance) {
    sigmaInstance.kill();
    sigmaInstance = null;
  }
  if (graph) {
    graph.clear();
    graph = null;
  }
});
</script>

<style scoped>
#sigma-container {
  width: 100%;
  height: 600px;
  background: white;
  border-radius: 8px;
}
</style>