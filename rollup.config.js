import commonjs from '@rollup/plugin-commonjs'; // Convert CommonJS modules to ES6
import buble from '@rollup/plugin-buble'; // Transpila com considerável suporte a navegadores
import nodePolyfills from 'rollup-plugin-node-polyfills'

const external = [
  'faker',
  'lodash.get',
  '@hapi/hapi',
  'axios',
  'fs',
  'path',
  'events'
]

const globals = {
  'faker': 'faker',
  'lodash.get': 'get',
  '@hapi/hapi': 'hapi',
  'axios': 'axios',
  'fs': 'fs',
  'path': 'path',
  'events': 'EventEmitter'
}

const plugins = [
  commonjs(),
  buble({ transforms: { asyncAwait: false } }), // Transpila para ES5
  nodePolyfills({ fs: true }),
]

export default [{
  input: 'src/server.js', // Caminho relativo ao package.json
  external,
  output: [{
    format: 'cjs',
    file: 'dist/server/index.cjs.js',
    sourcemap: true,
    globals
  }, {
    name: 'MockerApp',
    format: 'umd',
    file: 'dist/server/index.umd.js',
    sourcemap: true,
    globals
  }, {
    format: 'esm',
    file: 'dist/server/index.esm.js',
    sourcemap: true,
    globals
  }],
  plugins
}, {
  input: 'src/client.js', // Caminho relativo ao package.json
  external,
  output: [{
    format: 'cjs',
    file: 'dist/client/index.cjs.js',
    sourcemap: true,
    globals
  }, {
    name: 'MockerApp',
    format: 'umd',
    file: 'dist/client/index.umd.js',
    sourcemap: true,
    globals
  }, {
    format: 'esm',
    file: 'dist/client/index.esm.js',
    sourcemap: true,
    globals
  }],
  plugins
}];