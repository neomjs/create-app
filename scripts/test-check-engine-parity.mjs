#!/usr/bin/env node
/**
 * @summary Contract checks for the engine-parity check: it reads what the scaffold really generates, reports a planted
 * divergence, stays quiet on a match, and lists what it does not compare.
 */

import assert      from 'node:assert/strict';
import fs          from 'node:fs';
import os          from 'node:os';
import path        from 'node:path';
import {CARET_OF_ENGINE, declaredTools, findDrift, findMisplacedFirstRun, findOverrideDrift, findUnreachable,
        generatedPackageJson, reachedPackages} from './check-engine-parity.mjs';
import {ADD_BUILD_TOOLS, FIRST_RUN} from '../tasks/createPackageJson.mjs';

// ── It reads the package.json the scaffold writes ──────────────────────────────────────────────────
{
    const packageJson = generatedPackageJson();

    assert.match(packageJson.dependencies['neo.mjs'], /^\^\d+\.\d+\.\d+$/, 'the engine pin is read from the generator');
    assert.ok(Object.keys(packageJson.devDependencies).length > 10, 'and so are the devDependencies');
    assert.ok(Object.keys(packageJson.overrides).length > 0, 'and the overrides');
}

// ── One list in two places: what the first run installs, and the build tools that wait ─────────────
{
    const
        packageJson = generatedPackageJson(),
        tools       = declaredTools(packageJson);

    assert.deepEqual(Object.keys(packageJson.devDependencies).sort(), [...FIRST_RUN, 'neo-agent-skills'].sort(),
        'a workspace installs the first-run packages and the skills');
    assert.ok(tools.webpack && tools['monaco-editor'] && tools.postcss, 'the check reads both places');
    assert.deepEqual(Object.keys(packageJson.neo.buildTools).filter(name => name in packageJson.devDependencies), [],
        'no name stands in both');
    assert.deepEqual(findMisplacedFirstRun(packageJson), [], 'every first-run name is installed');

    assert.deepEqual(findMisplacedFirstRun({devDependencies: {postcss: '^8.5.29'}, neo: {buildTools: {}}}, ['postcss', 'esbuild']),
        ['esbuild'], 'a first-run name that left the list fails');
    assert.deepEqual(findMisplacedFirstRun({devDependencies: {postcss: '^8.5.29'}, neo: {buildTools: {postcss: '^8.5.29'}}}, ['postcss']),
        ['postcss'], 'and so does one that also waits with the build tools')
}

// ── A planted divergence is reported, a match is not ───────────────────────────────────────────────
{
    const engine = {marked: '^18.0.13', 'monaco-editor': '0.56.0', sass: '^1.104.1'};

    assert.deepEqual(findDrift({marked: '^18.0.13', 'monaco-editor': '0.56.0'}, engine).drift, [], 'matching ranges pass');

    assert.deepEqual(findDrift({marked: '^17.0.4', 'monaco-editor': '0.56.0'}, engine).drift,
        [{name: 'marked', scaffold: '^17.0.4', engine: '^18.0.13'}], 'a range a major behind is drift');

    assert.deepEqual(findDrift({'monaco-editor': '^0.56.0'}, engine).drift,
        [{name: 'monaco-editor', scaffold: '^0.56.0', engine: '0.56.0'}], 'an exact pin widened to a caret is drift too');
}

// ── What only the scaffold declares is listed, never compared ──────────────────────────────────────
{
    const {drift, scaffoldOnly} = findDrift({chromadb: '^3.3.1', marked: '^18.0.13'}, {marked: '^18.0.13'});

    assert.deepEqual(drift, []);
    assert.deepEqual(scaffoldOnly, ['chromadb'])
}

// ── The skills package compares as the caret of the engine's pin: same release, another shape ───────
{
    const engine = {marked: '^18.0.13', 'neo-agent-skills': '1.2.0'};

    assert.deepEqual(findDrift({'neo-agent-skills': '^1.2.0'}, engine).drift, [], 'the caret of the engine\'s pin passes');

    assert.deepEqual(findDrift({'neo-agent-skills': '^0.1.61'}, engine).drift,
        [{name: 'neo-agent-skills', scaffold: '^0.1.61', engine: '^1.2.0'}], 'a caret a major behind is drift');

    assert.deepEqual(findDrift({'neo-agent-skills': '1.2.0'}, engine).drift,
        [{name: 'neo-agent-skills', scaffold: '1.2.0', engine: '^1.2.0'}], 'an exact copy stops the updates, so it is drift too');

    assert.deepEqual(findDrift({'neo-agent-skills': '^1.2.0'}, {'neo-agent-skills': '^1.2.0'}).drift, [],
        'an engine that declares a caret itself still compares as one caret');

    assert.deepEqual(findDrift({marked: '^17.0.4', 'neo-agent-skills': '^1.2.0'}, engine).drift.map(({name}) => name), ['marked'],
        'while a difference beside it is still drift');

    assert.ok(CARET_OF_ENGINE.has('neo-agent-skills') && generatedPackageJson().devDependencies['neo-agent-skills'],
        'and the scaffold really declares it')
}

