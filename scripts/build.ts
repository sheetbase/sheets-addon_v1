import { resolve } from 'path';
import { execSync } from 'child_process';
import { pathExists, statSync, copy, outputFile, remove, readJson } from 'fs-extra';
import { rollup } from 'rollup';
import { format } from 'prettier';

(async () => {

  const NAME = 'Sheets Add-on';
  const DEPLOY = resolve('deploy');
  const BUNDLE_INPUT = resolve('build', 'index.js');
  const BUNDLE_OUTPUT = resolve(DEPLOY, '@vendor.js');
  const COPIES = [
    'src/views',
    'build/addon.js',
    '.clasp.json',
    'appsscript.json',
  ];

  // cleanup
  await remove(DEPLOY);

  // transpile
  execSync('tsc -p ./tsconfig.json');

  // @index.js
  const {
    version,
    description,
    homepage,
    license,
    repository: { url: gitUrl },
  } = await readJson(
    resolve('package.json'),
  );
  await outputFile(
    resolve(DEPLOY, '@index.js'),
    format(
      `
      /*
       * ${ NAME }
       * ${ description }
       * Version: ${ version }
       * Homepage: ${ homepage }
       * Repo: ${ gitUrl.replace('.git', '') }
       * License: ${ license }
       * Files:
       *   + @vendor.js: All add-on funtions
       *   + addon.js: Code that creates add-on menu
       *   + *.html: Add-on functionalities
       */
      `,
      {
        parser: 'flow',
      },
    ),
  );

  // copy
  for (const src of COPIES) {
    const from = resolve(src);
    if (!!await pathExists(from)) {
      await copy(
        from,
        resolve(
          DEPLOY,
          !!statSync(from).isDirectory() ? '' :
            src.replace(/\\/g, '/').split('/').pop(),
        ),
      );
    }
  }

  // @vendor.js
  const bundle = await rollup({ input: BUNDLE_INPUT });
  const { output } = await bundle.generate({ format: 'iife', name: 'Addon' });
  await outputFile(
    BUNDLE_OUTPUT,
    format(
      output[0].code
      .replace(/var Addon = [^\n]*/g, '') // var Addon = (function (exports) {
      .replace(/\'use strict\'\;/g, '') // 'use strict';
      .replace(/exports\.[^\n]*/g, '') // all lines: exports.
      .replace(/return exports\;/g, '') // return exports;
      .replace(/\}\(\{\}\)\)\;/g, ''), // }({}));
      {
        parser: 'flow',
      },
    ),
  );

})();