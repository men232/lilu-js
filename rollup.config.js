import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

import pkg from './package.json';

const ts = compilerOptions => typescript({ tsconfigOverride: { compilerOptions } });

export default [
  // Browser-friendly UMD build
  {
    input: 'lib/index.umd.ts',
    output: [
      { name: 'lilu', file: pkg.browser, format: 'umd', sourcemap: true },
      { name: 'lilu', file: pkg.browser.replace('.js', '.min.js'), format: 'umd', sourcemap: true, plugins: [terser()] },
    ],
    external: [],
    plugins: [
      ts({ target: 'es3' }),
      json(),
      resolve({ preferBuiltins: false, browser: true }),
      commonjs()
    ]
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  {
    input: 'lib/index.ts',
    external: Object.keys(pkg.dependencies),
    plugins: [
      ts({ target: 'ES2017' }),
      resolve(),
      commonjs()
    ],
    output: [
      { file: pkg.main, format: 'cjs', sourcemap: true },
      { file: pkg.module, format: 'es', sourcemap: true }
    ]
  }
];
