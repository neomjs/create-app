#!/usr/bin/env node
/**
 * @summary Contract checks for the engine-parity check: it reads what the scaffold really generates, reports a planted
 * divergence, stays quiet on a match, and lists what it does not compare.
 */

import assert                                                                 from 'node:assert/strict';
import {CARET_OF_ENGINE, findDrift, findOverrideDrift, generatedPackageJson} from './check-engine-parity.mjs';

// ── It reads the package.json the scaffold writes ──────────────────────────────────────────────────
{
    const packageJson = generatedPackageJson();

    assert.match(packageJson.dependencies['neo.mjs'], /^\^\d+\.\d+\.\d+$/, 'the engine pin is read from the generator');
    assert.ok(Object.keys(packageJson.devDependencies).length > 10, 'and so are the devDependencies');
    assert.ok(Object.keys(packageJson.overrides).length > 0, 'and the overrides');
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

console.log('check-engine-parity: contract arms green.');
