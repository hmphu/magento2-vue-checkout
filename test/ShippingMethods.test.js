import Vuex from 'vuex'
import { shallowMount, createLocalVue } from '@vue/test-utils'
import ShippingMethods from '../view/frontend/web/js/components/ShippingMethods.vue'
import VeeValidate from 'vee-validate'

const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(VeeValidate)

localVue.filter('currency', function (price) {
  const pattern = '$%s'
  price = parseFloat(price).toFixed(2)
  return pattern.replace('%s', price)
})

describe('ShippingMethods.test.js', () => {
  let store
  let mutations
  let wrapper

  const shippingMethod = {
    amount: 5,
    available: true,
    base_amount: 5,
    carrier_code: 'flatrate',
    carrier_title: 'Flat Rate',
    error_message: '',
    method_code: 'flatrate',
    method_title: 'Fixed',
    price_excl_tax: 5,
    price_incl_tax: 5
  }

  beforeEach(() => {
    mutations = {
      setItem: jest.fn()
    }
    store = new Vuex.Store({
      mutations
    })

    wrapper = shallowMount(ShippingMethods, {
      propsData: {
        shippingMethods: [
          shippingMethod
        ]
      },
      store,
      localVue
    })
  })

  it('commits a setItem when a radiobutton is changed', () => {
    wrapper
      .find(`[data-testid="method-radiobutton-${shippingMethod.carrier_code}"]`)
      .trigger('change')

    expect(mutations.setItem.mock.calls).toHaveLength(1)
    expect(mutations.setItem.mock.calls[0][1]).toEqual({
      item: 'selectedShippingMethod',
      value: shippingMethod
    })
  })

  it('renders a shipping methods list return from props', () => {
    expect(wrapper.contains('[data-testid="shipping-methods')).toBe(true)
  })

  it('has the expected html structure', () => {
    expect(wrapper.element).toMatchSnapshot()
  })
})
