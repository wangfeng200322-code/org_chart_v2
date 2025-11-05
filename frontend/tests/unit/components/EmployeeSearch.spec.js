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
    vi.useFakeTimers()
    wrapper = mount(EmployeeSearch)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  test('renders search input', () => {
    expect(wrapper.find('input[placeholder="Search employees..."]').exists()).toBe(true)
  })

  test('debounces search input', async () => {
    const mockResults = [{ email: 'john@example.com', first_name: 'John', last_name: 'Doe' }]
    apiService.searchEmployees.mockResolvedValueOnce({ data: mockResults })

    const input = wrapper.find('input')
    await input.setValue('john')
    
    // Fast-forward timer
    vi.advanceTimersByTime(300)
    await nextTick()

    expect(apiService.searchEmployees).toHaveBeenCalledWith('john')
  })

  test('displays search results', async () => {
    const mockResults = [
      { email: 'john@example.com', first_name: 'John', last_name: 'Doe' },
      { email: 'jane@example.com', first_name: 'Jane', last_name: 'Smith' }
    ]
    apiService.searchEmployees.mockResolvedValueOnce({ data: mockResults })

    const input = wrapper.find('input')
    await input.setValue('john')
    
    // Fast-forward timer
    vi.advanceTimersByTime(300)
    await nextTick()
    
    // Wait for DOM update
    await nextTick()

    const results = wrapper.findAll('li')
    expect(results).toHaveLength(2)
    expect(results[0].text()).toContain('John Doe')
    expect(results[1].text()).toContain('Jane Smith')
  })

  test('emits employee-selected event when result clicked', async () => {
    const mockEmployee = { email: 'john@example.com', first_name: 'John', last_name: 'Doe' }
    apiService.searchEmployees.mockResolvedValueOnce({ data: [mockEmployee] })

    const input = wrapper.find('input')
    await input.setValue('john')
    
    // Fast-forward timer
    vi.advanceTimersByTime(300)
    await nextTick()
    
    // Wait for DOM update
    await nextTick()

    const resultItem = wrapper.find('li')
    await resultItem.trigger('click')

    expect(wrapper.emitted('employee-selected')).toBeTruthy()
    expect(wrapper.emitted('employee-selected')[0]).toEqual([mockEmployee])
  })

  test('handles empty search term', async () => {
    await wrapper.find('input').setValue('')
    
    // Fast-forward timer
    vi.advanceTimersByTime(300)
    await nextTick()

    expect(apiService.searchEmployees).not.toHaveBeenCalled()
    expect(wrapper.find('li').exists()).toBe(false)
  })

  test('handles API errors gracefully', async () => {
    // Spy on console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    apiService.searchEmployees.mockRejectedValueOnce(new Error('API Error'))

    // Trigger search
    const input = wrapper.find('input')
    await input.setValue('error')
    
    // Fast-forward timer
    vi.advanceTimersByTime(300)
    await nextTick()
    
    // Wait for error handling
    await nextTick()

    // Check that error was handled and results are cleared
    expect(consoleSpy).toHaveBeenCalledWith('Error searching employees:', expect.any(Error))
    expect(wrapper.findAll('li')).toHaveLength(0)
    
    // Restore console.error
    consoleSpy.mockRestore()
  })
  
  test('clears results when search is cleared', async () => {
    // First search with results
    const mockResults = [{ email: 'john@example.com', first_name: 'John', last_name: 'Doe' }]
    apiService.searchEmployees.mockResolvedValueOnce({ data: mockResults })

    const input = wrapper.find('input')
    await input.setValue('john')
    
    // Fast-forward timer
    vi.advanceTimersByTime(300)
    await nextTick()
    
    // Wait for DOM update
    await nextTick()

    expect(wrapper.findAll('li')).toHaveLength(1)

    // Clear search
    await input.setValue('')
    
    // Fast-forward timer
    vi.advanceTimersByTime(300)
    await nextTick()

    expect(wrapper.findAll('li')).toHaveLength(0)
  })
})