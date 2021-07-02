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
    this.app._server && this.registerRoutes()
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
        const item = this.items.filter(it => it.id === parseInt(request.params.id))[0]
        if (!item) {
          this.app.handleError('notFound', 'Item not found')
        } else {
          return item
        }
      }
    },{
      method: ['POST', 'PUT'],
      path: `/${this.name}/{id}`,
      handler: (request) => {
        const payload = request.payload
        const item = this.items.filter(it => it.id === parseInt(request.params.id))[0]
        if (!item) {
          this.app.handleError('notFound', 'Item not found')
        } else {
          Object.keys(this.schema).forEach((key) => {
            if (payload[key] || payload[key] === null) {
              item[key] = payload[key]
            }
          })
          return item
        }
      }
    },{
      method: 'DELETE',
      path: `/${this.name}/{id}`,
      handler: (request) => {
        const item = this.items.filter(it => it.id === parseInt(request.params.id))[0]
        if (!item) {
          this.app.handleError('notFound', 'Item not found')
        } else {
          this.items = this.item.filter(it => it.id !== item.id)
          return item
        }
      }
    },{
      method: 'GET',
      path:  `/${this.name}`,
      handler: (request) => {
        return this.items.filter((item) => {
          const limit = parseInt(request.query.limit) || 4
          const skip = parseInt(request.query.skip) || 0
          return item.id <= limit + skip && item.id > skip
        })
      }
    },{
      method: ['POST', 'PUT'],
      path:  `/${this.name}`,
      handler: (request) => {
        const item = this.generateItem(null, request.payload)
        this.items.push(item)
        return item
      }
    }]
    this.app._server.route(baseRoutes)
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
  generateItem (schema, sample = {}) {
    const sch = schema || this.schema
    const keys = Object.keys(sch)
    const obj = { id: sample.id || this.items.length + 1 }
    for (let i = 0; keys.length > i; i++) {
      const key = keys[i]
      if (sample[key]) {
        obj[key] = sample[key]
      } else {
        obj[key] = this.generateProperty(sch[key])
      }
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
    if (type === 'array') {
      return this.generatePropertyArray({ type, total, properties, fakerType })
    } else if (type === 'object') {
      return this.generateItem(properties, 1)
    } else {
      const props = fakerType.split('.')
      if (props.length < 2) {
        this.app.handleError(`missing props: ${props} ${Object.keys(properties).join(', ')} ${type}`)
      }
      let fakerFunc = this.faker[props[0]][props[1]]
      if (!fakerFunc) {
        fakerFunc = this.faker.lorem.text
      }
      return fakerFunc()
    }
  }
  /**
   * @method generatePropertyArray
   * Generate a array property.
   * @param {string} type - Type of the property. defaults to `string`.
   * @param {number} total - If type is `array` sets the total number of items to be created in the array.
   * @param {number} properties - If type is `object` or `array` and fakerType is set to `object` provides the schema of the object to be generated.
   * @param {string} fakerType - Type of faker to be used. Check the possible [API methods](http://marak.github.io/faker.js/#toc7__anchor)
   */
  generatePropertyArray ({ type = 'string', total = 4, properties = {}, fakerType = 'lorem.text'}) {
    if (!this.faker) {
      return
    }
    const items = []
    for (let i = 0; total > i; i++) {
      if (fakerType === 'object') {
        const obj = this.generateItem(properties, i + 1)
        items.push(obj)
      } else {
        const props = fakerType.split('.')
        if (props.length < 2) {
          this.app.handleError(`missing props: ${props} ${Object.keys(properties).join(', ')} ${type}`)
        }
        let fakerFunc = this.faker[props[0]][props[1]]
        if (!fakerFunc) {
          fakerFunc = this.faker.lorem.text
        }
        items.push(fakerFunc())
      }
    }
    return items
  }
  /**
   * @method destroy
   * Destroys the service
   */
   destroy () {
    this.removeAllListeners()
  }
  /**
   * @method create
   * Create a new item in the generated cache
   * @param {object} item - Properties of the item to be created
   * @returns {object} - Item created
   */
  create (item) {
    return this.app.transport.post(`${this.name}`, item).then(res => {
      return res
    }).catch(err => {
      const errMessage = err.response.data.message
      this.emit('error', errMessage)
    })
  }
  /**
   * @method patch
   * Patch existing item in the generated cache
   * @param {number|string} id - Id of the item to be updated
   * @param {object} item - Properties of the item to be updated
   * @returns {object} - Item patch
   */
  patch (id, item) {
    return this.app.transport.post(`${this.name}/${id}`, item).then(res => {
      return res
    }).catch(err => {
      const errMessage = err.response.data.message
      this.emit('error', errMessage)
    })
  }
  /**
   * @method delete
   * Delete existing item in the generated cache
   * @param {number|string} id - Id of the item to be deleted
   * @returns {object} - Item deleted
   */
  delete (id) {
    return this.app.transport.delete(`${this.name}/${id}`).then(res => {
      return res
    }).catch(err => {
      const errMessage = err.response.data.message
      this.emit('error', errMessage)
    })
  }
  /**
   * @method find
   * Get many items from the generated cached items
   * @param {number} limit - Number of items to return
   * @returns {array} - Array of items
   */
  find ({ limit = 4, skip = 0 }) {
    return this.app.transport.get(`${this.name}?limit=${limit}&skip=${skip}`).then(res => {
      return { data: res.data, total: res.total }
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
        isGetPending: false,
        isCreatePending: false,
        isPatchPending: false,
        isDeletePending: false
      },
      mutations: {
        ADD_ITEM_TO_STORE (state, item) {
          const exists = !!state.items
            .map((it, i) => {
              return Object.assign({}, it, { index: i })
            })
            .filter(i => i.id === item.id)[0]
          if (!exists) {
            state.items.push(item)
          } else {
            state.items = state.items.splice(exists.index, 1, item)
          }
        },
        UPDATE_TOTAL (state, total) {
          state.total = total
        },
        IS_CREATE_PENDING (state) {
          state.isCreatePending = true
        },
        CREATE_FINISHED (state) {
          state.isCreatePending = false
        },
        IS_PATCH_PENDING (state) {
          state.isPatchPending = true
        },
        PATCH_FINISHED (state) {
          state.isPatchPending = false
        },
        IS_DELETE_PENDING (state) {
          state.isDeletePending = true
        },
        DELETE_FINISHED (state) {
          state.isDeletePending = false
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
            return res
          }).finally((res) => {
            commit('FIND_FINISHED')
            return res
          })
        },
        getItem ({ commit }, id) {
          commit('IS_GET_PENDING')
          return self.get(id).then(item => {
            commit('ADD_ITEM_TO_STORE', item)
            return item
          }).finally((res) => {
            commit('GET_FINISHED')
            return res
          })
        },
        createItem({ commit }, params) {
          commit('IS_CREATE_PENDING')
          return self.create(params).then(item => {
            commit('ADD_ITEM_TO_STORE', item)
            return item
          }).finally((res) => {
            commit('CREATE_FINISHED')
            return res
          })
        },
        patchItem({ commit }, { id, params }) {
          commit('IS_PATCH_PENDING')
          return self.patch(id, params).then(item => {
            commit('ADD_ITEM_TO_STORE', item)
            return item
          }).finally((res) => {
            commit('PATCH_FINISHED')
            return res
          })
        },
        deleteItem({ commit }, id) {
          commit('IS_PATCH_PENDING')
          return self.delete(id).then(item => {
            commit('ADD_ITEM_TO_STORE', item)
            return item
          }).finally((res) => {
            commit('PATCH_FINISHED')
            return res
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