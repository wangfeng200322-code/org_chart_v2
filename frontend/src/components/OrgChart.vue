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
import logger from '../services/logger.js';
import { useSigmaGraph, assignHierarchicalPositions } from '../composables/useOrgChart.js';
import { drawNameCard } from '../utils/orgChartRenderer.js';

// Ensure the roundRect method is available for canvas rendering
import '../utils/canvasUtils.js';

const props = defineProps({ employeeEmail: String });
const emit = defineEmits(['node-clicked', 'back']);

const { sigmaInstance, graph, initializeGraph, setGraph, clearGraph } = useSigmaGraph();

async function renderChart() {
  try {
    logger.info('Fetching org chart data', { email: props.employeeEmail });
    const res = await apiService.getOrgChart(props.employeeEmail);
    logger.debug('Org chart API response', { response: res });
    
    // The response should be directly the data, not wrapped in another data property
    const { nodes, edges } = res || { nodes: [], edges: [] };
    
    logger.debug('Org chart data', { nodes, edges, nodeCount: nodes.length, edgeCount: edges.length });

    if (!graph.value) graph.value = new Graph();
    else graph.value.clear();

    // Add nodes with initial positions
    nodes.forEach((n) => {
      const id = n.email;
      if (graph.value.hasNode(id)) return;
      
      // Create a comprehensive label with employee details
      const fullName = `${n.first_name || ''} ${n.last_name || ''}`.trim() || id;
      const label = [
        fullName,
        n.role || 'Role not specified',
        n.department || 'Department not specified',
        n.email || '',
        n.phone || ''
      ].join('\n');
      
      graph.value.addNode(id, {
        label: label,
        email: id,
        department: n.department,
        role: n.role,
        phone: n.phone,
        first_name: n.first_name,
        last_name: n.last_name,
        size: 20, // Larger node size for detailed info
        x: 0, // Temporary x position
        y: 0  // Temporary y position
      });
    });

    // Add edges
    edges.forEach((e, idx) => {
      const edgeId = `e${idx}-${e.source}-${e.target}`;
      if (graph.value.hasNode(e.source) && graph.value.hasNode(e.target) && !graph.value.hasEdge(edgeId)) {
        graph.value.addEdgeWithKey(edgeId, e.source, e.target, { 
          size: 1,
          type: 'arrow'
        });
      }
    });

    // Assign hierarchical positions
    if (graph.value.order > 0) {
      assignHierarchicalPositions(graph.value, props.employeeEmail);
    }

    // Initialize Sigma if needed
    const container = document.getElementById('sigma-container');
    if (!sigmaInstance.value) {
      initializeGraph(container, (node) => {
        const data = graph.value.getNodeAttributes(node);
        emit('node-clicked', data.email || node);
      });
      
      // Override the default label renderer
      sigmaInstance.value.renderLabels = function() {
        const context = this.canvasContexts.labels;
        const cameraState = this.camera.getState();
        const zoom = cameraState.ratio;
        const settings = this.settings;
        
        this.graph.forEachNode((node, attributes) => {
          if (!attributes.hidden) {
            drawNameCard(context, { 
              x: attributes.x, 
              y: attributes.y, 
              size: attributes.size, 
              label: attributes.label, 
              node 
            }, settings, this.graph);
          }
        });
      };
    } else {
      setGraph(graph.value);
    }
  } catch (error) {
    logger.error('Failed to render org chart:', error);
    console.error('Failed to render org chart:', error);
    if (!graph.value) graph.value = new Graph();
    else graph.value.clear();
  }
}

// Expose instances for testing
defineExpose({
  get graph() {
    return graph.value;
  },
  get sigmaInstance() {
    return sigmaInstance.value;
  }
});

onMounted(renderChart);
watch(() => props.employeeEmail, renderChart);

onBeforeUnmount(() => {
  clearGraph();
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