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
import logger from '../services/logger.js';

const props = defineProps({ employeeEmail: String });
const emit = defineEmits(['node-clicked', 'back']);

const _sigmaInstance = { value: null };
const _graph = { value: null };

// Function to assign hierarchical positions to nodes using a simple tree layout
function assignHierarchicalPositions(graph) {
  // Find root nodes (nodes with no incoming edges)
  const rootNodes = graph.filterNodes((node, attr) => {
    return graph.inDegree(node) === 0;
  });

  // If no root nodes found, use the focus employee as root
  let rootNode = null;
  if (rootNodes.length > 0) {
    rootNode = rootNodes[0];
  } else {
    // Try to find the focus employee node
    const focusEmail = props.employeeEmail;
    if (graph.hasNode(focusEmail)) {
      rootNode = focusEmail;
    } else {
      // Fallback to first node
      rootNode = graph.nodes()[0];
    }
  }

  // Assign positions using breadth-first approach
  const visited = new Set();
  const nodeSpacingX = 150;
  const levelSpacingY = 120;
  
  // BFS queue with node, level, and index within level
  const queue = [{ node: rootNode, level: 0, index: 0 }];
  const levelCounts = {}; // Track number of nodes at each level
  const nodePositions = new Map();
  
  // First pass: determine the structure
  while (queue.length > 0) {
    const { node, level } = queue.shift();
    
    if (visited.has(node)) continue;
    visited.add(node);
    
    // Count nodes at this level
    if (!levelCounts[level]) levelCounts[level] = 0;
    const indexAtLevel = levelCounts[level];
    levelCounts[level]++;
    
    // Store position information
    nodePositions.set(node, { level, index: indexAtLevel });
    
    // Add children to queue
    const children = graph.outNeighbors(node);
    children.forEach(child => {
      if (!visited.has(child)) {
        queue.push({ node: child, level: level + 1, index: 0 });
      }
    });
  }
  
  // Second pass: assign actual coordinates
  visited.clear();
  nodePositions.forEach((posInfo, node) => {
    const { level, index } = posInfo;
    const nodesAtLevel = levelCounts[level];
    
    // Center the nodes at each level
    const startX = -((nodesAtLevel - 1) * nodeSpacingX) / 2;
    const x = startX + index * nodeSpacingX;
    const y = level * levelSpacingY;
    
    graph.setNodeAttribute(node, 'x', x);
    graph.setNodeAttribute(node, 'y', y);
  });
}

async function renderChart() {
  try {
    logger.info('Fetching org chart data', { email: props.employeeEmail });
    const res = await apiService.getOrgChart(props.employeeEmail);
    logger.debug('Org chart API response', { response: res });
    
    // The response should be directly the data, not wrapped in another data property
    const { nodes, edges } = res || { nodes: [], edges: [] };
    
    logger.debug('Org chart data', { nodes, edges, nodeCount: nodes.length, edgeCount: edges.length });

    if (!_graph.value) _graph.value = new Graph();
    else _graph.value.clear();

    // Add nodes with initial positions
    nodes.forEach((n) => {
      const id = n.email;
      if (!_graph.value.hasNode(id)) {
        _graph.value.addNode(id, {
          label: `${n.first_name || ''} ${n.last_name || ''}`.trim() || id,
          email: id,
          department: n.department,
          role: n.role,
          size: 8,
          x: 0, // Temporary x position
          y: 0  // Temporary y position
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

    // Assign hierarchical positions
    if (_graph.value.order > 0) {
      assignHierarchicalPositions(_graph.value);
    }

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
    logger.error('Failed to render org chart:', error);
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