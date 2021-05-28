import fs from 'fs'
import Vuex from 'vuex'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import { MockerTest } from '../src/test'
import { MockerClient } from '../src/client'

const localVue = createLocalVue()

localVue.use(Vuex)

describe('Server with service options', () => {

  const serviceName = 'users'

  const serviceSchema = {
    name: { fakerType: 'internet.userName' },
    email: { fakerType: 'internet.email' }
  }

  const total = 5

  const mocker = new MockerTest({
    services: {
      [serviceName]: {
        schema: serviceSchema,
        total
      }
    }
  })

  const transport = {
    create: () => {
      return mocker.transport
    }
  }

  const client = new MockerClient({
    services: {
      [serviceName]: {}
    },
    transport
  })

  const testService = client.service(serviceName)

  it('Should register services', () => {
    expect(testService.name).toBe(serviceName)
  })

  describe('When making a find request', () => {
    const limit = 2
    const skip = 2
    let response
    
    beforeEach(() => {
      return testService.find({ limit, skip }).then(res => {
        response = res
        return res
      })
    })

    it(`Should return total items in mocked data`, () => {
      expect(response.total).toBe(total)
    })

    it(`Should return ${limit} items`, () => {
      expect(response.data.length).toBe(limit)
    })
    
    it(`Should skip ${skip} items`, () => {
      expect(response.data[0].id).toBe(skip + 1)
    })

  })

  describe('When making a get request', () => {
    const id = 2
    let response
    
    beforeEach(() => {
      return testService.get(id).then(res => {
        response = res
        return res
      })
    })

    it(`Should return an object`, () => {
      expect(typeof response).toBe('object')
    })

    it(`Should return item with id ${id}`, () => {
      expect(response.id).toBe(id)
    })

  })

  describe('Vuex store', () => {

    const modules = client.createVuexModules()

    const store = new Vuex.Store({
      modules
    })

    it('Should update state on find action', () => {
      store.dispatch(`${serviceName}/findItems`, { limit: 2, skip: 2 }).then(() => {
        expect(store.state[serviceName].items.length).toBe(2)
      })
    })

    it('Should return items from findItems action', () => {
      store.dispatch(`${serviceName}/findItems`, { limit: 2, skip: 2 }).then((res) => {
        expect(typeof res).toBe('object')
        expect(res.data.length).toBe(2)
        expect(res.total).toBe(total)
      })
    })

    it('Should update state on get action', () => {
      store.dispatch(`${serviceName}/getItem`, 2).then(() => {
        const itemById = store.state[serviceName].items.filter(item => item.id === 2)
        expect(itemById).toBeTruthy()
      })
    })

    it('Should return item from getItem action', () => {
      store.dispatch(`${serviceName}/getItem`, 2).then((res) => {
        expect(res.id).toBe(2)
      })
    })

    it('Should return getters', () => {
      const items = store.getters[`${serviceName}/findInStore`]({ limit: 2, skip: 2 })
      const item = store.getters[`${serviceName}/getById`](2)
      expect(items.length).toBe(2)
      expect(item.id).toBe(2)
    })

  })

})

describe('Server with servicePath option', () => {

  const mocker = new MockerTest({
    servicesPath: './test/mocks'
  })

  const transport = {
    create: () => {
      return mocker.transport
    }
  }

  const client = new MockerClient({
    servicesPath: './test/mocks',
    transport
  })

  const services = {}

  fs.readdirSync('./test/mocks').forEach(file => {
    const serviceName = file.split('.')[0]
    let json = fs.readFileSync(`./test/mocks/${file}`, { encoding:'utf8' })
    json = JSON.parse(json)
    services[serviceName] = json
  })

  it('Should register services', () => {
    const servicesNames = Object.keys(services)
    const registeredServices = Object.keys(client.services)
    expect(registeredServices).toEqual(expect.arrayContaining(servicesNames))
  })

})