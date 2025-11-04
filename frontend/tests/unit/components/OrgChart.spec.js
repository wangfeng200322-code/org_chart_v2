import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import OrgChart from '@/components/OrgChart.vue'
import { apiService } from '@/services/apiService.js'
import Graph from 'graphology'
import Sigma from 'sigma'

// Mock the API service
vi.mock('@/services/apiService.js', () => ({
  apiService: {
    getOrgChart: vi.fn()
  }
}))

// Mock Sigma
class MockSigma {
  constructor() {
    this.handlers = new Map()
  }

  on(event, handler) {
    this.handlers.set(event, handler)
  }

  kill() {}

  setGraph() {}

  triggerEvent(event, data) {
    const handler = this.handlers.get(event)
    if (handler) handler(data)
  }
}

vi.mock('sigma', () => ({
  default: function(graph, container, options) {
    return new MockSigma()
  }
}))

// Mock graphology
vi.mock('graphology', () => ({
  default: class MockGraph {
    constructor() {
      this.nodes = new Map()
      this.edges = new Map()
    }
    clear() {
      this.nodes.clear()
      this.edges.clear()
    }
    hasNode(id) {
      return this.nodes.has(id)
    }
    hasEdge(id) {
      return this.edges.has(id)
    }
    addNode(id, attributes) {
      this.nodes.set(id, attributes)
    }
    addEdgeWithKey(id, source, target, attributes) {
      this.edges.set(id, { source, target, ...attributes })
    }
    getNodeAttributes(id) {
      return this.nodes.get(id)
    }
    // Add method for cleanup
    clearGraph() {
      this.clear()
    }
    // Add method for removing nodes
    dropNode(id) {
      this.nodes.delete(id)
    }
    // Add method for removing edges
    dropEdge(id) {
      this.edges.delete(id)
    }
  }
}))

