import { describe, test, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import CSVUpload from '@/components/CSVUpload.vue'
import { apiService } from '@/services/apiService.js'

// Mock the apiService
vi.mock('@/services/apiService.js', () => ({
  apiService: {
    uploadCSV: vi.fn()
  }
}))

describe('CSVUpload.vue', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(CSVUpload)
    // Clear mocks before each test
    vi.clearAllMocks()
  })

  test('renders upload interface correctly', () => {
    expect(wrapper.find('h1').text()).toBe('Upload Employee CSV')
    expect(wrapper.find('input[type="file"]').exists()).toBe(true)
    expect(wrapper.find('.select-file-button').text()).toBe('Choose CSV File')
    expect(wrapper.find('.upload-button').exists()).toBe(true)
    expect(wrapper.find('.instructions').exists()).toBe(true)
  })

  test('handles non-CSV file selection', async () => {
    const file = new File([''], 'test.txt', { type: 'text/plain' })
    
    await wrapper.vm.handleFileSelect({
      target: {
        files: [file]
      }
    })

    expect(wrapper.vm.error).toBe('Please select a CSV file')
    expect(wrapper.vm.selectedFile).toBeNull()
  })

  test('handles valid CSV file selection', async () => {
    const file = new File([''], 'test.csv', { type: 'text/csv' })
    
    await wrapper.vm.handleFileSelect({
      target: {
        files: [file]
      }
    })

    expect(wrapper.vm.error).toBeNull()
    expect(wrapper.vm.selectedFile).toBe(file)
  })

  test('handles successful file upload', async () => {
    // Mock successful response
    const successResponse = {
      success: true,
      message: 'File uploaded successfully',
      summary: {
        total: 10,
        valid: 10,
        invalid: 0
      }
    }
    apiService.uploadCSV.mockResolvedValueOnce(successResponse)

    // Set up file and trigger upload
    const file = new File([''], 'test.csv', { type: 'text/csv' })
    wrapper.vm.selectedFile = file
    await wrapper.vm.uploadFile()

    expect(apiService.uploadCSV).toHaveBeenCalledWith(file)
    expect(wrapper.vm.result).toEqual(successResponse)
    expect(wrapper.vm.error).toBeNull()
    expect(wrapper.vm.selectedFile).toBeNull()
  })

  test('handles upload failure', async () => {
    // Mock error response
    const errorResponse = {
      response: {
        data: {
          success: false,
          message: 'Invalid CSV format',
          error: 'Invalid CSV format',
          errors: [
            { errors: ['Missing required column: email'] }
          ]
        }
      }
    }
    apiService.uploadCSV.mockRejectedValueOnce(errorResponse)

    // Set up file and trigger upload
    const file = new File([''], 'test.csv', { type: 'text/csv' })
    wrapper.vm.selectedFile = file
    await wrapper.vm.uploadFile()

    expect(apiService.uploadCSV).toHaveBeenCalledWith(file)
    expect(wrapper.vm.result).toEqual(errorResponse.response.data)
    expect(wrapper.vm.error).toBe('Invalid CSV format')
  })

  test('shows upload button state correctly', async () => {
    const uploadButton = wrapper.find('.upload-button')
    
    // Initially disabled (no file selected)
    expect(uploadButton.attributes('disabled')).toBeDefined()
    
    // Select a file
    const file = new File([''], 'test.csv', { type: 'text/csv' })
    wrapper.vm.selectedFile = file
    await nextTick()
    
    // Button should be enabled
    expect(uploadButton.attributes('disabled')).toBeUndefined()
    
    // During upload
    wrapper.vm.uploading = true
    await nextTick()
    
    // Button should show uploading state
    expect(uploadButton.text()).toBe('Uploading...')
    expect(uploadButton.attributes('disabled')).toBeDefined()
  })

  test('displays validation errors correctly', async () => {
    const errorResponse = {
      success: false,
      message: 'Validation failed',
      errors: [
        { errors: ['Invalid email format'] },
        { errors: ['Missing manager email'] },
        { errors: ['Department is required'] }
      ]
    }
    wrapper.vm.result = errorResponse
    await nextTick()

    const errorsList = wrapper.findAll('.errors li')
    expect(errorsList.length).toBe(3)
    expect(errorsList[0].text()).toBe('Invalid email format')
    expect(errorsList[1].text()).toBe('Missing manager email')
    expect(errorsList[2].text()).toBe('Department is required')
  })
})