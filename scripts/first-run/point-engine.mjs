// Points the workspace a packed generator writes at a packed engine: the one line of tasks/createPackageJson.mjs
// that names the engine's range becomes a file: spec. A measurement of an engine that is not on npm yet needs it;
// nothing of this merges.
// usage: node point-engine.mjs <path to createPackageJson.mjs> <engine tarball>
import fs   from 'node:fs';
import path from 'node:path';

const
    [file, tarball] = process.argv.slice(2),
    // npm reads a drive letter after `file:` as an absolute path when the separators are forward slashes
    spec   = 'file:' + path.resolve(tarball).split(path.sep).join('/'),
    source = fs.readFileSync(file, 'utf8'),
    range  = /"neo\.mjs": "[^"]+"/g,
    found  = source.match(range) || [];

if (found.length !== 1) {
    console.error(`expected one engine range in ${file}, found ${found.length}`);
    process.exit(1)
}

fs.writeFileSync(file, source.replace(range, `"neo.mjs": "${spec}"`));
console.log(`${found[0]} -> "neo.mjs": "${spec}" (${fs.statSync(tarball).size} bytes)`);
