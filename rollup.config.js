import { terser } from 'rollup-plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';

import pkg from './package.json';
import babelBrowser from './babel.browser.json';
import babelNode from './babel.node.json';

const extensions = [
  '.js', '.jsx', '.ts', '.tsx',
];

const name = 'lilu';

export default [
  // Browser-friendly UMD build
  {
    input: 'lib/index.umd.ts',
    output: [
      { name, file: './' + pkg.browser, format: 'umd', sourcemap: true },
      { name, file: './' + pkg.browser.replace('.js', '.min.js'), format: 'umd', sourcemap: true, plugins: [terser()] },
    ],
    external: [],
    plugins: [
      json(),
      // Allows node_modules resolution
      resolve({ extensions, preferBuiltins: false, browser: true }),

      // Allow bundling cjs modules. Rollup doesn't understand cjs
      commonjs(),

      // Compile TypeScript/JavaScript files
      babel({ ...babelBrowser, extensions, include: ['lib/**/*'], babelHelpers: 'runtime' }),
    ]
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  {
    input: 'lib/index.ts',
    external: Object.keys(pkg.dependencies),
    plugins: [
      // Allows node_modules resolution
      resolve({ extensions }),

      // Allow bundling cjs modules. Rollup doesn't understand cjs
      commonjs(),

      // Compile TypeScript/JavaScript files
      babel({ ...babelNode, extensions, include: ['lib/**/*'], babelHelpers: 'bundled' }),
    ],
    output: [
      { file: './' + pkg.main, format: 'cjs', sourcemap: true },
      { file: './' + pkg.module, format: 'es', sourcemap: true }
    ]
  }
];
