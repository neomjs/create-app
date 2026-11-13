#!/usr/bin/env node
/**
 * @summary Contract checks for the `create-neo-app` forwarder: which command it chooses, and that every argument and
 * the exit status reach the other side unchanged — observed at a stand-in child, with no download and no generator.
 */

import assert                    from 'node:assert/strict';
import {spawnSync}               from 'node:child_process';
import fs                        from 'node:fs';
import os                        from 'node:os';
import path                      from 'node:path';
import {fileURLToPath}           from 'node:url';
import {forward, resolveCommand} from '../create-neo-app/forward.mjs';

const
    bin       = fileURLToPath(new URL('../create-neo-app/index.mjs', import.meta.url)),
    root      = fs.mkdtempSync(path.join(os.tmpdir(), 'create-neo-app-')),
    outFile   = path.join(root, 'argv.json'),
    // A stand-in for npm's entry file and for `npx`: it records what it was given and exits as told.
    standIn   = `#!/usr/bin/env node
require('node:fs').writeFileSync(process.env.FORWARD_TEST_OUT, JSON.stringify(process.argv.slice(2)));
process.exit(Number(process.env.FORWARD_TEST_STATUS || 0));
`,
    npmCli    = path.join(root, 'npm-cli.js'),
    pathDir   = path.join(root, 'bin'),
    // Every way a shell would change an argument, beside two plain ones.
    hostile   = ['PlainApp', 'two words', '$HOME', 'literal$HOME', '', 'a;b', 'x && y', '`id`', '"quoted"', "it's", '*', '>out', '-w'],
    baseEnv   = Object.fromEntries(Object.entries(process.env).filter(([key]) => key !== 'npm_execpath')),
    run       = (env, args) => {
        fs.rmSync(outFile, {force: true});

        const result = spawnSync(process.execPath, [bin, ...args], {encoding: 'utf-8', env: {...baseEnv, FORWARD_TEST_OUT: outFile, ...env}});

        return {received: fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf-8')) : null, result}
    };

try {
    fs.writeFileSync(npmCli, standIn);
    fs.mkdirSync(pathDir);
    fs.writeFileSync(path.join(pathDir, 'npx'), standIn, {mode: 0o755});

    // ── Which command is chosen ──────────────────────────────────────────────────────────────────
    {
        const exists = file => file === '/npm/bin/npm-cli.js' || file === '/node/node_modules/npm/bin/npx-cli.js';

        assert.deepEqual(
            resolveCommand(['-n', 'MyApp'], {env: {npm_execpath: '/npm/bin/npm-cli.js'}, execPath: '/node/node', exists, platform: 'linux'}),
            {command: '/node/node', args: ['/npm/bin/npm-cli.js', 'exec', '--yes', '--', 'neo-app@latest', '-n', 'MyApp']},
            'started by npm, it runs npm\'s own entry file with node'
        );

        assert.deepEqual(
            resolveCommand([], {env: {npm_execpath: '/yarn/bin/yarn.js'}, execPath: '/node/node', exists, platform: 'linux'}),
            {command: 'npx', args: ['--yes', 'neo-app@latest']},
            'another package manager\'s entry file is never run as npm'
        );

        assert.deepEqual(
            resolveCommand([''], {env: {}, execPath: '/node/node', exists, platform: 'win32'}),
            {command: '/node/node', args: ['/node/node_modules/npm/bin/npx-cli.js', '--yes', 'neo-app@latest', '']},
            'on Windows without npm\'s entry in the environment, it runs the npx entry beside node'
        );

        assert.deepEqual(
            resolveCommand(['x'], {env: {}, execPath: '/node/node', exists: () => false, platform: 'win32'}),
            {command: 'npx', args: ['--yes', 'neo-app@latest', 'x']},
            'npx from the path is the last resort'
        );
    }

    // ── Started by npm: every argument arrives as it was typed ───────────────────────────────────
    {
        const {received, result} = run({npm_execpath: npmCli}, hostile);

        assert.equal(result.status, 0, result.stderr);
        assert.deepEqual(received, ['exec', '--yes', '--', 'neo-app@latest', ...hostile]);
    }

    // ── The child's exit status is the forwarder's ──────────────────────────────────────────────
    {
        const {received, result} = run({FORWARD_TEST_STATUS: '7', npm_execpath: npmCli}, ['--help']);

        assert.deepEqual(received, ['exec', '--yes', '--', 'neo-app@latest', '--help']);
        assert.equal(result.status, 7);
    }

    // ── Without npm's entry file: `npx` from the path, still without a shell ─────────────────────
    if (process.platform !== 'win32') {
        const {received, result} = run({PATH: `${pathDir}${path.delimiter}${process.env.PATH}`}, hostile);

        assert.equal(result.status, 0, result.stderr);
        assert.deepEqual(received, ['--yes', 'neo-app@latest', ...hostile]);
    }

    // ── A generator that cannot be started is a loud failure ────────────────────────────────────
    {
        const
            errors   = [],
            original = console.error;

        console.error = message => errors.push(message);

        try {
            assert.equal(forward([], {env: {PATH: path.join(root, 'empty')}, execPath: process.execPath, platform: 'linux'}), 1);
        } finally {
            console.error = original;
        }

        assert.match(errors[0], /could not be started .*Run: npx neo-app/);
    }
} finally {
    fs.rmSync(root, {force: true, recursive: true});
}

console.log('create-neo-app: contract arms green.');
