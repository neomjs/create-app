#!/usr/bin/env node
/**
 * @summary Fails when a devDependency the scaffold generates differs from the engine release its `neo.mjs` pin resolves
 * to.
 *
 * `tasks/createPackageJson.mjs` writes every scaffolded app's devDependencies, and they are only right while they match
 * the engine's: a scaffolded app builds the engine's browser bundles (parse5, marked, mermaid, monaco, highlight.js)
 * from them, into the engine's own package. They once fell a whole major behind with nothing noticing.
 *
 * Scope: every devDependency BOTH sides declare, compared exactly. The engine is read from npm, never from a checkout,
 * because a scaffolded app installs the published package and a checkout can be ahead of it. The pin decides which
 * release: the newest published version its range allows. A package only the scaffold declares has no engine
 * counterpart to drift from, so it is listed and not compared.
 */

import {execFileSync}      from 'node:child_process';
import {realpathSync}      from 'node:fs';
import os                  from 'node:os';
import path                from 'node:path';
import process             from 'node:process';
import {fileURLToPath}     from 'node:url';
import createPackageJson   from '../tasks/createPackageJson.mjs';

/**
 * @summary The package.json the scaffold writes, captured without touching a disk.
 * @returns {Object}
 */
export function generatedPackageJson() {
    let packageJson = null;

    createPackageJson.init('parity-check', 'parity-check', {writeFileSync: (file, text) => {packageJson = JSON.parse(text)}}, os, path);

    return packageJson
}

/**
 * @summary Compares the scaffold's devDependencies with the engine's.
 * @param {Object} scaffold The generated devDependencies
 * @param {Object} engine   The engine release's devDependencies
 * @returns {{drift: Object[], scaffoldOnly: String[]}} `drift` holds `{name, scaffold, engine}` for each differing range
 */
export function findDrift(scaffold, engine) {
    const names = Object.keys(scaffold);

    return {
        drift       : names.filter(name => name in engine && scaffold[name] !== engine[name])
            .map(name => ({name, scaffold: scaffold[name], engine: engine[name]})),
        scaffoldOnly: names.filter(name => !(name in engine))
    }
}

/**
 * @param {...String} args
 * @returns {*} the parsed `npm view … --json` answer
 */
const npmView = (...args) => JSON.parse(execFileSync('npm', ['view', ...args, '--json'], {encoding: 'utf8'}));

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
    const
        packageJson = generatedPackageJson(),
        range       = packageJson.dependencies['neo.mjs'],
        // One matching version answers as a string, several as an ascending list
        version     = [].concat(npmView(`neo.mjs@${range}`, 'version')).at(-1),
        {drift, scaffoldOnly} = findDrift(packageJson.devDependencies, npmView(`neo.mjs@${version}`, 'devDependencies'));

    if (scaffoldOnly.length > 0) {
        console.log(`check-engine-parity: not compared, no engine counterpart: ${scaffoldOnly.join(', ')}`)
    }

    if (drift.length > 0) {
        console.error(`check-engine-parity: ${drift.length} generated devDependencies differ from neo.mjs@${version} ` +
            `(the newest release \`${range}\` allows):`);
        drift.forEach(({name, scaffold, engine}) => console.error(`  ${name}  scaffold ${scaffold}  engine ${engine}`));
        console.error('Move them in tasks/createPackageJson.mjs to the engine\'s values.');
        process.exitCode = 1
    } else {
        console.log(`check-engine-parity: every devDependency the scaffold shares with neo.mjs@${version} matches.`)
    }
}
