import hapi from '@hapi/hapi';
import EventEmitter from 'events';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import faker from 'faker';
import get from 'lodash.get';

/**
 * Class for the service
 * @extends EventEmitter
 */
var MockerService = /*@__PURE__*/(function (EventEmitter) {
  function MockerService(name, opts, app) {
    EventEmitter.call(this);
    this.app = app;
    this.name = name;
    this.configured = false;
    this.items = [];
    this.startService(opts);
  }

  if ( EventEmitter ) MockerService.__proto__ = EventEmitter;
  MockerService.prototype = Object.create( EventEmitter && EventEmitter.prototype );
  MockerService.prototype.constructor = MockerService;

  var prototypeAccessors = { total: { configurable: true } };
  /**
   * Total items created
   * @type {number}
   */
  prototypeAccessors.total.get = function () { return this.items.length };
  /**
   * @method startService
   * Check the service options and starts configuration
   */
  MockerService.prototype.startService = function startService (opts) {
    var options = opts;
    if (typeof options === 'string') {
      var json = fs.readFileSync(options, { encoding:'utf8' });
      options = JSON.parse(json);
    } else if (Array.isArray(options) || typeof options !== 'object') {
      throw new Error('Options type cannot be "', typeof options, '"')
    }
    this.configureService(options);
  };
  /**
   * @method configureService
   * Configure service
   */
  MockerService.prototype.configureService = function configureService (ref) {
    var schema = ref.schema;
    var total = ref.total; if ( total === void 0 ) total = 10;

    this.schema = schema;
    this._total = total;
    this.app.server && this.registerRoutes();
  };
  /**
   * @method registerRoutes
   * Register service routes
   */
  MockerService.prototype.registerRoutes = function registerRoutes () {
    var this$1 = this;

    var baseRoutes = [{
      method: 'GET',
      path: ("/" + (this.name) + "/{id}"),
      handler: function (request) {
        return this$1.items[request.params.id - 1]
      }
    },{
      method: 'GET',
      path:  ("/" + (this.name)),
      handler: function (request) {
        var itemsToReturn = this$1.items.filter(function (item) {
          var limit = parseInt(request.query.limit) || 4;
          var skip = parseInt(request.query.skip) || 0;
          return item.id <= limit + skip && item.id > skip
        });
        return itemsToReturn
      }
    }];
    this.app.server.route(baseRoutes);
  };
  /**
   * @method generateCachedItems
   * Generate items to data cache mock
   */
  MockerService.prototype.generateCachedItems = function generateCachedItems () {
    this.items = [];
    for (var i = 0; this._total > i; i++) {
      var item = this.generateItem();
      this.items.push(item);
    }
    this.app.log(("generated " + (this.items.length) + " for service " + (this.name)));
  };
  /**
   * @method generateItem
   * Generate a single item based on a schema configuration.
   * @param {Object} schema - Base schema for item generation. defaults to `this.schema`
   * @param {number} id - Id of the item to be generated. defaults to `this.items.length + 1`
   */
  MockerService.prototype.generateItem = function generateItem (schema, id) {
    var sch = schema || this.schema;
    var keys = Object.keys(sch);
    var obj = { id: id || this.items.length + 1 };
    for (var i = 0; keys.length > i; i++) {
      var key = keys[i];
      obj[key] = this.generateProperty(sch[key]);
    }
    return obj
  };
  /**
   * @method generateProperty
   * Generate a single property for an item.
   * @param {string} type - Type of the property. defaults to `string`.
   * @param {number} total - If type is `array` sets the total number of items to be created in the array.
   * @param {number} properties - If type is `object` or `array` and fakerType is set to `object` provides the schema of the object to be generated.
   * @param {string} fakerType - Type of faker to be used. Check the possible [API methods](http://marak.github.io/faker.js/#toc7__anchor)
   */
  MockerService.prototype.generateProperty = function generateProperty (ref) {
    var type = ref.type; if ( type === void 0 ) type = 'string';
    var total = ref.total; if ( total === void 0 ) total = 4;
    var properties = ref.properties; if ( properties === void 0 ) properties = {};
    var fakerType = ref.fakerType; if ( fakerType === void 0 ) fakerType = 'lorem.text';

    if (typeof type === 'array') {
      var items = [];
      for (var i = 0; total > i; i++) {
        if (fakerType === 'object') {
          var obj = this.generateItem(properties, i + 1);
          items.push(obj);
        } else {
          var fakerFunc = get(faker, fakerType)[0];
          if (!fakerFunc) {
            fakerFunc = get(faker, 'lorem.text');
          }
          items.push(fakerFunc());
        }
        return items
      }
    } else if (typeof type === 'object') {
      return this.generateItem(properties, 1)
    } else {
      var fakerFunc$1 = get(faker, fakerType);
      if (!fakerFunc$1) {
        fakerFunc$1 = get(faker, 'lorem.text');
      }
      return fakerFunc$1()
    }
  };
  /**
   * @method destroy
   * Destroys the service
   */
   MockerService.prototype.destroy = function destroy () {
    this.removeAllListeners();
  };
  /**
   * @method find
   * Get many items from the generated cached items
   * @param {number} limit - Number of items to return
   * @returns {array} - Array of items
   */
  MockerService.prototype.find = function find (ref) {
    var this$1 = this;
    var limit = ref.limit; if ( limit === void 0 ) limit = 4;
    var skip = ref.skip; if ( skip === void 0 ) skip = 0;

    return this.app.transport.get(((this.name) + "?limit=" + limit + "&skip=" + skip)).then(function (res) {
      return { data: res.data, total: this$1.total }
    }).catch(function (err) {
      var errMessage = err.response.data.message;
      this$1.emit('error', errMessage);
    })
  };
  /**
   * @method get
   * Get one from the generated cached items
   * @param {number} id - Id of the item to be returned
   * @returns {Object} - Item from the generated cached items
   */
  MockerService.prototype.get = function get (id) {
    var this$1 = this;
    if ( id === void 0 ) id = 1;

    return this.app.transport && this.app.transport.get(((this.name) + "/" + id)).then(function (res) {
      return res.data
    }).catch(function (err) {
      var errMessage = err.response.data.message;
      this$1.emit('error', errMessage);
    })
  };
  /**
   * @method createStore
   * Create a vuex module based on the service
   * @returns {Object} - Vuex Module
   */
  MockerService.prototype.createStore = function createStore () {
    return {
      namespaced: true,
      static: {
        items: [],
        total: 0
      },
      mutations: {
        ADD_ITEM_TO_STORE: function ADD_ITEM_TO_STORE (state, item) {
          var exists = !!state.items.filter(function (i) { return i.id === item.id; })[0];
          if (!exists) {
            state.items.push(item);
          }
        },
        UPDATE_TOTAL: function UPDATE_TOTAL (state, total) {
          state.total = total;
        }
      },
      actions: {
        findItems: function findItems (ref, ref$1) {
          var commit = ref.commit;
          var limit = ref$1.limit;
          var skip = ref$1.skip;

          return this.find(limit, skip).then(function (res) {
            commit('UPDATE_TOTAL', res.total);
            res.data.forEach(function (item) {
              commit('ADD_ITEM_TO_STORE', item);
            });
          })
        },
        getItem: function getItem (id) {
          return this.get(id).then(function (item) {
            commit('ADD_ITEM_TO_STORE', item);
          })
        }
      },
      getters: {
        getById: function (state) { return function (id) {
          return state.items.filter(function (item) { return item.id === id; })[0]
        }; },
        findInStore: function (state) { return function (limit, skip) {
          if ( limit === void 0 ) limit = 4;
          if ( skip === void 0 ) skip = 0;

          return state.items.filter(function (item) { return item.id <= limit + skip && item.id > skip; })
        }; }
      }
    }
  };

  Object.defineProperties( MockerService.prototype, prototypeAccessors );

  return MockerService;
}(EventEmitter));

