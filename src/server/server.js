import hapi from '@hapi/hapi'
import faker from 'faker'
import EventEmitter from 'events'
import MockerCore from '../core/core.js'
/**
 * Class for the server app to create mock data
 * @extends EventEmitter
 */
export default class MockerServer extends MockerCore {
  /**
   * Create mock app
   * @param {Object} options - Options for the app creation
   * @param {string} options.host - host app will be on. default = localhost
   * @param {string} options.port - port the app will listen to. default = 3001
   * @param {object} options.services - services configuration, each `key` will be one service. To check options see MockerService class
   * @param {string} options.servicesPath - path to a folder containing a json file for each service, with configuration options.
   * @param {boolean} options.debug - debug mode.
   */
  constructor(args) {
    super(args)
    this.faker = faker
    this.transport = {
      get: url => this.transportGet(url)
    }
    this.createServer()
    this.registerServices()
    this.seedServices()
  }
  /**
   * Getter for the hapi server
   * @type {Object} Hapi server
   */
  get server () { return this._server }
  /**
   * @method createServer
   * Instantiate hapi server
   */
  createServer () {
    this._server = hapi.server({
      port: this._port,
      host: this._host,
      routes: {
        cors: true
      }
    })
  }
  /**
   * @method transportGet
   * Mocks a url request
   */
  transportGet (url) {
    if (!url) {
      this.handleError('No path')
    }
    if (url.includes('?')) {
      const service = url.split('?')[0]
      const params = url.split('?')[1]
      let limit = params.split('&').filter(arg => arg.includes('limit'))[0]
      let skip = params.split('&').filter(arg => arg.includes('skip'))[0]
      limit = parseInt(limit.split('=')[1])
      skip = parseInt(skip.split('=')[1])
      const data = this.service(service).items.filter(item => item.id <= limit + skip && item.id > skip)
      const total = this.service(service).items.length
      return Promise.resolve({ data, total })
    } else {
      const service = url.split('/')[0]
      const params = url.split('/')[1]
      return Promise.resolve(this.service(service).items.filter(item => item.id === parseInt(params))[0])
    }
  }
  /**
   * @method seedServices
   * Seeds each service with sample data.
   */
  seedServices () {
    Object.values(this.services).forEach(service => {
      service.generateCachedItems()
    })
  }
  /**
   * @method start
   * Start the app
   */
  start () {
    return this._server.start()
  }
  /**
   * @method restart
   * Restarts the app
   */
   restart () {
    if (this.servicesRegistered.length > 0) {
      this.destroy()
    }
    this.registerServices()
  }
  /**
   * @method destroy
   * Destroys the app
   */
   destroy () {
    Object.values(this.services).forEach(service => {
      service.destroy()
    })
    this.services = {}
    this.server.stop()
  }
}