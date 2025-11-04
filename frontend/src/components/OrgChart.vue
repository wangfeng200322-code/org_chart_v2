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

const _sigmaInstance = { value: null };
const _graph = { value: null };

async function renderChart() {
  try {
    const res = await apiService.getOrgChart(props.employeeEmail);
    const { nodes, edges } = res?.data || { nodes: [], edges: [] };

    if (!_graph.value) _graph.value = new Graph();
    else _graph.value.clear();

    // Add nodes
    nodes.forEach((n) => {
      const id = n.email;
      if (!_graph.value.hasNode(id)) {
        _graph.value.addNode(id, {
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
      if (_graph.value.hasNode(e.source) && _graph.value.hasNode(e.target) && !_graph.value.hasEdge(edgeId)) {
        _graph.value.addEdgeWithKey(edgeId, e.source, e.target, { size: 1 });
      }
    });

    // Initialize Sigma if needed
    const container = document.getElementById('sigma-container');
  if (!_sigmaInstance.value) {
      _sigmaInstance.value = new Sigma(_graph.value, container, {
        renderLabels: true
      });

      _sigmaInstance.value.on('clickNode', ({ node }) => {
        const data = _graph.value.getNodeAttributes(node);
        emit('node-clicked', data.email || node);
      });
    } else {
      _sigmaInstance.value.setGraph(_graph.value);
    }
  } catch (error) {
    console.error('Failed to render org chart:', error);
    if (!_graph.value) _graph.value = new Graph();
    else _graph.value.clear();
  }
}

// Expose instances for testing
defineExpose({
  get graph() {
    return _graph.value;
  },
  get sigmaInstance() {
    return _sigmaInstance.value;
  }
});

onMounted(renderChart);
watch(() => props.employeeEmail, renderChart);

onBeforeUnmount(() => {
  if (_sigmaInstance.value) {
    _sigmaInstance.value.kill();
    _sigmaInstance.value = null;
  }
  if (_graph.value) {
    _graph.value.clear();
    _graph.value = null;
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