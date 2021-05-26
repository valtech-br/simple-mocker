import fs from 'fs'
import EventEmitter from 'events'
/**
 * Class for the service
 * @extends EventEmitter
 */
export default class MockerService extends EventEmitter {
  /**
   * Create a service.
   * @param {string} name - Name of the service
   * @param {string|Object} opts - Can be a string for the location of a json file with the options or the options itself.
   * @param {string} opts.schema - Schema reference for the service model.
   * @param {string} opts.total - Total of items to seed.
   * @param {MockerApp} app - Instance of MockerApp.
   */
  constructor(name, opts, app, faker = {}) {
    super()
    this.app = app
    this.faker = faker // Faker is passed from the app so don't need to bundle it in the client version
    this.name = name
    this.configured = false
    this.items = []
    this.startService(opts)
  }
  /**
   * Total items created
   * @type {number}
   */
  get total () { return this.items.length }
  /**
   * @method startService
   * Check the service options and starts configuration
   */
  startService (opts) {
    let options = opts
    if (typeof options === 'string') {
      const json = fs.readFileSync(options, { encoding:'utf8' })
      options = JSON.parse(json)
    } else if (Array.isArray(options) || typeof options !== 'object') {
      throw new Error('Options type cannot be "', typeof options, '"')
    }
    this.configureService(options)
  }
  /**
   * @method configureService
   * Configure service
   */
  configureService ({ schema = {}, total = 10 }) {
    this.schema = schema
    this._total = total
    this.app.server && this.registerRoutes()
  }
  /**
   * @method registerRoutes
   * Register service routes
   */
  registerRoutes () {
    const baseRoutes = [{
      method: 'GET',
      path: `/${this.name}/{id}`,
      handler: (request) => {
        return this.items[request.params.id - 1]
      }
    },{
      method: 'GET',
      path:  `/${this.name}`,
      handler: (request) => {
        const itemsToReturn = this.items.filter(item => {
          const limit = parseInt(request.query.limit) || 4
          const skip = parseInt(request.query.skip) || 0
          return item.id <= limit + skip && item.id > skip
        })
        return itemsToReturn
      }
    }]
    this.app.server.route(baseRoutes)
  }
  /**
   * @method generateCachedItems
   * Generate items to data cache mock
   */
  generateCachedItems () {
    this.items = []
    for (let i = 0; this._total > i; i++) {
      const item = this.generateItem()
      this.items.push(item)
    }
    this.app.log(`generated ${this.items.length} for service ${this.name}`)
  }
  /**
   * @method generateItem
   * Generate a single item based on a schema configuration.
   * @param {Object} schema - Base schema for item generation. defaults to `this.schema`
   * @param {number} id - Id of the item to be generated. defaults to `this.items.length + 1`
   */
  generateItem (schema, id) {
    const sch = schema || this.schema
    const keys = Object.keys(sch)
    const obj = { id: id || this.items.length + 1 }
    for (let i = 0; keys.length > i; i++) {
      const key = keys[i]
      obj[key] = this.generateProperty(sch[key])
    }
    return obj
  }
  /**
   * @method generateProperty
   * Generate a single property for an item.
   * @param {string} type - Type of the property. defaults to `string`.
   * @param {number} total - If type is `array` sets the total number of items to be created in the array.
   * @param {number} properties - If type is `object` or `array` and fakerType is set to `object` provides the schema of the object to be generated.
   * @param {string} fakerType - Type of faker to be used. Check the possible [API methods](http://marak.github.io/faker.js/#toc7__anchor)
   */
  generateProperty ({ type = 'string', total = 4, properties = {}, fakerType = 'lorem.text'}) {
    if (!this.faker) {
      return
    }
    if (typeof type === 'array') {
      const items = []
      for (let i = 0; total > i; i++) {
        if (fakerType === 'object') {
          const obj = this.generateItem(properties, i + 1)
          items.push(obj)
        } else {
          const props = fakerType.split('.')
          if (props.length < 2) {
            this.app.handleError('missing props')
          }
          let fakerFunc = this.faker[props[0]][props[1]]
          if (!fakerFunc) {
            fakerFunc = this.faker.lorem.text
          }
          items.push(fakerFunc())
        }
        return items
      }
    } else if (typeof type === 'object') {
      return this.generateItem(properties, 1)
    } else {
      const props = fakerType.split('.')
      if (props.length < 2) {
        this.app.handleError('missing props')
      }
      let fakerFunc = this.faker[props[0]][props[1]]
      if (!fakerFunc) {
        fakerFunc = this.faker.lorem.text
      }
      return fakerFunc()
    }
  }
  /**
   * @method destroy
   * Destroys the service
   */
   destroy () {
    this.removeAllListeners()
  }
  /**
   * @method find
   * Get many items from the generated cached items
   * @param {number} limit - Number of items to return
   * @returns {array} - Array of items
   */
  find ({ limit = 4, skip = 0 }) {
    return this.app.transport.get(`${this.name}?limit=${limit}&skip=${skip}`).then(res => {
      return { data: res.data, total: this.total }
    }).catch(err => {
      const errMessage = err.response.data.message
      this.emit('error', errMessage)
    })
  }
  /**
   * @method get
   * Get one from the generated cached items
   * @param {number} id - Id of the item to be returned
   * @returns {Object} - Item from the generated cached items
   */
  get (id = 1) {
    return this.app.transport.get(`${this.name}/${id}`).then(res => {
      return res.data
    }).catch(err => {
      const errMessage = err.response.data.message
      this.emit('error', errMessage)
    })
  }
  /**
   * @method createStore
   * Create a vuex module based on the service
   * @returns {Object} - Vuex Module
   */
  createStore () {
    const self = this
    return {
      namespaced: true,
      state: {
        items: [],
        total: 0,
        isFindPending: false,
        isGetPending: false
      },
      mutations: {
        ADD_ITEM_TO_STORE (state, item) {
          const exists = !!state.items.filter(i => i.id === item.id)[0]
          if (!exists) {
            state.items.push(item)
          }
        },
        UPDATE_TOTAL (state, total) {
          state.total = total
        },
        IS_FIND_PENDING (state) {
          state.isFindPending = true
        },
        FIND_FINISHED (state) {
          state.isFindPending = false
        },
        IS_GET_PENDING (state) {
          state.isGetPending = true
        },
        GET_FINISHED (state) {
          state.isGetPending = false
        }
      },
      actions: {
        findItems ({ commit }, { limit, skip }) {
          commit('IS_FIND_PENDING')
          return self.find({ limit, skip }).then(res => {
            commit('UPDATE_TOTAL', res.total)
            res.data.forEach(item => {
              commit('ADD_ITEM_TO_STORE', item)
            })
          }).finally(() => {
            commit('FIND_FINISHED')
          })
        },
        getItem (id) {
          commit('IS_GET_PENDING')
          return self.get(id).then(item => {
            commit('ADD_ITEM_TO_STORE', item)
          }).finally(() => {
            commit('GET_FINISHED')
          })
        }
      },
      getters: {
        getById: (state) => (id) => {
          return state.items.filter(item => item.id === id)[0]
        },
        findInStore: (state) => ({ limit = 4, skip = 0 }) => {
          return state.items.filter(item => item.id <= limit + skip && item.id > skip)
        }
      }
    }
  }
}