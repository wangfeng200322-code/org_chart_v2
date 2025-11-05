import { describe, test, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import App from '@/App.vue'
import EmployeeSearch from '@/components/EmployeeSearch.vue'
import EmployeeDetails from '@/components/EmployeeDetails.vue'
import OrgChart from '@/components/OrgChart.vue'
import CSVUpload from '@/components/CSVUpload.vue'
import ApiKeyPanel from '@/components/ApiKeyPanel.vue'

describe('App.vue', () => {
  let wrapper

  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn()
    }
    global.localStorage = localStorageMock
    
    wrapper = mount(App)
  })

  test('renders initial search view', () => {
    expect(wrapper.findComponent(EmployeeSearch).exists()).toBe(true)
    expect(wrapper.findComponent(EmployeeDetails).exists()).toBe(false)
    expect(wrapper.findComponent(OrgChart).exists()).toBe(false)
  })

  test('shows CSV upload button only for admin users', async () => {
    // Non-admin user
    localStorage.getItem.mockReturnValueOnce(null)
    await wrapper.vm.checkAuth()
    await nextTick()
    expect(wrapper.findAll('button').filter(node => node.text() === 'Upload CSV').length).toBe(0)

    // Admin user
    localStorage.getItem.mockImplementation(key => key === 'userRole' ? 'admin' : null)
    await wrapper.vm.checkAuth()
    await nextTick()
    expect(wrapper.findAll('button').filter(node => node.text() === 'Upload CSV').length).toBe(1)
  })

  test('navigates to employee details when employee selected', async () => {
    const mockEmployee = {
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User'
    }

    wrapper.vm.handleEmployeeSelected(mockEmployee)
    await nextTick()

    expect(wrapper.findComponent(EmployeeDetails).exists()).toBe(true)
    expect(wrapper.findComponent(EmployeeDetails).props('employee')).toEqual(mockEmployee)
  })

  test('navigates to org chart when view requested', async () => {
    const mockEmployee = {
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User'
    }

    wrapper.vm.handleViewOrgChart(mockEmployee)
    await nextTick()

    expect(wrapper.findComponent(OrgChart).exists()).toBe(true)
    expect(wrapper.findComponent(OrgChart).props('employeeEmail')).toBe(mockEmployee.email)
  })

  test('handles node click in org chart', async () => {
    // Setup org chart view
    wrapper.vm.currentView = 'org-chart'
    wrapper.vm.selectedEmployeeEmail = 'initial@example.com'
    await nextTick()

    // Simulate node click
    await wrapper.vm.handleNodeClicked('new@example.com')
    await nextTick()

    expect(wrapper.vm.selectedEmployeeEmail).toBe('new@example.com')
  })

  test('navigation between views maintains state', async () => {
    // Navigate to details
    const employee = { email: 'test@example.com', first_name: 'Test', last_name: 'User' }
    wrapper.vm.handleEmployeeSelected(employee)
    await nextTick()
    
    expect(wrapper.vm.currentView).toBe('details')
    expect(wrapper.vm.selectedEmployee).toEqual(employee)

    // Navigate back to search
    await wrapper.findComponent(EmployeeDetails).vm.$emit('back')
    await nextTick()

    expect(wrapper.vm.currentView).toBe('search')
    expect(wrapper.vm.selectedEmployee).toEqual(employee) // State preserved
  })
})