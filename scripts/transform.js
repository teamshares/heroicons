const fs = require('fs');
const copy = require('recursive-copy');
const path = require('path');
const { promisify } = require('util')
const rimraf = promisify(require('rimraf'))
const cheerio = require('cheerio/lib/slim');

const renameFile = (filePath, suffix) => {
  const parsed = path.parse(filePath);
  return parsed.name + suffix + parsed.ext;
}

const transformFile = async (filePath) => {
  const parsed = path.parse(filePath);
  const fileData = await fs.promises.readFile(filePath, 'utf8');
  const $ = await cheerio.load(fileData, {xmlMode: true});
  $('svg').attr('id', parsed.name);
  await fs.promises.writeFile(filePath, $.xml());
  // console.log(`Wrote id ${parsed.name} to ${filePath}`);
}

(async () => {
  const srcPath = './optimized';
  const flattenedPath = './flattened';
  const copyOptions = {
    overwrite: true,
    filter: [ '*.svg' ]
  }

  await Promise.all([
    rimraf(flattenedPath),
    copy(`${srcPath}/24/outline`, flattenedPath, {rename: (filePath) => renameFile(filePath, ''), ...copyOptions}),
    copy(`${srcPath}/24/solid`, flattenedPath, {rename: (filePath) => renameFile(filePath, '-solid'), ...copyOptions}),
    copy(`${srcPath}/20/solid`, flattenedPath, {rename: (filePath) => renameFile(filePath, '-mini'), ...copyOptions}),
    rimraf(`${flattenedPath}/-mini`),
    rimraf(`${flattenedPath}/-solid`),
  ]);

  await fs.readdir(flattenedPath, 'utf8', (err, files) => {
    if (err) console.log(err);
    files.forEach(file => {
      const filePath = `${flattenedPath}/${file}`;
      transformFile(filePath);
    });
    console.log(`Flattened and transformed ${files.length} icon files.`);
  })


})();