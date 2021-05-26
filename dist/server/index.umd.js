(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@hapi/hapi'), require('faker')) :
  typeof define === 'function' && define.amd ? define(['exports', '@hapi/hapi', 'faker'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.MockerServer = {}, global.hapi, global.faker));
}(this, (function (exports, hapi, faker) { 'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var hapi__default = /*#__PURE__*/_interopDefaultLegacy(hapi);
  var faker__default = /*#__PURE__*/_interopDefaultLegacy(faker);

  var domain;

  // This constructor is used to store event handlers. Instantiating this is
  // faster than explicitly calling `Object.create(null)` to get a "clean" empty
  // object (tested with v8 v4.9).
  function EventHandlers() {}
  EventHandlers.prototype = Object.create(null);

  function EventEmitter() {
    EventEmitter.init.call(this);
  }

  // nodejs oddity
  // require('events') === require('events').EventEmitter
  EventEmitter.EventEmitter = EventEmitter;

  EventEmitter.usingDomains = false;

  EventEmitter.prototype.domain = undefined;
  EventEmitter.prototype._events = undefined;
  EventEmitter.prototype._maxListeners = undefined;

  // By default EventEmitters will print a warning if more than 10 listeners are
  // added to it. This is a useful default which helps finding memory leaks.
  EventEmitter.defaultMaxListeners = 10;

  EventEmitter.init = function() {
    this.domain = null;
    if (EventEmitter.usingDomains) {
      // if there is an active domain, then attach to it.
      if (domain.active ) ;
    }

    if (!this._events || this._events === Object.getPrototypeOf(this)._events) {
      this._events = new EventHandlers();
      this._eventsCount = 0;
    }

    this._maxListeners = this._maxListeners || undefined;
  };

  // Obviously not all Emitters should be limited to 10. This function allows
  // that to be increased. Set to zero for unlimited.
  EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
    if (typeof n !== 'number' || n < 0 || isNaN(n))
      { throw new TypeError('"n" argument must be a positive number'); }
    this._maxListeners = n;
    return this;
  };

  function $getMaxListeners(that) {
    if (that._maxListeners === undefined)
      { return EventEmitter.defaultMaxListeners; }
    return that._maxListeners;
  }

  EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
    return $getMaxListeners(this);
  };

  // These standalone emit* functions are used to optimize calling of event
  // handlers for fast cases because emit() itself often has a variable number of
  // arguments and can be deoptimized because of that. These functions always have
  // the same number of arguments and thus do not get deoptimized, so the code
  // inside them can execute faster.
  function emitNone(handler, isFn, self) {
    if (isFn)
      { handler.call(self); }
    else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);
      for (var i = 0; i < len; ++i)
        { listeners[i].call(self); }
    }
  }
  function emitOne(handler, isFn, self, arg1) {
    if (isFn)
      { handler.call(self, arg1); }
    else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);
      for (var i = 0; i < len; ++i)
        { listeners[i].call(self, arg1); }
    }
  }
  function emitTwo(handler, isFn, self, arg1, arg2) {
    if (isFn)
      { handler.call(self, arg1, arg2); }
    else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);
      for (var i = 0; i < len; ++i)
        { listeners[i].call(self, arg1, arg2); }
    }
  }
  function emitThree(handler, isFn, self, arg1, arg2, arg3) {
    if (isFn)
      { handler.call(self, arg1, arg2, arg3); }
    else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);
      for (var i = 0; i < len; ++i)
        { listeners[i].call(self, arg1, arg2, arg3); }
    }
  }

  function emitMany(handler, isFn, self, args) {
    if (isFn)
      { handler.apply(self, args); }
    else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);
      for (var i = 0; i < len; ++i)
        { listeners[i].apply(self, args); }
    }
  }

  EventEmitter.prototype.emit = function emit(type) {
    var arguments$1 = arguments;

    var er, handler, len, args, i, events, domain;
    var doError = (type === 'error');

    events = this._events;
    if (events)
      { doError = (doError && events.error == null); }
    else if (!doError)
      { return false; }

    domain = this.domain;

    // If there is no 'error' event listener then throw.
    if (doError) {
      er = arguments[1];
      if (domain) {
        if (!er)
          { er = new Error('Uncaught, unspecified "error" event'); }
        er.domainEmitter = this;
        er.domain = domain;
        er.domainThrown = false;
        domain.emit('error', er);
      } else if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
      return false;
    }

    handler = events[type];

    if (!handler)
      { return false; }

    var isFn = typeof handler === 'function';
    len = arguments.length;
    switch (len) {
      // fast cases
      case 1:
        emitNone(handler, isFn, this);
        break;
      case 2:
        emitOne(handler, isFn, this, arguments[1]);
        break;
      case 3:
        emitTwo(handler, isFn, this, arguments[1], arguments[2]);
        break;
      case 4:
        emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
        break;
      // slower
      default:
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          { args[i - 1] = arguments$1[i]; }
        emitMany(handler, isFn, this, args);
    }

    return true;
  };

  function _addListener(target, type, listener, prepend) {
    var m;
    var events;
    var existing;

    if (typeof listener !== 'function')
      { throw new TypeError('"listener" argument must be a function'); }

    events = target._events;
    if (!events) {
      events = target._events = new EventHandlers();
      target._eventsCount = 0;
    } else {
      // To avoid recursion in the case that type === "newListener"! Before
      // adding it to the listeners, first emit "newListener".
      if (events.newListener) {
        target.emit('newListener', type,
                    listener.listener ? listener.listener : listener);

        // Re-assign `events` because a newListener handler could have caused the
        // this._events to be assigned to a new object
        events = target._events;
      }
      existing = events[type];
    }

    if (!existing) {
      // Optimize the case of one listener. Don't need the extra array object.
      existing = events[type] = listener;
      ++target._eventsCount;
    } else {
      if (typeof existing === 'function') {
        // Adding the second element, need to change to array.
        existing = events[type] = prepend ? [listener, existing] :
                                            [existing, listener];
      } else {
        // If we've already got an array, just append.
        if (prepend) {
          existing.unshift(listener);
        } else {
          existing.push(listener);
        }
      }

      // Check for listener leak
      if (!existing.warned) {
        m = $getMaxListeners(target);
        if (m && m > 0 && existing.length > m) {
          existing.warned = true;
          var w = new Error('Possible EventEmitter memory leak detected. ' +
                              existing.length + ' ' + type + ' listeners added. ' +
                              'Use emitter.setMaxListeners() to increase limit');
          w.name = 'MaxListenersExceededWarning';
          w.emitter = target;
          w.type = type;
          w.count = existing.length;
          emitWarning(w);
        }
      }
    }

    return target;
  }
  function emitWarning(e) {
    typeof console.warn === 'function' ? console.warn(e) : console.log(e);
  }
  EventEmitter.prototype.addListener = function addListener(type, listener) {
    return _addListener(this, type, listener, false);
  };

  EventEmitter.prototype.on = EventEmitter.prototype.addListener;

  EventEmitter.prototype.prependListener =
      function prependListener(type, listener) {
        return _addListener(this, type, listener, true);
      };

  function _onceWrap(target, type, listener) {
    var fired = false;
    function g() {
      target.removeListener(type, g);
      if (!fired) {
        fired = true;
        listener.apply(target, arguments);
      }
    }
    g.listener = listener;
    return g;
  }

  EventEmitter.prototype.once = function once(type, listener) {
    if (typeof listener !== 'function')
      { throw new TypeError('"listener" argument must be a function'); }
    this.on(type, _onceWrap(this, type, listener));
    return this;
  };

  EventEmitter.prototype.prependOnceListener =
      function prependOnceListener(type, listener) {
        if (typeof listener !== 'function')
          { throw new TypeError('"listener" argument must be a function'); }
        this.prependListener(type, _onceWrap(this, type, listener));
        return this;
      };

  // emits a 'removeListener' event iff the listener was removed
  EventEmitter.prototype.removeListener =
      function removeListener(type, listener) {
        var list, events, position, i, originalListener;

        if (typeof listener !== 'function')
          { throw new TypeError('"listener" argument must be a function'); }

        events = this._events;
        if (!events)
          { return this; }

        list = events[type];
        if (!list)
          { return this; }

        if (list === listener || (list.listener && list.listener === listener)) {
          if (--this._eventsCount === 0)
            { this._events = new EventHandlers(); }
          else {
            delete events[type];
            if (events.removeListener)
              { this.emit('removeListener', type, list.listener || listener); }
          }
        } else if (typeof list !== 'function') {
          position = -1;

          for (i = list.length; i-- > 0;) {
            if (list[i] === listener ||
                (list[i].listener && list[i].listener === listener)) {
              originalListener = list[i].listener;
              position = i;
              break;
            }
          }

          if (position < 0)
            { return this; }

          if (list.length === 1) {
            list[0] = undefined;
            if (--this._eventsCount === 0) {
              this._events = new EventHandlers();
              return this;
            } else {
              delete events[type];
            }
          } else {
            spliceOne(list, position);
          }

          if (events.removeListener)
            { this.emit('removeListener', type, originalListener || listener); }
        }

        return this;
      };

  EventEmitter.prototype.removeAllListeners =
      function removeAllListeners(type) {
        var listeners, events;

        events = this._events;
        if (!events)
          { return this; }

        // not listening for removeListener, no need to emit
        if (!events.removeListener) {
          if (arguments.length === 0) {
            this._events = new EventHandlers();
            this._eventsCount = 0;
          } else if (events[type]) {
            if (--this._eventsCount === 0)
              { this._events = new EventHandlers(); }
            else
              { delete events[type]; }
          }
          return this;
        }

        // emit removeListener for all listeners on all events
        if (arguments.length === 0) {
          var keys = Object.keys(events);
          for (var i = 0, key; i < keys.length; ++i) {
            key = keys[i];
            if (key === 'removeListener') { continue; }
            this.removeAllListeners(key);
          }
          this.removeAllListeners('removeListener');
          this._events = new EventHandlers();
          this._eventsCount = 0;
          return this;
        }

        listeners = events[type];

        if (typeof listeners === 'function') {
          this.removeListener(type, listeners);
        } else if (listeners) {
          // LIFO order
          do {
            this.removeListener(type, listeners[listeners.length - 1]);
          } while (listeners[0]);
        }

        return this;
      };

  EventEmitter.prototype.listeners = function listeners(type) {
    var evlistener;
    var ret;
    var events = this._events;

    if (!events)
      { ret = []; }
    else {
      evlistener = events[type];
      if (!evlistener)
        { ret = []; }
      else if (typeof evlistener === 'function')
        { ret = [evlistener.listener || evlistener]; }
      else
        { ret = unwrapListeners(evlistener); }
    }

    return ret;
  };

  EventEmitter.listenerCount = function(emitter, type) {
    if (typeof emitter.listenerCount === 'function') {
      return emitter.listenerCount(type);
    } else {
      return listenerCount.call(emitter, type);
    }
  };

  EventEmitter.prototype.listenerCount = listenerCount;
  function listenerCount(type) {
    var events = this._events;

    if (events) {
      var evlistener = events[type];

      if (typeof evlistener === 'function') {
        return 1;
      } else if (evlistener) {
        return evlistener.length;
      }
    }

    return 0;
  }

  EventEmitter.prototype.eventNames = function eventNames() {
    return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
  };

  // About 1.5x faster than the two-arg version of Array#splice().
  function spliceOne(list, index) {
    for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
      { list[i] = list[k]; }
    list.pop();
  }

  function arrayClone(arr, i) {
    var copy = new Array(i);
    while (i--)
      { copy[i] = arr[i]; }
    return copy;
  }

  function unwrapListeners(arr) {
    var ret = new Array(arr.length);
    for (var i = 0; i < ret.length; ++i) {
      ret[i] = arr[i].listener || arr[i];
    }
    return ret;
  }

  var fs = {};

  // Copyright Joyent, Inc. and other Node contributors.
  //
  // Permission is hereby granted, free of charge, to any person obtaining a
  // copy of this software and associated documentation files (the
  // "Software"), to deal in the Software without restriction, including
  // without limitation the rights to use, copy, modify, merge, publish,
  // distribute, sublicense, and/or sell copies of the Software, and to permit
  // persons to whom the Software is furnished to do so, subject to the
  // following conditions:
  //
  // The above copyright notice and this permission notice shall be included
  // in all copies or substantial portions of the Software.
  //
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
  // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
  // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
  // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
  // USE OR OTHER DEALINGS IN THE SOFTWARE.

  // resolves . and .. elements in a path array with directory names there
  // must be no slashes, empty elements, or device names (c:\) in the array
  // (so also no leading and trailing slashes - it does not distinguish
  // relative and absolute paths)
  function normalizeArray(parts, allowAboveRoot) {
    // if the path tries to go above the root, `up` ends up > 0
    var up = 0;
    for (var i = parts.length - 1; i >= 0; i--) {
      var last = parts[i];
      if (last === '.') {
        parts.splice(i, 1);
      } else if (last === '..') {
        parts.splice(i, 1);
        up++;
      } else if (up) {
        parts.splice(i, 1);
        up--;
      }
    }

    // if the path is allowed to go above the root, restore leading ..s
    if (allowAboveRoot) {
      for (; up--; up) {
        parts.unshift('..');
      }
    }

    return parts;
  }

  // Split a filename into [root, dir, basename, ext], unix version
  // 'root' is just a slash, or nothing.
  var splitPathRe =
      /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
  var splitPath = function(filename) {
    return splitPathRe.exec(filename).slice(1);
  };

  // path.resolve([from ...], to)
  // posix version
  function resolve() {
    var arguments$1 = arguments;

    var resolvedPath = '',
        resolvedAbsolute = false;

    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path = (i >= 0) ? arguments$1[i] : '/';

      // Skip empty and invalid entries
      if (typeof path !== 'string') {
        throw new TypeError('Arguments to path.resolve must be strings');
      } else if (!path) {
        continue;
      }

      resolvedPath = path + '/' + resolvedPath;
      resolvedAbsolute = path.charAt(0) === '/';
    }

    // At this point the path should be resolved to a full absolute path, but
    // handle relative paths to be safe (might happen when process.cwd() fails)

    // Normalize the path
    resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
      return !!p;
    }), !resolvedAbsolute).join('/');

    return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
  }
  // path.normalize(path)
  // posix version
  function normalize(path) {
    var isPathAbsolute = isAbsolute(path),
        trailingSlash = substr(path, -1) === '/';

    // Normalize the path
    path = normalizeArray(filter(path.split('/'), function(p) {
      return !!p;
    }), !isPathAbsolute).join('/');

    if (!path && !isPathAbsolute) {
      path = '.';
    }
    if (path && trailingSlash) {
      path += '/';
    }

    return (isPathAbsolute ? '/' : '') + path;
  }
  // posix version
  function isAbsolute(path) {
    return path.charAt(0) === '/';
  }

  // posix version
  function join() {
    var paths = Array.prototype.slice.call(arguments, 0);
    return normalize(filter(paths, function(p, index) {
      if (typeof p !== 'string') {
        throw new TypeError('Arguments to path.join must be strings');
      }
      return p;
    }).join('/'));
  }


  // path.relative(from, to)
  // posix version
  function relative(from, to) {
    from = resolve(from).substr(1);
    to = resolve(to).substr(1);

    function trim(arr) {
      var start = 0;
      for (; start < arr.length; start++) {
        if (arr[start] !== '') { break; }
      }

      var end = arr.length - 1;
      for (; end >= 0; end--) {
        if (arr[end] !== '') { break; }
      }

      if (start > end) { return []; }
      return arr.slice(start, end - start + 1);
    }

    var fromParts = trim(from.split('/'));
    var toParts = trim(to.split('/'));

    var length = Math.min(fromParts.length, toParts.length);
    var samePartsLength = length;
    for (var i = 0; i < length; i++) {
      if (fromParts[i] !== toParts[i]) {
        samePartsLength = i;
        break;
      }
    }

    var outputParts = [];
    for (var i = samePartsLength; i < fromParts.length; i++) {
      outputParts.push('..');
    }

    outputParts = outputParts.concat(toParts.slice(samePartsLength));

    return outputParts.join('/');
  }

  var sep = '/';
  var delimiter = ':';

  function dirname(path) {
    var result = splitPath(path),
        root = result[0],
        dir = result[1];

    if (!root && !dir) {
      // No dirname whatsoever
      return '.';
    }

    if (dir) {
      // It has a dirname, strip trailing slash
      dir = dir.substr(0, dir.length - 1);
    }

    return root + dir;
  }

  function basename(path, ext) {
    var f = splitPath(path)[2];
    // TODO: make this comparison case-insensitive on windows?
    if (ext && f.substr(-1 * ext.length) === ext) {
      f = f.substr(0, f.length - ext.length);
    }
    return f;
  }


  function extname(path) {
    return splitPath(path)[3];
  }
  var path = {
    extname: extname,
    basename: basename,
    dirname: dirname,
    sep: sep,
    delimiter: delimiter,
    relative: relative,
    join: join,
    isAbsolute: isAbsolute,
    normalize: normalize,
    resolve: resolve
  };
  function filter (xs, f) {
      if (xs.filter) { return xs.filter(f); }
      var res = [];
      for (var i = 0; i < xs.length; i++) {
          if (f(xs[i], i, xs)) { res.push(xs[i]); }
      }
      return res;
  }

  // String.prototype.substr - negative index don't work in IE8
  var substr = 'ab'.substr(-1) === 'b' ?
      function (str, start, len) { return str.substr(start, len) } :
      function (str, start, len) {
          if (start < 0) { start = str.length + start; }
          return str.substr(start, len);
      }
  ;

  /**
   * Class for the service
   * @extends EventEmitter
   */
  var MockerService = /*@__PURE__*/(function (EventEmitter) {
    function MockerService(name, opts, app, faker) {
      if ( faker === void 0 ) faker = {};

      EventEmitter.call(this);
      this.app = app;
      this.faker = faker; // Faker is passed from the app so don't need to bundle it in the client version
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
      var schema = ref.schema; if ( schema === void 0 ) schema = {};
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

      if (!this.faker) {
        return
      }
      if (typeof type === 'array') {
        var items = [];
        for (var i = 0; total > i; i++) {
          if (fakerType === 'object') {
            var obj = this.generateItem(properties, i + 1);
            items.push(obj);
          } else {
            var props = fakerType.split('.');
            if (props.length < 2) {
              this.app.handleError('missing props');
            }
            var fakerFunc = this.faker[props[0]][props[1]];
            if (!fakerFunc) {
              fakerFunc = this.faker.lorem.text;
            }
            items.push(fakerFunc());
          }
          return items
        }
      } else if (typeof type === 'object') {
        return this.generateItem(properties, 1)
      } else {
        var props$1 = fakerType.split('.');
        if (props$1.length < 2) {
          this.app.handleError('missing props');
        }
        var fakerFunc$1 = this.faker[props$1[0]][props$1[1]];
        if (!fakerFunc$1) {
          fakerFunc$1 = this.faker.lorem.text;
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

      return this.app.transport.get(((this.name) + "/" + id)).then(function (res) {
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
      var self = this;
      return {
        namespaced: true,
        state: {
          items: [],
          total: 0,
          isFindPending: false,
          isGetPending: false
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
          },
          IS_FIND_PENDING: function IS_FIND_PENDING (state) {
            state.isFindPending = true;
          },
          FIND_FINISHED: function FIND_FINISHED (state) {
            state.isFindPending = false;
          },
          IS_GET_PENDING: function IS_GET_PENDING (state) {
            state.isGetPending = true;
          },
          GET_FINISHED: function GET_FINISHED (state) {
            state.isGetPending = false;
          }
        },
        actions: {
          findItems: function findItems (ref, ref$1) {
            var commit = ref.commit;
            var limit = ref$1.limit;
            var skip = ref$1.skip;

            commit('IS_FIND_PENDING');
            return self.find({ limit: limit, skip: skip }).then(function (res) {
              commit('UPDATE_TOTAL', res.total);
              res.data.forEach(function (item) {
                commit('ADD_ITEM_TO_STORE', item);
              });
            }).finally(function () {
              commit('FIND_FINISHED');
            })
          },
          getItem: function getItem (id) {
            commit('IS_GET_PENDING');
            return self.get(id).then(function (item) {
              commit('ADD_ITEM_TO_STORE', item);
            }).finally(function () {
              commit('GET_FINISHED');
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
      this.faker = {};
      this._host = host;
      this._port = port;
      this._services = services;
      this._servicesPath = servicesPath;
      this.debug = debug;
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
      var service = new MockerService(serviceName, serviceConfig, this, this.faker);
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
    function MockerServer(args) {
      var this$1 = this;

      MockerCore.call(this, args);
      this.faker = faker__default['default'];
      this.transport = {
        get: function (url) { return this$1.transportGet(url); }
      };
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
      this._server = hapi__default['default'].server({
        port: this._port,
        host: this._host,
        routes: {
          cors: true
        }
      });
    };
    /**
     * @method transportGet
     * Mocks a url request
     */
    MockerServer.prototype.transportGet = function transportGet (url) {
      if (!url) {
        this.handleError('No path');
      }
      if (url.includes('?')) {
        var service = url.split('?')[0];
        var params = url.split('?')[1];
        var limit = params.split('&').filter(function (arg) { return arg.includes('limit'); })[0];
        var skip = params.split('&').filter(function (arg) { return arg.includes('skip'); })[0];
        limit = parseInt(limit.split('=')[1]);
        skip = parseInt(skip.split('=')[1]);
        var data = this.service(service).items.filter(function (item) { return item.id <= limit + skip && item.id > skip; });
        var total = this.service(service).items.length;
        return Promise.resolve({ data: data, total: total })
      } else {
        var service$1 = url.split('/')[0];
        var params$1 = url.split('/')[1];
        return Promise.resolve(this.service(service$1).items.filter(function (item) { return item.id === parseInt(params$1); })[0])
      }
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

  exports.MockerServer = MockerServer;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=index.umd.js.map