// ── Overrides compare in full, both ways: npm reads them only in the root project ──────────────────
{
    const engine = {'gray-matter': {'js-yaml': '^3.15.2'}, 'lodash-es': '^4.18.0'};

    assert.deepEqual(findOverrideDrift({'gray-matter': {'kind-of': '^6.0.3', 'js-yaml': '^3.15.2'}},
        {'gray-matter': {'js-yaml': '^3.15.2', 'kind-of': '^6.0.3'}}), [], 'equal overrides pass in any key order');

    assert.deepEqual(findOverrideDrift({'lodash-es': '^4.18.0'}, engine),
        [{name: 'gray-matter', scaffold: undefined, engine: {'js-yaml': '^3.15.2'}}], 'an engine floor the scaffold lacks is drift');

    assert.deepEqual(findOverrideDrift({...engine, 'gray-matter': {'js-yaml': '^3.14.0'}}, engine),
        [{name: 'gray-matter', scaffold: {'js-yaml': '^3.14.0'}, engine: {'js-yaml': '^3.15.2'}}], 'a nested range that differs is drift');

    assert.deepEqual(findOverrideDrift(engine, undefined).map(({name}) => name), ['gray-matter', 'lodash-es'],
        'overrides the release does not declare are drift, which also catches an answer without the field');

    assert.deepEqual(findOverrideDrift(undefined, undefined), [], 'neither side declaring overrides is a match')
}

// ── Membership: a script reaches only packages that are installed when it runs ─────────────────────
{
    const
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'parity-reach-')),
        file = (name, lines) => {
            fs.mkdirSync(path.dirname(path.join(root, name)), {recursive: true});
            fs.writeFileSync(path.join(root, name), lines.join('\n'))
        };

    try {
        file('buildScripts/first.mjs', [
            "import fs      from 'node:fs';",
            "import postcss from 'postcss';",
            "import './helper.mjs';",
            "// buildScripts/unused.mjs is only named in this comment",
            "spawnSync('node', [`${neoPath}/buildScripts/spawned.mjs`]);",
            "const content = `",
            "import Base from '${placeholder}/Base.mjs';",
            "`;"
        ]);
        file('buildScripts/helper.mjs',  ["const bundler = await import('webpack');", "import '../src/outside.mjs';"]);
        file('buildScripts/spawned.mjs', ["const entry = import.meta.resolve(`@scope/tool/${name}`);", "const here = path.resolve('package.json');"]);
        file('buildScripts/unused.mjs',  ["import 'never-reached';"]);
        file('src/outside.mjs',          ["import 'outside-build-scripts';"]);

        assert.deepEqual([...reachedPackages('buildScripts/first.mjs', root)].sort(), ['@scope/tool', 'postcss', 'webpack'],
            'imports, import() and resolve() of a literal name, a spawned build script; no comment, no placeholder, nothing outside buildScripts');

        const packageJson = {
            devDependencies: {postcss: '^8'},
            neo            : {buildTools: {webpack: '^5'}},
            scripts        : {
                chain  : 'npm run first',
                first  : 'node ./node_modules/neo.mjs/buildScripts/first.mjs',
                wrapped: `${ADD_BUILD_TOOLS} && node ./node_modules/neo.mjs/buildScripts/first.mjs`
            }
        };

        assert.deepEqual(findUnreachable(packageJson, root), [
            {script: 'first',   wrapped: false, packages: ['@scope/tool', 'webpack']},
            {script: 'wrapped', wrapped: true,  packages: ['@scope/tool']}
        ], 'a first-run script that reaches a build tool fails; behind the wrapper only an undeclared package does');

        assert.deepEqual(findUnreachable({...packageJson, devDependencies: {'@scope/tool': '^1', postcss: '^8', webpack: '^5'}}, root), [],
            'and a scaffold that installs them all on the first run passes')
    } finally {
        fs.rmSync(root, {force: true, recursive: true})
    }

    assert.ok(generatedPackageJson().scripts['build-all'].startsWith(`${ADD_BUILD_TOOLS} && `), 'the scaffold really wraps its builds')
}

console.log('check-engine-parity: contract arms green.');
