import { describe, test, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EmployeeDetails from '@/components/EmployeeDetails.vue'

describe('EmployeeDetails.vue', () => {
  let wrapper
  const mockEmployee = {
    email: 'john@example.com',
    first_name: 'John',
    last_name: 'Doe',
    department: 'Engineering',
    role: 'Senior Developer'
  }

  beforeEach(() => {
    wrapper = mount(EmployeeDetails, {
      props: {
        employee: mockEmployee
      }
    })
  })

  test('renders employee information correctly', () => {
    expect(wrapper.find('h2').text()).toBe('John Doe')
    expect(wrapper.text()).toContain('john@example.com')
    expect(wrapper.text()).toContain('Engineering')
    expect(wrapper.text()).toContain('Senior Developer')
  })

  test('emits back event when back button clicked', async () => {
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('back')).toBeTruthy()
  })

  test('emits view-org-chart event with employee data', async () => {
    await wrapper.find('button:last-child').trigger('click')
    expect(wrapper.emitted('view-org-chart')).toBeTruthy()
    expect(wrapper.emitted('view-org-chart')[0][0]).toEqual(mockEmployee)
  })

  test('updates display when employee prop changes', async () => {
    const newEmployee = {
      email: 'jane@example.com',
      first_name: 'Jane',
      last_name: 'Smith',
      department: 'Sales',
      role: 'Manager'
    }
    
    await wrapper.setProps({ employee: newEmployee })
    
    expect(wrapper.find('h2').text()).toBe('Jane Smith')
    expect(wrapper.text()).toContain('jane@example.com')
    expect(wrapper.text()).toContain('Sales')
    expect(wrapper.text()).toContain('Manager')
  })
})