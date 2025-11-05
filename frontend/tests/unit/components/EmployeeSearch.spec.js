import { describe, test, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import EmployeeSearch from '@/components/EmployeeSearch.vue'
import { apiService } from '@/services/apiService.js'

// Mock the API service
vi.mock('@/services/apiService.js', () => ({
  apiService: {
    searchEmployees: vi.fn()
  }
}))

describe('EmployeeSearch.vue', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(EmployeeSearch)
    vi.clearAllMocks()
  })

  test('renders search input', () => {
    expect(wrapper.find('input[placeholder="Search employees..."]').exists()).toBe(true)
  })

  test('debounces search input', async () => {
    const mockResults = {
      data: [
        { email: 'john@example.com', first_name: 'John', last_name: 'Doe' },
        { email: 'jane@example.com', first_name: 'Jane', last_name: 'Smith' }
      ]
    }
    apiService.searchEmployees.mockResolvedValueOnce(mockResults)

    // Type in search
    await wrapper.find('input').setValue('jo')
    
    // Verify no immediate API call
    expect(apiService.searchEmployees).not.toHaveBeenCalled()

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 300))

    // Verify API called with search term
    expect(apiService.searchEmployees).toHaveBeenCalledWith('jo')
  })

  test('displays search results', async () => {
    const mockResults = {
      data: [
        { email: 'john@example.com', first_name: 'John', last_name: 'Doe' },
        { email: 'jane@example.com', first_name: 'Jane', last_name: 'Smith' }
      ]
    }
    apiService.searchEmployees.mockResolvedValueOnce(mockResults)

    // Trigger search
    await wrapper.find('input').setValue('jo')
    await new Promise(resolve => setTimeout(resolve, 300))
    await nextTick()

    // Check results displayed
    const items = wrapper.findAll('li')
    expect(items.length).toBe(2)
    expect(items[0].text()).toContain('John Doe')
    expect(items[0].text()).toContain('john@example.com')
  })

  test('emits employee-selected event when result clicked', async () => {
    const mockResults = {
      data: [
        { email: 'john@example.com', first_name: 'John', last_name: 'Doe' }
      ]
    }
    apiService.searchEmployees.mockResolvedValueOnce(mockResults)

    // Trigger search and wait for results
    await wrapper.find('input').setValue('john')
    await new Promise(resolve => setTimeout(resolve, 300))
    await nextTick()

    // Click first result
    await wrapper.find('li').trigger('click')

    // Verify event emitted with employee data
    expect(wrapper.emitted('employee-selected')).toBeTruthy()
    expect(wrapper.emitted('employee-selected')[0][0]).toEqual(mockResults.data[0])
  })

  test('handles empty search term', async () => {
    const mockResults = {
      data: [{ email: 'test@example.com', first_name: 'Test', last_name: 'User' }]
    }
    apiService.searchEmployees.mockResolvedValueOnce(mockResults)
    
    // Trigger search to get initial results
    await wrapper.find('input').setValue('test')
    await new Promise(resolve => setTimeout(resolve, 300))
    await nextTick()
    
    // Verify we have results
    expect(wrapper.findAll('li').length).toBe(1)
    
    // Clear mock calls after initial setup
    vi.clearAllMocks()
    
    // Clear search
    await wrapper.find('input').setValue('')
    await new Promise(resolve => setTimeout(resolve, 300))
    await nextTick()

    // Should clear results without API call
    expect(wrapper.vm.results).toEqual([])
    expect(apiService.searchEmployees).not.toHaveBeenCalled()
  })

  test('handles API errors gracefully', async () => {
    // Mock API error
    const consoleError = console.error
    console.error = vi.fn()
    apiService.searchEmployees.mockRejectedValueOnce(new Error('API Error'))

    // Trigger search
    await wrapper.find('input').setValue('error')
    await new Promise(resolve => setTimeout(resolve, 300))
    await nextTick()

    // Should clear results on error
    expect(wrapper.vm.results).toEqual([])
    console.error = consoleError
  })
})