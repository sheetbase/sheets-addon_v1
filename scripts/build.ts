import { resolve } from 'path';
import { execSync } from 'child_process';
import { pathExists, copy, outputFile, remove } from 'fs-extra';

(async () => {

  const DEPLOY = resolve('deploy');
  const copies = [
    'src/views',
    '.clasp.json',
    'appsscript.json',
  ];

  // cleanup
  await remove(DEPLOY);

  // transpile
  execSync('tsc -p ./tsconfig.json');

  // copy
  for (const item of copies) {
    const src = resolve(item);
    const dest = resolve(DEPLOY, item.replace('src/views', ''));
    if (!! await pathExists(src)) {
      await copy(src, dest);
    }
  }

  // @index.js
  await outputFile(
    resolve(DEPLOY, '@index.js'),
    '// Sheets Add-on: https://github.com/sheetbase/sheets-addon',
  );

})();