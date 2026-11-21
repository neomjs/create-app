#!/usr/bin/env node
/**
 * @summary Fails when a devDependency or an override the scaffold generates differs from the engine release its
 * `neo.mjs` pin resolves to.
 *
 * `tasks/createPackageJson.mjs` writes every scaffolded app's devDependencies, which advertise the engine's own ranges.
 * They once fell a whole major behind with nothing noticing. A scaffolded app installs nothing inside the engine, so
 * the engine's build scripts resolve these copies and no others.
 *
 * That makes membership a second question beside the ranges: does every generated script reach only packages that
 * are installed when it runs? A script the first run may call reaches the first-run packages; a script that adds the
 * build tools first reaches those too ({@link findUnreachable}). The walk reads the release's build scripts as text
 * ({@link reachedPackages}), so a release that makes a first-run script import a new package fails here.
 *
 * Scope: every devDependency BOTH sides declare, compared exactly, except a `CARET_OF_ENGINE` package, which compares
 * as the caret of the engine's pin. The scaffold's side is one list in two places: the first-run packages under
 * `devDependencies` and the build tools under `neo.buildTools` ({@link declaredTools}). A first-run name that is in
 * neither is a workspace whose first run cannot import it, so it fails. The engine is read from npm, never from a checkout,
 * because a scaffolded app installs the published package and a checkout can be ahead of it. The pin decides which
 * release: the newest published version its range allows. A package only the scaffold declares has no engine
 * counterpart to drift from, so it is listed and not compared.
 *
 * Overrides are compared in full, both ways. npm reads them only in the root project, so the engine's floors reach an
 * app's own install only through the scaffold's copy. An override only the scaffold declares is stale, or it is what a
 * registry answer without the field looks like; both need a look, so both fail.
 */

import {execFileSync}      from 'node:child_process';
import {existsSync, mkdtempSync, readFileSync, realpathSync,
        rmSync}            from 'node:fs';
import {isBuiltin}         from 'node:module';
import os                  from 'node:os';
import path                from 'node:path';
import process             from 'node:process';
import {fileURLToPath}     from 'node:url';
import createPackageJson,
       {ADD_BUILD_TOOLS,
        FIRST_RUN}         from '../tasks/createPackageJson.mjs';

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
 * @summary Every toolchain package the scaffold declares: what the first run installs and what the first build adds.
 * @param {Object} packageJson The generated package.json
 * @returns {Object} name → range
 */
export function declaredTools(packageJson) {
    return {...packageJson.neo?.buildTools, ...packageJson.devDependencies}
}

/**
 * @summary The first-run names the scaffold declares in the wrong place or not at all.
 * @param {Object}        packageJson The generated package.json
 * @param {Iterable<String>} [firstRun=FIRST_RUN]
 * @returns {String[]} Names missing from `devDependencies`, and names that also wait under `neo.buildTools`
 */
export function findMisplacedFirstRun(packageJson, firstRun = FIRST_RUN) {
    return [...firstRun].filter(name => !(name in packageJson.devDependencies) || name in (packageJson.neo?.buildTools || {}))
}

/**
 * @summary DevDependencies a workspace declares as the caret of the engine release's pin, each with the reason.
 *
 * The engine pins `neo-agent-skills` exactly, because it lints itself with that release. A workspace's `prepare`
 * re-links the skills on every install, so it takes the same release and the newer ones in its major. The two
 * declarations differ in shape, never in release: a caret behind the engine's pin is drift, and so is an exact copy.
 * @member {Map<String, String>}
 */
export const CARET_OF_ENGINE = new Map([
    ['neo-agent-skills', 'the engine pins the release it lints itself with; a workspace takes it and the newer ones in its major']
]);

/**
 * @summary Compares the scaffold's devDependencies with the engine's.
 * @param {Object} scaffold The generated devDependencies
 * @param {Object} engine   The engine release's devDependencies
 * @returns {{drift: Object[], scaffoldOnly: String[]}} `drift` holds `{name, scaffold, engine}` for each differing
 * range, where `engine` is the range the scaffold has to declare: the engine's own, or the caret of its pin
 */
