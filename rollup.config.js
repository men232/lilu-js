import { terser } from 'rollup-plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';

import pkg from './package.json';

const babelPlugin = babel({
  babelrc: false,
  babelHelpers: 'runtime',
  sourceMaps: true,
  inputSourceMap: true,
  exclude: "node_modules/**",
  presets: [
    ["@babel/env", { "modules": false }]
  ],
  plugins: [
    "@babel/plugin-proposal-class-properties",
    ["@babel/plugin-transform-runtime", {
      "helpers": true,
      "regenerator": true
    }]
  ]
});

export default [
  // browser-friendly UMD build
  {
    input: 'src/index.js',
    output: [
      { name: 'LiluJS', file: pkg.browser, format: 'umd', sourcemap: true },
      { name: 'LiluJS', file: pkg.browser.replace('.js', '.min.js'), format: 'umd', sourcemap: true, plugins: [terser()] },
    ],
    external: [],
    plugins: [
      json(),
      resolve({ preferBuiltins: false, browser: true }),
      babelPlugin,
      commonjs()
    ]
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    input: 'src/index.js',
    external: Object.keys(pkg.dependencies),
    plugins: [
      resolve(),
      babelPlugin,
      commonjs()
    ],
    output: [
      { file: pkg.main, format: 'cjs', sourcemap: true },
      { file: pkg.module, format: 'es', sourcemap: true }
    ]
  }
];