/**
 * Class for the client app to request data from the server
 * @extends EventEmitter
 */
var MockerCore = /*@__PURE__*/(function (EventEmitter) {
  function MockerCore(ref) {
    var port = ref.port; if ( port === void 0 ) port = 3001;
    var host = ref.host; if ( host === void 0 ) host = 'localhost';
    var services = ref.services; if ( services === void 0 ) services = {};
    var servicesPath = ref.servicesPath;
    var debug = ref.debug; if ( debug === void 0 ) debug = false;

    EventEmitter.call(this);
    this.services = {};
    this._host = host;
    this._port = port;
    this._services = services;
    this._servicesPath = servicesPath;
    this.debug = debug;
    this.transport = axios.create({
      baseURL: 'http://' + this._host + ':' + this._port + '/'
    });
  }

  if ( EventEmitter ) MockerCore.__proto__ = EventEmitter;
  MockerCore.prototype = Object.create( EventEmitter && EventEmitter.prototype );
  MockerCore.prototype.constructor = MockerCore;

  var prototypeAccessors = { host: { configurable: true },port: { configurable: true },servicesRegistered: { configurable: true } };
  /**
   * Getter for the host option
   * @type {string}
   */
  prototypeAccessors.host.get = function () { return this._host };
  /**
   * Getter for the port option
   * @type {string|number}
   */
  prototypeAccessors.port.get = function () { return this._port };
  /**
   * Array of names of the registered services
   * @type {array}
   */
  prototypeAccessors.servicesRegistered.get = function () { return Object.keys(this.services) };
  /**
   * @method registerServices
   * Create and register each service passed in options.
   * If a `servicePath` is provided, it will overide the `services` provided
   */
  MockerCore.prototype.registerServices = function registerServices () {
    var this$1 = this;

    this.services = {};
    if (this._servicesPath) {
      var pahtJoin = path.join(this._servicesPath);
      fs.readdirSync(pahtJoin).forEach(function (file) {
        var serviceName = this$1.checkFile(file);
        if (serviceName) {
          this$1.registerService(serviceName, pahtJoin + "/" + file);
        }
      });
    } else if (this._services && Object.keys(this._services).length > 0) {
      Object.keys(this._services).forEach(function (key) {
        var serviceName = key;
        var serviceConfig = this$1._services[serviceName];
        this$1.registerService(serviceName, serviceConfig);
      });
    } else {
      this.handleError('No services found');
    }
    if (this.servicesRegistered.length === 0) {
      this.handleError('No services found');
    }
  };
  /**
   * @method registerService
   * Create and register a single service.
   * @param {string} serviceName - Name of the service
   * @param {object|string} serviceConfig - Config of the service
   */
  MockerCore.prototype.registerService = function registerService (serviceName, serviceConfig) {
    this.log(("Registering " + serviceName + " service"));
    var service = new MockerService(serviceName, serviceConfig, this);
    this.services[serviceName] = service;
    this.log((serviceName + " registered"));
    this.log(this.servicesRegistered);
  };
  /**
   * @method checkFile
   * Check a filename if it a json and returns it's name
   * @param {string} file - file name with format
   * @returns {string|null} name of the file or null if the file is not a json
   */
  MockerCore.prototype.checkFile = function checkFile (file) {
    var name = file.split('.');
    var format = name.pop();
    var isService = format === 'json';
    return isService ? name.join('.') : null
  };
  /**
   * @method service
   * Start the app
   * @param {string} serviceName - Name of the service
   * @returns {MockerService}
   */
  MockerCore.prototype.service = function service (serviceName) {
    if (!this.services[serviceName]) {
      this.handleError(("No service with the name " + serviceName + " registered"));
    }
    return this.services[serviceName]
  };
  /**
   * @method onError
   * Handle error
   * @param err - Error message
   */
  MockerCore.prototype.handleError = function handleError (err) {
    this.emit('error', err);
    throw new Error(err)
  };
  /**
   * @method log
   * Handle log
   * @param msg - Message to log
   */
  MockerCore.prototype.log = function log (msg) {
    this.debug && console.log(msg);
  };

  Object.defineProperties( MockerCore.prototype, prototypeAccessors );

  return MockerCore;
}(EventEmitter));