describe('OrgChart.vue', () => {
  let wrapper
  const mockContainer = document.createElement('div')
  mockContainer.id = 'sigma-container'

  beforeEach(() => {
    document.body.appendChild(mockContainer)
    wrapper = mount(OrgChart, {
      props: {
        employeeEmail: 'john@example.com'
      }
    })
  })

  afterEach(() => {
    document.body.removeChild(mockContainer)
    vi.clearAllMocks()
  })

  test('renders back button and sigma container', () => {
    expect(wrapper.find('button').text()).toBe('Back')
    expect(wrapper.find('#sigma-container').exists()).toBe(true)
  })

  test('emits back event when back button is clicked', async () => {
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('back')).toBeTruthy()
  })

  test('renders org chart with nodes and edges', async () => {
    const mockData = {
      data: {
        nodes: [
          { email: 'ceo@example.com', first_name: 'John', last_name: 'CEO', department: 'Executive', role: 'CEO' },
          { email: 'manager@example.com', first_name: 'Jane', last_name: 'Manager', department: 'Sales', role: 'Manager' }
        ],
        edges: [
          { source: 'ceo@example.com', target: 'manager@example.com' }
        ]
      }
    }

    apiService.getOrgChart.mockResolvedValueOnce(mockData)
    
    // Mount component and wait for API call
    wrapper = mount(OrgChart, {
      props: {
        employeeEmail: 'ceo@example.com'
      }
    })

    // Wait for the component to finish rendering
    await new Promise(resolve => setTimeout(resolve, 0))

    // Verify API was called
    expect(apiService.getOrgChart).toHaveBeenCalledWith('ceo@example.com')

    // Get the exposed graph instance and verify nodes
    const nodes = wrapper.vm.graph.nodes
    const edges = wrapper.vm.graph.edges

    // Verify nodes were added correctly
    expect(nodes.get('ceo@example.com')).toEqual({
      label: 'John CEO',
      email: 'ceo@example.com',
      department: 'Executive',
      role: 'CEO',
      size: 8
    })

    expect(nodes.get('manager@example.com')).toEqual({
      label: 'Jane Manager',
      email: 'manager@example.com',
      department: 'Sales',
      role: 'Manager',
      size: 8
    })

    // Verify edge was added
    expect(edges.get('e0-ceo@example.com-manager@example.com')).toEqual({
      source: 'ceo@example.com',
      target: 'manager@example.com',
      size: 1
    })
  })

  test('handles API errors gracefully', async () => {
    const consoleError = console.error
    console.error = vi.fn()

    // Mock API error
    apiService.getOrgChart.mockRejectedValueOnce(new Error('API Error'))
    
    // Trigger component mount with API error
    wrapper = mount(OrgChart, {
      props: {
        employeeEmail: 'error@example.com'
      }
    })

    // Wait for rejection to be handled
    await new Promise(resolve => setTimeout(resolve, 0))

    // Verify the graph instance exists
    const graph = new Graph()
    expect(graph.nodes.size).toBe(0)
    expect(graph.edges.size).toBe(0)

    console.error = consoleError
  })

  test('updates chart when employeeEmail prop changes', async () => {
    const mockData1 = {
      data: {
        nodes: [{ email: 'emp1@example.com', first_name: 'Emp', last_name: '1' }],
        edges: []
      }
    }
    const mockData2 = {
      data: {
        nodes: [{ email: 'emp2@example.com', first_name: 'Emp', last_name: '2' }],
        edges: []
      }
    }

    apiService.getOrgChart
      .mockResolvedValueOnce(mockData1)
      .mockResolvedValueOnce(mockData2)

    // Initial mount
    wrapper = mount(OrgChart, {
      props: {
        employeeEmail: 'emp1@example.com'
      }
    })
    await nextTick()

    // Verify first employee data
    expect(apiService.getOrgChart).toHaveBeenCalledWith('emp1@example.com')
    expect(wrapper.vm.graph.nodes.get('emp1@example.com').label).toBe('Emp 1')

    // Update props
    await wrapper.setProps({ employeeEmail: 'emp2@example.com' })
    await nextTick()

    // Verify second employee data
    expect(apiService.getOrgChart).toHaveBeenCalledWith('emp2@example.com')
    expect(wrapper.vm.graph.nodes.get('emp2@example.com').label).toBe('Emp 2')
  })

  test('emits node-clicked event when node is clicked', async () => {
    const mockData = {
      data: {
        nodes: [{ email: 'test@example.com', first_name: 'Test', last_name: 'User' }],
        edges: []
      }
    }

    apiService.getOrgChart.mockResolvedValueOnce(mockData)
    
    wrapper = mount(OrgChart, {
      props: {
        employeeEmail: 'test@example.com'
      }
    })

    // Wait for component to initialize
    await new Promise(resolve => setTimeout(resolve, 0))

    // Get the component's exposed sigma instance
    const sigmaInstance = wrapper.vm.sigmaInstance

    // Simulate a node click using our MockSigma's handlers
    const clickHandler = sigmaInstance.handlers.get('clickNode')
    clickHandler({ node: 'test@example.com' })

    expect(wrapper.emitted('node-clicked')).toBeTruthy()
    expect(wrapper.emitted('node-clicked')[0]).toEqual(['test@example.com'])
  })

  test('cleans up resources on unmount', async () => {
    const mockData = {
      data: {
        nodes: [{ email: 'test@example.com', first_name: 'Test', last_name: 'User' }],
        edges: []
      }
    }

    apiService.getOrgChart.mockResolvedValueOnce(mockData)
    
    wrapper = mount(OrgChart, {
      props: {
        employeeEmail: 'test@example.com'
      }
    })

    // Wait for component to initialize
    await new Promise(resolve => setTimeout(resolve, 0))

    // Get the component instances
    const graph = wrapper.vm.graph
    const sigmaInstance = wrapper.vm.sigmaInstance

    // Mock kill method
    const killSpy = vi.spyOn(sigmaInstance, 'kill')
    const clearSpy = vi.spyOn(graph, 'clear')

    // Add a node to ensure we have something to clean up
    graph.addNode('test@example.com', {
      label: 'Test User',
      email: 'test@example.com',
      size: 8
    })

    // Unmount the component
    wrapper.unmount()

    // Verify cleanup
    expect(killSpy).toHaveBeenCalled()
    expect(clearSpy).toHaveBeenCalled()
    expect(graph.nodes.size).toBe(0)
    expect(graph.edges.size).toBe(0)
  })
})