import fs from 'fs'
import axios from 'axios'
import { MockerServer } from '../src/server'
import { MockerClient } from '../src/client'

describe('Server with service options', () => {

  const serviceName = 'users'

  const serviceSchema = {
    name: { fakerType: 'internet.userName' },
    email: { fakerType: 'internet.email' }
  }

  const total = 5

  const mocker = new MockerServer({
    services: {
      [serviceName]: {
        schema: serviceSchema,
        total
      }
    }
  })

  const client = new MockerClient({
    services: {
      [serviceName]: {}
    },
    transport: axios,
    debug: true
  })

  const testService = client.service(serviceName)

  beforeEach(() => {
    return mocker.start()
  })

  afterEach(() => {
    return mocker.stop()
  })

  afterAll((done) => {
    mocker.destroy()
    done()
  })

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

})

describe('Server with servicePath option', () => {

  const mocker = new MockerServer({
    servicesPath: './test/mocks'
  })

  const client = new MockerClient({
    servicesPath: './test/mocks',
    transport: axios
  })

  const services = {}

  fs.readdirSync('./test/mocks').forEach(file => {
    const serviceName = file.split('.')[0]
    let json = fs.readFileSync(`./test/mocks/${file}`, { encoding:'utf8' })
    json = JSON.parse(json)
    services[serviceName] = json
  })

  beforeEach(() => {
    return mocker.start()
  })

  afterEach(() => {
    return mocker.stop()
  })

  afterAll((done) => {
    mocker.destroy()
    done()
  })

  it('Should register services', () => {
    const servicesNames = Object.keys(services)
    const registeredServices = Object.keys(client.services)
    expect(registeredServices).toEqual(expect.arrayContaining(servicesNames))
  })

})