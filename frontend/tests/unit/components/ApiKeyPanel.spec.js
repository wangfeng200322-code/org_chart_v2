import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ApiKeyPanel from '@/components/ApiKeyPanel.vue'

describe('ApiKeyPanel.vue', () => {
  beforeEach(() => {
    // Clear storage before each test
    localStorage.clear()
    sessionStorage.clear()
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
    })
  })

  test('renders input and storage options', () => {
    const wrapper = mount(ApiKeyPanel)
    expect(wrapper.find('input[placeholder="Enter API key"]').exists()).toBe(true)
    expect(wrapper.find('select').exists()).toBe(true)
    expect(wrapper.findAll('option').length).toBe(3)
    expect(wrapper.findAll('button').length).toBe(2)
  })

  test('saves API key to selected storage', async () => {
    const wrapper = mount(ApiKeyPanel)
    const input = wrapper.find('input')
    const select = wrapper.find('select')
    const saveButton = wrapper.find('button:not(.secondary)')

    // Test session storage
    await input.setValue('test-key-1')
    await select.setValue('session')
    await saveButton.trigger('click')
    expect(sessionStorage.getItem('apiKey')).toBe('test-key-1')

    // Test local storage
    await input.setValue('test-key-2')
    await select.setValue('local')
    await saveButton.trigger('click')
    expect(localStorage.getItem('apiKey')).toBe('test-key-2')
  })

  test('clears API key from all storages', async () => {
    // Setup: save keys in different storages
    sessionStorage.setItem('apiKey', 'test-session')
    localStorage.setItem('apiKey', 'test-local')
    document.cookie = 'apiKey=test-cookie;path=/'

    const wrapper = mount(ApiKeyPanel)
    const clearButton = wrapper.find('button.secondary')

    await clearButton.trigger('click')

    expect(sessionStorage.getItem('apiKey')).toBeNull()
    expect(localStorage.getItem('apiKey')).toBeNull()
    expect(document.cookie).not.toContain('apiKey=test-cookie')
  })

  test('loads existing API key on mount', async () => {
    // Setup: save a key in session storage
    sessionStorage.setItem('apiKey', 'existing-key');

    const wrapper = mount(ApiKeyPanel)
    await nextTick()
    expect(wrapper.find('input').element.value).toBe('existing-key')
  })
})