import Vue from 'vue'
import Vuex from 'vuex'
import regions from '../data/regions.json'
import axios from 'axios'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    config: window.config,
    baseUrl: window.baseUrl,
    regions,
    customer: {
      email: null
    },
    step: 'shipping',
    orderId: null,
    shippingMethods: [],
    selectedShippingMethod: null,
    shippingAddress: {
      city: '',
      company: '',
      country_id: '',
      firstname: '',
      lastname: '',
      postcode: '',
      region: '',
      region_id: '',
      street: [],
      telephone: ''
    },
    billingAddress: {
      city: '',
      company: '',
      country_id: '',
      firstname: '',
      lastname: '',
      postcode: '',
      region: '',
      region_id: '',
      street: [],
      telephone: ''
    },
    paymentMethods: [],
    selectedMethods: {
      paymentMethod: {
        method: ''
      },
      shippingCarrierCode: '',
      shippingMethodCode: ''
    },
    totals: null,
    loader: false
  },
  actions: {
    updateShippingMethods ({commit, state, getters}, countryId) {
      const data = {
        'address': {
          'country_id': countryId
        }
      }

      let url = `${state.baseUrl}rest/V1/guest-carts/${getters.cartId}/estimate-shipping-methods`
      if (getters.isCustomerLoggedIn) {
        url = `${state.baseUrl}rest/V1/carts/mine/estimate-shipping-methods`
      }

      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify(data),
        url
      }

      axios(options)
        .then(({data}) => {
          commit('setItem', {item: 'shippingMethods', value: data})
          commit('setItem', {item: 'loader', value: false})
        })
        .catch(error => {
          console.log('Looks like there was a problem: \n', error)
        })
    },
    setShippinInformation ({commit, state, getters}) {
      let url = `${state.baseUrl}rest/V1/guest-carts/${getters.cartId}/shipping-information`
      if (getters.isCustomerLoggedIn) {
        url = `${state.baseUrl}rest/V1/carts/mine/shipping-information`
      }

      const shippingInformation = {
        addressInformation: {
          shipping_method_code: state.selectedShippingMethod.method_code,
          shipping_carrier_code: state.selectedShippingMethod.carrier_code
        }
      }

      const shippingAddress = { ...state.shippingAddress }
      shippingAddress.country_id = state.shippingAddress.country_id.value

      if (getters.regionsByCountryId(shippingAddress.country_id).length) {
        shippingAddress.region_id = state.shippingAddress.region_id.value
        delete shippingAddress.region
      } else {
        delete shippingAddress.region_id
      }

      shippingInformation.addressInformation.shipping_address = shippingAddress

      if (state.billingAddress.city === '') {
        shippingInformation.addressInformation.billing_address = shippingAddress
      } else {
        const billingAddress = { ...state.billing_address }

        billingAddress.country_id = state.billingAddress.country_id.value

        if (getters.regionsByCountryId(billingAddress.country_id).length) {
          billingAddress.region_id = state.billingAddress.region_id.value
          delete billingAddress.region
        } else {
          delete billingAddress.region_id
        }

        shippingInformation.addressInformation.billing_address = billingAddress
      }

      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify(shippingInformation),
        url
      }

      axios(options)
        .then(({data}) => {
          commit('setItem', {item: 'paymentMethods', value: data.payment_methods})
          commit('setItem', {item: 'step', value: 'payment'})
          commit('setItem', {item: 'loader', value: false})
        })
        .catch(error => {
          console.error('Looks like there was a problem: \n', error)
        })
    },
    manageDiscount ({state, getters, commit}, discount) {
      return new Promise((resolve, reject) => {
        let url = `${state.baseUrl}rest/V1/guest-carts/${getters.cartId}/coupons/`
        if (getters.isCustomerLoggedIn) {
          url = `${state.baseUrl}rest/V1/carts/${getters.cartId}/coupons/`
        }

        if (discount.method === 'PUT') {
          url += discount.code
        }

        const options = {
          method: discount.method,
          headers: { 'Content-Type': 'application/json' },
          url
        }

        axios(options)
          .then(response => {
            if (response.data) {
              commit('setItem', {item: 'loader', value: false})
              resolve()
            }
          })
          .catch(error => {
            // If error we should show user is this coupon code was not found i.e.
            // What if coupon code expires/was used already?
            reject(error)
            console.log('Looks like there was a problem: \n', error)
          })
      })
    },
    getTotals ({ state, getters }) {

    },
    updateTotals ({ state, getters }) {
      // let url = `${state.baseUrl}rest/V1/guest-carts/${getters.cartId}/coupons`
      // if (getters.isCustomerLoggedIn) {
      //   url = `${state.baseUrl}rest/V1/carts/${getters.cartId}/coupons`
      // }

      // axios({
      //   method: 'GET',
      //   headers: { 'Content-Type': 'application/json' },
      //   url
      // })
      //   .then(response => {
      //     console.log(response)
      //   })
    },
    placeOrder ({commit, state, getters}, paymentMethod) {
      let url = `${state.baseUrl}rest/V1/guest-carts/${getters.cartId}/payment-information`
      if (getters.isCustomerLoggedIn) {
        url = `${state.baseUrl}rest/V1/carts/mine/payment-information`
      }

      const billingAddress = { ...state.billingAddress }
      billingAddress.country_id = state.billingAddress.country_id.value

      if (getters.regionsByCountryId(billingAddress.country_id).length) {
        billingAddress.region_id = state.billingAddress.region_id.value
        delete billingAddress.region
      } else {
        delete billingAddress.region_id
      }

      const data = {
        billingAddress,
        email: state.customer.email,
        paymentMethod: {
          method: paymentMethod.code
        }
      }

      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify(data),
        url
      }

      axios(options)
        .then(({data}) => {
          commit('setItem', {item: 'step', value: 'success'})
          commit('setItem', {item: 'orderId', value: data})
          commit('setItem', {item: 'loader', value: false})
        })
        .catch(error => {
          console.error('Looks like there was a problem: \n', error)
        })
    }
  },
  mutations: {
    setItem (state, {item, value}) {
      state[item] = value
    },
    copyShippingAddress (state) {
      state.billingAddress = state.shippingAddress
    },
    setCustomerEmail (state, payload) {
      state.customer.email = payload
    },
    setAddress (state, payload) {
      const address = payload.address
      const type = payload.type

      state[type] = {}
      Object.keys(address).forEach(item => {
        if (item.includes('street')) {
          if (!state[type].hasOwnProperty('street')) {
            state[type]['street'] = []
          }
          state[type]['street'].push(address[item])
        } else {
          state[type][item] = address[item]
        }
      })
    }
  },
  getters: {
    cartId (state) {
      return state.config.quoteData.entity_id
    },
    addressByType: (state) => (type) => {
      const address = { ...state[type] }
      address.street0 = address.street.length ? address.street[0] : ''
      address.street1 = address.street.length ? address.street[1] : ''
      delete address.street
      return address
    },
    regionsByCountryId: (state) => (countryId) => {
      return state.regions.filter(region => region.country_id === countryId)
    },
    isCustomerLoggedIn (state) {
      return state.config.isCustomerLoggedIn
    },
    totals (state) {
      return (state.totals !== null) ? state.totals : state.config.totalsData
    }
  }
})

export default store