export function findDrift(scaffold, engine) {
    const
        names    = Object.keys(scaffold),
        expected = name => CARET_OF_ENGINE.has(name) ? `^${engine[name].replace(/^[\^~]/, '')}` : engine[name];

    return {
        drift       : names.filter(name => name in engine && scaffold[name] !== expected(name))
            .map(name => ({name, scaffold: scaffold[name], engine: expected(name)})),
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

const
    IMPORTS  = /(?:^|\n)\s*(?:import|export)\s[^'"`;]*?from\s*['"]([^'"]+)['"]|(?:^|\n)\s*import\s*['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
    // `import.meta.resolve('x')`, `require.resolve('x')` and `createRequire(…).resolve('x')`: how a bundle script finds
    // the package it bundles. `path.resolve` takes no package name and is left out.
    RESOLVES = /(?:import\.meta|require|\))\.resolve\(\s*[`'"]([^`'"$]+)/g,
    MENTIONS = /buildScripts\/[\w./-]+?\.mjs/g,
    PACKAGE  = /^(?:@[a-z0-9~-][a-z0-9._~-]*\/)?[a-z0-9~-][a-z0-9._~-]*$/,
    // Block comments and whole-line comments name scripts they do not run
    code     = text => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/**
 * @summary The packages a build script of the release reaches: its static imports, its `import()` and `resolve()`
 * calls of a literal name, and the build scripts it names in a string, which are the ones it spawns. Each is followed
 * inside `buildScripts`.
 *
 * It reads text and runs nothing. A spawn target built from a variable and a binary on `PATH` stay unseen; the real
 * first run is the check for those.
 * @param {String}   entry  A script inside the release, such as `buildScripts/build/themes.mjs`
 * @param {String}   root   The folder that holds the release
 * @param {Function} [read] `file => String|null`
 * @returns {Set<String>} Package names; Node's own modules are left out
 */
export function reachedPackages(entry, root, read = file => existsSync(file) ? readFileSync(file, 'utf8') : null) {
    const
        scripts = path.join(root, 'buildScripts'),
        reached = new Set(),
        seen    = new Set(),
        // A text a script writes into a file can hold an import of a placeholder, which is no package name
        add     = name => {
            const packageName = name.split('/').slice(0, name.startsWith('@') ? 2 : 1).join('/');

            PACKAGE.test(packageName) && !isBuiltin(name) && reached.add(packageName)
        },
        walk    = file => {
            const text = seen.has(file) ? null : read(file);

            seen.add(file);

            if (text === null) {
                return
            }

            for (const [, from, bare, dynamic] of text.matchAll(IMPORTS)) {
                const name = from || bare || dynamic;

                if (name.startsWith('.')) {
                    const target = path.resolve(path.dirname(file), name);

                    !path.relative(scripts, target).startsWith('..') && walk(target)
                } else {
                    add(name)
                }
            }

            for (const [, name] of text.matchAll(RESOLVES)) {
                !/^[./]/.test(name) && add(name)
            }

            for (const [mention] of code(text).matchAll(MENTIONS)) {
                walk(path.join(root, mention))
            }
        };

    walk(path.join(root, entry));

    return reached
}

/**
 * @summary The generated scripts that reach a package which is not installed when they run.
 *
 * A script that runs `ADD_BUILD_TOOLS` first may reach every declared package. Any other script may be the first
 * command in a new workspace, so it may reach only what the first run installs.
 * @param {Object}   packageJson The generated package.json
 * @param {String}   root        The folder that holds the engine release
 * @param {Function} [reach=reachedPackages]
 * @returns {Object[]} `{script, packages, wrapped}` for each script with a package outside its set
 */
export function findUnreachable(packageJson, root, reach = reachedPackages) {
    const
        firstRun = new Set(Object.keys(packageJson.devDependencies)),
        all      = new Set(Object.keys(declaredTools(packageJson)));

    return Object.entries(packageJson.scripts).map(([script, command]) => {
        const
            wrapped = command.startsWith(`${ADD_BUILD_TOOLS} && `),
            entries = [...command.matchAll(/node \.\/node_modules\/neo\.mjs\/(\S+\.mjs)/g)].map(match => match[1]),
            reached = new Set(entries.flatMap(entry => [...reach(entry, root)]));

        return {script, wrapped, packages: [...reached].filter(name => !(wrapped ? all : firstRun).has(name)).sort()}
    }).filter(({packages}) => packages.length > 0)
}

/**
 * @summary Downloads a release from npm and unpacks its build scripts.
 * @param {String} version
 * @returns {String} A temporary folder; its `package` folder holds the release
 */
function unpackRelease(version) {
    const
        folder       = mkdtempSync(path.join(os.tmpdir(), 'neo-release-')),
        [{filename}] = JSON.parse(execFileSync('npm', ['pack', `neo.mjs@${version}`, '--json', '--pack-destination', folder], {encoding: 'utf8'}));

    execFileSync('tar', ['-xzf', path.join(folder, filename), '-C', folder, 'package/buildScripts']);

    return folder
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
        {drift, scaffoldOnly} = findDrift(declaredTools(packageJson), npmView(`neo.mjs@${version}`, 'devDependencies')),
        overrideDrift = findOverrideDrift(packageJson.overrides, npmView(`neo.mjs@${version}`, 'overrides')),
        misplaced     = findMisplacedFirstRun(packageJson);

    if (misplaced.length > 0) {
        console.error(`check-engine-parity: a first run imports these, and the scaffold does not install them: ${misplaced.join(', ')}`);
        console.error('Each name of FIRST_RUN in tasks/createPackageJson.mjs has to stand in its devDependencies list.');
        process.exitCode = 1
    }

    if (scaffoldOnly.length > 0) {
        console.log(`check-engine-parity: not compared, no engine counterpart: ${scaffoldOnly.join(', ')}`)
    }

    if (drift.length > 0) {
        console.error(`check-engine-parity: ${drift.length} generated devDependencies or build tools differ from neo.mjs@${version} ` +
            `(the newest release \`${range}\` allows):`);
        drift.forEach(({name, scaffold, engine}) => console.error(`  ${name}  scaffold ${scaffold}  engine ${engine}` +
            (CARET_OF_ENGINE.has(name) ? ` (the caret of its pin: ${CARET_OF_ENGINE.get(name)})` : '')));
        console.error('Move them in tasks/createPackageJson.mjs to the engine\'s values (neo-agent-skills: AGENT_SKILLS_RANGE in tasks/createAgentLayer.mjs).');
        process.exitCode = 1
    } else {
        console.log(`check-engine-parity: every devDependency and build tool the scaffold shares with neo.mjs@${version} matches.`)
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

    const
        release     = unpackRelease(version),
        unreachable = findUnreachable(packageJson, path.join(release, 'package'));

    rmSync(release, {force: true, recursive: true});

    if (unreachable.length > 0) {
        console.error(`check-engine-parity: ${unreachable.length} generated scripts reach a package that is not installed when they run (neo.mjs@${version}):`);
        unreachable.forEach(({script, packages, wrapped}) => console.error(`  ${script}  ${packages.join(', ')}  ` +
            (wrapped ? '(the scaffold declares it nowhere)' : '(not among the first-run packages)')));
        console.error('In tasks/createPackageJson.mjs: add the script to NEEDS_BUILD_TOOLS, move the package into FIRST_RUN, or declare the package.');
        process.exitCode = 1
    } else {
        console.log(`check-engine-parity: every generated script reaches only packages that are installed when it runs (neo.mjs@${version}).`)
    }
}
