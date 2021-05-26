import commonjs from '@rollup/plugin-commonjs'; // Convert CommonJS modules to ES6
import buble from '@rollup/plugin-buble'; // Transpila com considerável suporte a navegadores
import builtins from 'rollup-plugin-node-builtins'
import nodeGlobals from 'rollup-plugin-node-globals'
import resolve from 'rollup-plugin-node-resolve'
import { uglify } from 'rollup-plugin-uglify'

const external = [
  'faker',
  '@hapi/hapi'
]

const globals = {
  'faker': 'faker',
  '@hapi/hapi': 'hapi'
}

const plugins = [
  nodeGlobals(),
  builtins(),
  resolve({
    preferBuiltins: false
  }),
  commonjs(),
  buble({ transforms: { asyncAwait: false } }), // Transpila para ES5
]

export default [{
  input: 'src/server.js', // Caminho relativo ao package.json
  external,
  plugins,
  output: [{
    name: 'MockerServer',
    format: 'umd',
    file: 'dist/server/index.umd.js',
    sourcemap: true,
    globals
  }]
}, {
  input: 'src/client.js', // Caminho relativo ao package.json
  external,
  plugins,
  output: [{
    name: 'MockeClient',
    format: 'iife',
    file: 'dist/client/index.min.js',
    sourcemap: true,
    globals,
    plugins: [
      uglify()
    ]
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
  }]
}];