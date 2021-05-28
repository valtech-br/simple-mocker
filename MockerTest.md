# MockerTest

This class is used to test applications that use Mocker.

**Example:**
```js
import Vuex from 'vuex'
import { createLocalVue } from '@vue/test-utils'
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

  })

})
```

## Issues

#### 1) Snapshot tests are not suported
Because mocker generates data on runtime, each time is runned it will generate new data that won't match snapshots. To solve this we can create a option to create json files form static mocked data.