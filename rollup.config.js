import { terser } from 'rollup-plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';

import pkg from './package.json';

const babelRuntime = babel({
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

const babelBoundle = babel({
  babelrc: false,
  babelHelpers: 'bundled',
  sourceMaps: true,
  inputSourceMap: true,
  exclude: "node_modules/**",
  presets: [],
  plugins: [
    "@babel/plugin-proposal-class-properties",
  ]
});

export default [
  // Browser-friendly UMD build
  {
    input: 'src/index.umd.js',
    output: [
      { name: 'lilu', file: pkg.browser, format: 'umd', sourcemap: true },
      { name: 'lilu', file: pkg.browser.replace('.js', '.min.js'), format: 'umd', sourcemap: true, plugins: [terser()] },
    ],
    external: [],
    plugins: [
      json(),
      resolve({ preferBuiltins: false, browser: true }),
      babelRuntime,
      commonjs()
    ]
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  {
    input: 'src/index.js',
    external: Object.keys(pkg.dependencies),
    plugins: [
      resolve(),
      babelBoundle,
      commonjs()
    ],
    output: [
      { file: pkg.main, format: 'cjs', sourcemap: true },
      { file: pkg.module, format: 'es', sourcemap: true }
    ]
  }
];
