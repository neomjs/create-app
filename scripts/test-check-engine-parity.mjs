#!/usr/bin/env node
/**
 * @summary Contract checks for the engine-parity check: it reads what the scaffold really generates, reports a planted
 * divergence, stays quiet on a match, and lists what it does not compare.
 */

import assert                              from 'node:assert/strict';
import {findDrift, generatedPackageJson} from './check-engine-parity.mjs';

// ── It reads the package.json the scaffold writes ──────────────────────────────────────────────────
{
    const packageJson = generatedPackageJson();

    assert.match(packageJson.dependencies['neo.mjs'], /^\^\d+\.\d+\.\d+$/, 'the engine pin is read from the generator');
    assert.ok(Object.keys(packageJson.devDependencies).length > 10, 'and so are the devDependencies');
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

console.log('check-engine-parity: contract arms green.');
