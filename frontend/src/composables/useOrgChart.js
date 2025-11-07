import { ref } from 'vue';
import Graph from 'graphology';
import Sigma from 'sigma';
import logger from '../services/logger.js';
import { drawNameCard } from '../utils/orgChartRenderer.js';

// Track the currently focused node
const focusedNode = ref(null);

// Function to assign hierarchical positions to nodes with managers above reports
export function assignHierarchicalPositions(graph, employeeEmail) {
  // Find root nodes (nodes with no incoming edges - meaning no managers)
  const rootNodes = graph.filterNodes((node, attr) => {
    return graph.inDegree(node) === 0;
  });

  // If no root nodes found, use the focus employee as root
  let rootNode = null;
  if (rootNodes.length > 0) {
    rootNode = rootNodes[0];
  } else {
    // Try to find the focus employee node
    if (graph.hasNode(employeeEmail)) {
      rootNode = employeeEmail;
    } else {
      // Fallback to first node
      rootNode = graph.nodes()[0];
    }
  }

  // Assign positions using a proper tree layout algorithm
  const visited = new Set();
  const nodeSpacingX = 200; // Adjusted spacing
  const levelSpacingY = 150; // Adjusted vertical spacing
  
  // Determine the level of each node using BFS from root
  const nodeLevels = new Map();
  const queue = [{ node: rootNode, level: 0 }];
  
  while (queue.length > 0) {
    const { node, level } = queue.shift();
    
    if (visited.has(node)) continue;
    visited.add(node);
    
    // Assign level to this node
    nodeLevels.set(node, level);
    
    // Add children (reports) to queue with incremented level
    const reports = graph.outNeighbors(node);
    reports.forEach(report => {
      if (!visited.has(report)) {
        queue.push({ node: report, level: level + 1 });
      }
    });
  }
  
  // Count nodes at each level for proper centering
  const levelCounts = {};
  nodeLevels.forEach((level, node) => {
    if (!levelCounts[level]) levelCounts[level] = 0;
    levelCounts[level]++;
  });
  
  // Track current index at each level for positioning
  const levelIndices = {};
  Object.keys(levelCounts).forEach(level => {
    levelIndices[level] = 0;
  });
  
  // Position each node
  nodeLevels.forEach((level, node) => {
    // Get current index at this level
    const indexAtLevel = levelIndices[level];
    levelIndices[level]++;
    
    // Calculate position
    const nodesAtLevel = levelCounts[level];
    const startX = -((nodesAtLevel - 1) * nodeSpacingX) / 2;
    const x = startX + indexAtLevel * nodeSpacingX;
    const y = level * levelSpacingY; // Managers at lower Y values (top of screen)
    
    graph.setNodeAttribute(node, 'x', x);
    graph.setNodeAttribute(node, 'y', -y);
  });
  
  // Log some information for debugging
  logger.debug('Tree layout info', { 
    rootNode, 
    totalNodes: graph.order,
    levels: Object.keys(levelCounts).map(level => ({ level, count: levelCounts[level] }))
  });
}

// Function to count direct and total reports for an employee
export function countReports(graph, node) {
  const directReports = graph.outDegree(node);
  
  // Count total reports (all descendants)
  let totalReports = 0;
  const visited = new Set();
  
  function countDescendants(currentNode) {
    if (visited.has(currentNode)) return;
    visited.add(currentNode);
    
    const neighbors = graph.outNeighbors(currentNode);
    totalReports += neighbors.length;
    
    neighbors.forEach(neighbor => {
      countDescendants(neighbor);
    });
  }
  
  countDescendants(node);
  
  return {
    directReports,
    totalReports
  };
}

// Function to initialize and manage the Sigma instance
export function useSigmaGraph() {
  const sigmaInstance = ref(null);
  const graph = ref(null);
  
  function initializeGraph(container, onNodeClick) {
    // Ensure container has dimensions
    container.style.width = '100%';
    container.style.height = '600px';
    
    sigmaInstance.value = new Sigma(graph.value, container, {
      allowInvalidContainer: true,
      renderLabels: true,
      labelRenderedSizeThreshold: 0, // Always render labels
      labelDensity: 1,
      // Reduce sensitivity to minimize event listener impact
      zoomingRatio: 1.7,
      doubleClickZoomingRatio: 1.7,
      // Enable progressive rendering for better performance
      enableEdgeClickEvents: false,
      enableEdgeWheelEvents: false,
      enableEdgeHoverEvents: false
    });

    // Handle node click
    sigmaInstance.value.on('clickNode', ({ node }) => {
      // Toggle focus state
      if (focusedNode.value === node) {
        focusedNode.value = null; // Unfocus if clicking the same node
      } else {
        focusedNode.value = node; // Focus on the clicked node
      }
      
      // Call the provided callback
      if (typeof onNodeClick === 'function') {
        onNodeClick(node);
      }
      
      // Refresh the view to update node rendering
      sigmaInstance.value.refresh();
    });
    
    // Handle stage click (clicking on empty space)
    sigmaInstance.value.on('clickStage', () => {
      // Unfocus when clicking on empty space
      if (focusedNode.value) {
        focusedNode.value = null;
        sigmaInstance.value.refresh();
      }
    });
    
    return sigmaInstance.value;
  }
  
  function setGraph(newGraph) {
    graph.value = newGraph;
    if (sigmaInstance.value) {
      sigmaInstance.value.setGraph(graph.value);
    }
  }
  
  function clearGraph() {
    if (graph.value) {
      graph.value.clear();
      graph.value = null;
    }
    
    if (sigmaInstance.value) {
      sigmaInstance.value.kill();
      sigmaInstance.value = null;
    }
  }
  
  return {
    sigmaInstance,
    graph,
    initializeGraph,
    setGraph,
    clearGraph,
    focusedNode
  };
}

export { focusedNode };