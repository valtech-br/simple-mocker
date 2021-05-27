import fs from 'fs'
import { MockerServer } from '../src/server'

const checkObjectSchema = (object, schema) => {
  const objectKeys = Object.keys(object)
  const asserts = []
  objectKeys.forEach(key => {
    const value = object[key]
    const schemaOpts = schema[key]
    if (key === 'id') {
      asserts.push(true)
    } else if (schemaOpts.type === 'array') {
      if (!Array.isArray(value)) {
        asserts.push(false)
      } else if (schemaOpts.fakerType === 'object') {
        const assertion = !value.map(v => {
          return checkObjectSchema(v, schemaOpts.properties)
        }).includes(false)
        asserts.push(assertion)
      } else {
        asserts.push(true)
      }
    } else if (schemaOpts.type === 'object') {
      if (typeof value !== 'object') {
        asserts.push(false)
      } else {
        const assertion = checkObjectSchema(value, schemaOpts.properties)
        asserts.push(assertion)
      }
    } else {
      const type = schemaOpts.type || 'string'
      asserts.push(typeof value === type)
    }
  })
  return asserts.filter(a => !a).length === 0
}

describe('Server with service options', () => {

  const serviceName = 'users'

  const serviceSchema = {
    name: { fakerType: 'internet.userName' },
    email: { fakerType: 'internet.email' },
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

  const testService = mocker.service(serviceName)

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

  it('Should generate the right number of items', () => {
    expect(testService.items.length).toBe(total)
  })

  it('Should generate items with the right properties', () => {
    const schemaKeys = Object.keys(serviceSchema)
    const serviceKeys = Object.keys(testService.items[0])
    expect(serviceKeys).toEqual(expect.arrayContaining(schemaKeys))
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
    const registeredServices = Object.keys(mocker.services)
    expect(registeredServices).toEqual(expect.arrayContaining(servicesNames))
  })

  it('Should generate service data consistently', () => {
    let serviceSchemasCheck = []
    Object.keys(mocker.services).forEach(serviceName => {
      const serviceSample = mocker.service(serviceName).items[0]
      const serviceSchema = services[serviceName].schema
      const assertion = checkObjectSchema(serviceSample, serviceSchema)
      serviceSchemasCheck.push(assertion)
    })
    serviceSchemasCheck = serviceSchemasCheck.filter(s => !s).length === 0
    expect(serviceSchemasCheck).toBeTruthy()
  })

})