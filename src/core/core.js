import fs from 'fs'
import path from 'path'
import EventEmitter from 'events'
import MockerService from '../service/service.js'
/**
 * Class for the client app to request data from the server
 * @extends EventEmitter
 */
export default class MockerCore extends EventEmitter {
  /**
   * Create mock app
   * @param {Object} options - Options for the app creation
   * @param {string} options.host - host app will be on. default = localhost
   * @param {string} options.port - port the app will listen to. default = 3001
   * @param {object} options.services - services configuration, each `key` will be one service. To check options see MockerService class
   * @param {string} options.servicesPath - path to a folder containing a json file for each service, with configuration options.
   * @param {boolean} options.debug - debug mode.
   */
  constructor({ port = 3001, host = 'localhost', services = {}, servicesPath, debug = false }) {
    super()
    this.services = {}
    this.faker = {}
    this._host = host
    this._port = port
    this._services = services
    this._servicesPath = servicesPath
    this.debug = debug
    this.transport = {
      get: url => this.transportGet(url)
    }
  }
  /**
   * Getter for the host option
   * @type {string}
   */
  get host () { return this._host }
  /**
   * Getter for the port option
   * @type {string|number}
   */
  get port () { return this._port }
  /**
   * Array of names of the registered services
   * @type {array}
   */
  get servicesRegistered () { return Object.keys(this.services) }
  /**
   * @method registerServices
   * Create and register each service passed in options.
   * If a `servicePath` is provided, it will overide the `services` provided
   */
  registerServices () {
    this.services = {}
    if (this._servicesPath) {
      const pahtJoin = path.join(this._servicesPath)
      fs.readdirSync(pahtJoin).forEach(file => {
        const serviceName = this.checkFile(file)
        if (serviceName) {
          this.registerService(serviceName, pahtJoin + `/${file}`)
        }
      })
    } else if (this._services && Object.keys(this._services).length > 0) {
      Object.keys(this._services).forEach(key => {
        const serviceName = key
        const serviceConfig = this._services[serviceName]
        this.registerService(serviceName, serviceConfig)
      })
    } else {
      this.handleError('No services found')
    }
    if (this.servicesRegistered.length === 0) {
      this.handleError('No services found')
    }
  }
  /**
   * @method registerService
   * Create and register a single service.
   * @param {string} serviceName - Name of the service
   * @param {object|string} serviceConfig - Config of the service
   */
  registerService (serviceName, serviceConfig) {
    this.log(`Registering ${serviceName} service`)
    const service = new MockerService(serviceName, serviceConfig, this, this.faker)
    this.services[serviceName] = service
    this.log(`${serviceName} registered`)
    this.log(this.servicesRegistered)
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
      return Promise.resolve({ data: this.service(service).items.filter(item => item.id === parseInt(params))[0] })
    }
  }
  /**
   * @method checkFile
   * Check a filename if it a json and returns it's name
   * @param {string} file - file name with format
   * @returns {string|null} name of the file or null if the file is not a json
   */
  checkFile (file) {
    const name = file.split('.')
    const format = name.pop()
    const isService = format === 'json'
    return isService ? name.join('.') : null
  }
  /**
   * @method service
   * Start the app
   * @param {string} serviceName - Name of the service
   * @returns {MockerService}
   */
  service (serviceName) {
    if (!this.services[serviceName]) {
      this.handleError(`No service with the name ${serviceName} registered`)
    }
    return this.services[serviceName]
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
   * @method onError
   * Handle error
   * @param err - Error message
   */
  handleError (err) {
    this.emit('error', err)
    throw new Error(err)
  }
  /**
   * @method log
   * Handle log
   * @param msg - Message to log
   */
  log (msg) {
    this.debug && console.log(msg)
  }
}