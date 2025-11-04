import { config } from '@vue/test-utils'
import { beforeAll } from 'vitest'

// Configure Vue Test Utils
beforeAll(() => {
  config.global.mocks = {
    // Add any global mocks here
  }

  config.global.stubs = {
    // Add any global stubs here
  }
})

// Mock window.URL.createObjectURL
window.URL.createObjectURL = vi.fn()