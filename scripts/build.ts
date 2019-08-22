import { resolve } from 'path';
import { execSync } from 'child_process';
import {
  pathExists,
  statSync,
  copy,
  remove,
  outputFileSync,
  readdirSync,
  readFileSync,
  readJson,
} from 'fs-extra';
import * as ts from 'typescript';
import * as sass from 'node-sass';
import { rollup } from 'rollup';
import { format } from 'prettier';
import { pascalCase } from 'change-case';

(async () => {

  const NAME = 'Sheets Add-on';
  const DEPLOY = resolve('deploy');
  const COMPONENTS = resolve('src', 'components');
  const BUNDLE_INPUT = resolve('build', 'index.js');
  const BUNDLE_OUTPUT = resolve(DEPLOY, '@vendor.js');
  const COPIES = [
    '.clasp.json',
    'appsscript.json',
    'build/addon.js',
  ];

  /* CLEANUP */
  await remove(DEPLOY);

  /* TRANSPILE index.ts & addon.ts */
  execSync('tsc -p ./tsconfig.json');

  /* COPY */
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

  /* @INDEX.JS */
  const {
    version,
    description,
    homepage,
    license,
    repository: { url: gitUrl },
  } = await readJson(
    resolve('package.json'),
  );
  outputFileSync(
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
       *   + *.html: Add-on components
       */
      `,
      {
        parser: 'flow',
      },
    ),
  );

  /* @VENDOR.JS */
  const bundle = await rollup({ input: BUNDLE_INPUT });
  const { output } = await bundle.generate({ format: 'iife', name: 'Addon' });
  outputFileSync(
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

  /* COMPONENTS */
  const components = readdirSync(COMPONENTS, { withFileTypes: true })
  .filter(item => item.isDirectory())
  .map(item => item.name);
  components.forEach(name => {
    // read html
    const html= readFileSync(resolve(COMPONENTS, name, name + '.html'))
      .toString();
    // render sass
    const { css: cssResult } = sass.renderSync({
      file: resolve(COMPONENTS, name, name + '.scss'),
    });
    const css = cssResult.toString();
    // transpile ts
    const tsContent = readFileSync(resolve(COMPONENTS, name, name + '.ts'))
      .toString()
      .replace(/import [^\n]*/g, ''); // remove all "import ..." lines
    const { outputText: js } = ts.transpileModule(
      tsContent,
      {
        compilerOptions: {
          noImplicitUseStrict: true,
          experimentalDecorators: true,
          module: ts.ModuleKind.None,
          target: ts.ScriptTarget.ES5,
          lib: [ 'es2015' ],
          skipLibCheck: true,
        },
      },
    );

    // build output
    const output = html
    .replace(
      '</head>',
      !css ? '</head>' : (
        `<style>
          ${ css }
        </style>
        </head>`
      ),
    )
    .replace(
      '</body>',
      !js ? '</body>' : (
        `<script>
          ${ js }
        </script>
        </body>`
      ),
    );

    // save file
    outputFileSync(
      resolve(DEPLOY, pascalCase(name) + '.html'),
      format(
        output,
        {
          parser: 'html',
        },
      ),
    );
  });

})();