/**
 * Class for the server app to create mock data
 * @extends EventEmitter
 */
var MockerServer = /*@__PURE__*/(function (MockerCore) {
  function MockerServer() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    MockerCore.apply(this, args);
    this.createServer();
    this.registerServices();
    this.seedServices();
  }

  if ( MockerCore ) MockerServer.__proto__ = MockerCore;
  MockerServer.prototype = Object.create( MockerCore && MockerCore.prototype );
  MockerServer.prototype.constructor = MockerServer;

  var prototypeAccessors = { server: { configurable: true } };
  /**
   * Getter for the hapi server
   * @type {Object} Hapi server
   */
  prototypeAccessors.server.get = function () { return this._server };
  /**
   * @method createServer
   * Instantiate hapi server
   */
  MockerServer.prototype.createServer = function createServer () {
    this._server = hapi.server({
      port: this._port,
      host: this._host,
      routes: {
        cors: true
      }
    });
  };
  /**
   * @method seedServices
   * Seeds each service with sample data.
   */
  MockerServer.prototype.seedServices = function seedServices () {
    Object.values(this.services).forEach(function (service) {
      service.generateCachedItems();
    });
  };
  /**
   * @method start
   * Start the app
   */
  MockerServer.prototype.start = function start () {
    return this._server.start()
  };
  /**
   * @method restart
   * Restarts the app
   */
   MockerServer.prototype.restart = function restart () {
    if (this.servicesRegistered.length > 0) {
      this.destroy();
    }
    this.registerServices();
  };
  /**
   * @method destroy
   * Destroys the app
   */
   MockerServer.prototype.destroy = function destroy () {
    Object.values(this.services).forEach(function (service) {
      service.destroy();
    });
    this.services = {};
    this.server.stop();
  };

  Object.defineProperties( MockerServer.prototype, prototypeAccessors );

  return MockerServer;
}(MockerCore));

export { MockerServer };
