import faker from 'faker'
import MockerCore from '../core/core.js'
/**
 * Class for the server app to create mock data
 * @extends MockerCore
 */
export default class MockerTest extends MockerCore {
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
    this.registerServices()
    this.seedServices()
  }
}