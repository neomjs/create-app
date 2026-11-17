#!/usr/bin/env node
/**
 * @summary Contract checks for the first run: `server-start` opens the app the generator wrote, and the engine's docs
 * app is copied only with `--docs`. The generator runs for real in a throwaway directory; a stand-in for npm installs
 * nothing, so each workspace gets the slice of the installed engine the run reads.
 */

import assert          from 'node:assert/strict';
import {spawnSync}     from 'node:child_process';
import fs              from 'node:fs';
import os              from 'node:os';
import path            from 'node:path';
import {fileURLToPath} from 'node:url';

const
    generator = fileURLToPath(new URL('../tasks/neo-app.mjs', import.meta.url)),
    root      = fs.mkdtempSync(path.join(os.tmpdir(), 'neo-app-first-run-')),
    bin       = path.join(root, 'bin'),
    exists    = (...parts) => fs.existsSync(path.join(root, ...parts)),
    write     = (file, content) => {
        fs.mkdirSync(path.dirname(file), {recursive: true});
        fs.writeFileSync(file, content)
    },
    run = (workspace, ...options) => {
        const engine = path.join(root, workspace, 'node_modules/neo.mjs');

        // What a real install leaves behind: the docs app is always there, so only the option decides the copy
        write(path.join(engine, 'buildScripts/build/themes.mjs'), '');
        write(path.join(engine, 'docs/app/view/Viewport.mjs'),    '');
        write(path.join(engine, 'docs/examples.json'),            '[]');
        write(path.join(engine, 'docs/neo-config.json'),          '{}');
        write(path.join(engine, 'docs/resources/logo.svg'),       '<svg/>');

        const result = spawnSync(process.execPath, [
            generator, '-w', workspace, '-n', 'MyApp', '-t', 'neo-theme-dark', '-u', 'no', '-s', 'false', '--no-agent', ...options
        ], {cwd: root, encoding: 'utf-8', env: {...process.env, PATH: bin + path.delimiter + process.env.PATH}});

        assert.equal(result.status, 0, result.stderr);
        return JSON.parse(fs.readFileSync(path.join(root, workspace, 'package.json'), 'utf-8'))
    };

write(path.join(bin, 'npm'), '#!/bin/sh\nexit 0\n');
fs.chmodSync(path.join(bin, 'npm'), 0o755);

try {
    // ── The defaults: the server opens the app, and nothing of the docs app is copied ──────────────────────────────
    {
        const {scripts} = run('plain');

        assert.match(scripts['server-start'], / --open apps\/myapp\/$/, 'server-start opens the app the generator wrote');

        for (const folder of ['docs', 'dist/development/docs', 'dist/production/docs']) {
            assert.equal(exists('plain', folder), false, `without --docs there is no ${folder}`)
        }
    }

    // ── --docs: the copy runs as before ─────────────────────────────────────────────────────────────────────────────
    {
        run('withdocs', '--docs');

        assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'withdocs/docs/neo-config.json'), 'utf-8')).appPath, '../../docs/app.mjs');

        for (const environment of ['development', 'production']) {
            assert.ok(exists('withdocs', `dist/${environment}/docs/resources/logo.svg`), `--docs copies the resources into dist/${environment}`)
        }
    }
} finally {
    fs.rmSync(root, {recursive: true, force: true})
}

console.log('neo-app first-run contract: ok');
