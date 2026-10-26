#!/usr/bin/env node
/**
 * @summary Fails when a devDependency or an override the scaffold generates differs from the engine release its
 * `neo.mjs` pin resolves to.
 *
 * `tasks/createPackageJson.mjs` writes every scaffolded app's devDependencies, which advertise the engine's own ranges.
 * They once fell a whole major behind with nothing noticing. Whether a scaffolded app's bundle scripts build from these
 * hoisted copies, or from the engine's nested ones after its `postinstall`, is not settled here (#34's release-gate
 * run reports it): the declared ranges should agree either way.
 *
 * Scope: every devDependency BOTH sides declare, compared exactly. The engine is read from npm, never from a checkout,
 * because a scaffolded app installs the published package and a checkout can be ahead of it. The pin decides which
 * release: the newest published version its range allows. A package only the scaffold declares has no engine
 * counterpart to drift from, so it is listed and not compared.
 *
 * Overrides are compared in full, both ways. npm reads them only in the root project, so the engine's floors reach an
 * app's own install only through the scaffold's copy. An override only the scaffold declares is stale, or it is what a
 * registry answer without the field looks like; both need a look, so both fail.
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
 * @summary DevDependencies both sides declare on purpose at different releases, each with the reason.
 *
 * `neo-agent-skills` serves two audiences. The engine pins the maintainer release it lints itself with, and a
 * workspace installs the release whose skills carry the `app` audience. Equal ranges would be the defect here.
 * @member {Map<String, String>}
 */
export const INDEPENDENT = new Map([
    ['neo-agent-skills', 'the engine pins its maintainer release; a workspace installs the app-audience release']
]);

/**
 * @summary Compares the scaffold's devDependencies with the engine's.
 * @param {Object} scaffold The generated devDependencies
 * @param {Object} engine   The engine release's devDependencies
 * @returns {{drift: Object[], independent: String[], scaffoldOnly: String[]}} `drift` holds `{name, scaffold, engine}`
 * for each differing range; `independent` lists the declared exceptions both sides carry
 */
export function findDrift(scaffold, engine) {
    const names = Object.keys(scaffold);

    return {
        drift       : names.filter(name => name in engine && !INDEPENDENT.has(name) && scaffold[name] !== engine[name])
            .map(name => ({name, scaffold: scaffold[name], engine: engine[name]})),
        independent : names.filter(name => name in engine && INDEPENDENT.has(name)),
        scaffoldOnly: names.filter(name => !(name in engine))
    }
}

/**
 * @summary JSON with object keys sorted at every depth, so two equal override trees compare equal.
 * @param {*} value
 * @returns {String|undefined}
 */
const canonical = value => value !== null && typeof value === 'object'
    ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
    : JSON.stringify(value);

/**
 * @summary Compares the scaffold's overrides with the engine's, across the names either side declares.
 * @param {Object} [scaffold={}] The generated overrides
 * @param {Object} [engine={}]   The engine release's overrides
 * @returns {Object[]} `{name, scaffold, engine}` for each override that differs; a side that lacks it reads `undefined`
 */
export function findOverrideDrift(scaffold = {}, engine = {}) {
    return [...new Set([...Object.keys(engine), ...Object.keys(scaffold)])]
        .filter(name => canonical(scaffold[name]) !== canonical(engine[name]))
        .map(name => ({name, scaffold: scaffold[name], engine: engine[name]}))
}

/**
 * @param {...String} args
 * @returns {*} the parsed `npm view … --json` answer, `undefined` for a field the release does not declare
 */
const npmView = (...args) => {
    const text = execFileSync('npm', ['view', ...args, '--json'], {encoding: 'utf8'}).trim();

    // An absent field answers with no output at all
    return text ? JSON.parse(text) : undefined
};

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
    const
        packageJson = generatedPackageJson(),
        range       = packageJson.dependencies['neo.mjs'],
        // One matching version answers as a string, several as an ascending list
        version     = [].concat(npmView(`neo.mjs@${range}`, 'version')).at(-1),
        {drift, independent, scaffoldOnly} = findDrift(packageJson.devDependencies, npmView(`neo.mjs@${version}`, 'devDependencies')),
        overrideDrift = findOverrideDrift(packageJson.overrides, npmView(`neo.mjs@${version}`, 'overrides'));

    if (scaffoldOnly.length > 0) {
        console.log(`check-engine-parity: not compared, no engine counterpart: ${scaffoldOnly.join(', ')}`)
    }

    independent.forEach(name => console.log(`check-engine-parity: not compared, independent by design: ${name} (${INDEPENDENT.get(name)})`));

    if (drift.length > 0) {
        console.error(`check-engine-parity: ${drift.length} generated devDependencies differ from neo.mjs@${version} ` +
            `(the newest release \`${range}\` allows):`);
        drift.forEach(({name, scaffold, engine}) => console.error(`  ${name}  scaffold ${scaffold}  engine ${engine}`));
        console.error('Move them in tasks/createPackageJson.mjs to the engine\'s values.');
        process.exitCode = 1
    } else {
        console.log(`check-engine-parity: every devDependency the scaffold shares with neo.mjs@${version} matches.`)
    }

    if (overrideDrift.length > 0) {
        console.error(`check-engine-parity: ${overrideDrift.length} generated overrides differ from neo.mjs@${version}:`);
        overrideDrift.forEach(({name, scaffold, engine}) =>
            console.error(`  ${name}  scaffold ${JSON.stringify(scaffold) ?? '(none)'}  engine ${JSON.stringify(engine) ?? '(none)'}`));
        console.error('Copy the engine\'s overrides into tasks/createPackageJson.mjs.');
        process.exitCode = 1
    } else {
        console.log(`check-engine-parity: the scaffold's overrides equal neo.mjs@${version}'s.`)
    }
}
