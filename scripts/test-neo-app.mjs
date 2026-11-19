#!/usr/bin/env node
/**
 * @summary Contract checks for the first run: `server-start` starts the engine's file server, no webpack, and opens
 * the app the generator wrote, with the app name as data in the workspace's server script and never in a shell line;
 * a workspace gets no `src/index.js`, no `webpack-dev-server` and no command that runs the engine's own test suite,
 * its styles are plain CSS under `resources/css` with no Sass, and the engine's docs app is copied only with `--docs`. The generator runs for real in a throwaway directory; a stand-in for npm installs nothing, so each
 * workspace gets the slice of the installed engine the run reads.
 */

import assert             from 'node:assert/strict';
import {spawnSync}        from 'node:child_process';
import fs                 from 'node:fs';
import os                 from 'node:os';
import path               from 'node:path';
import {fileURLToPath,
        pathToFileURL}    from 'node:url';
import createServerScript from '../tasks/createServerScript.mjs';

const
    generator   = fileURLToPath(new URL('../tasks/neo-app.mjs', import.meta.url)),
    root        = fs.mkdtempSync(path.join(os.tmpdir(), 'neo-app-first-run-')),
    bin         = path.join(root, 'bin'),
    serverStart = 'node ./buildScripts/server.mjs',
    exists      = (...parts) => fs.existsSync(path.join(root, ...parts)),
    write       = (file, content) => {
        fs.mkdirSync(path.dirname(file), {recursive: true});
        fs.writeFileSync(file, content)
    },
    // The engine's file server, reduced to its `run` entry, which records what the workspace script hands it
    writeEngineFileServer = workspace => write(
        path.join(workspace, 'node_modules/neo.mjs/buildScripts/util/fileServer.mjs'),
        'export function run(options) {globalThis.fileServerRuns.push(options)}'
    ),
    // The route the workspace's server script hands the engine, read by importing the script
    openedRoute = async workspace => {
        globalThis.fileServerRuns = [];
        await import(pathToFileURL(path.join(workspace, 'buildScripts/server.mjs')).href);
        assert.equal(globalThis.fileServerRuns.length, 1, 'the script starts the server once');
        return globalThis.fileServerRuns[0].open
    },
    run = (workspace, ...options) => {
        const engine = path.join(root, workspace, 'node_modules/neo.mjs');

        // What a real install leaves behind: the docs app is always there, so only the option decides the copy
        write(path.join(engine, 'buildScripts/build/themes.mjs'), '');
        write(path.join(engine, 'docs/app/view/Viewport.mjs'),    '');
        write(path.join(engine, 'docs/examples.json'),            '[]');
        write(path.join(engine, 'docs/neo-config.json'),          '{}');
        write(path.join(engine, 'docs/resources/logo.svg'),       '<svg/>');
        writeEngineFileServer(path.join(root, workspace));

        const result = spawnSync(process.execPath, [
            generator, '-w', workspace, '-n', 'MyApp', '-t', 'neo-theme-dark', '-u', 'no', '-s', 'false', '--no-agent', ...options
        ], {cwd: root, encoding: 'utf-8', env: {...process.env, PATH: bin + path.delimiter + process.env.PATH}});

        assert.equal(result.status, 0, result.stderr);
        return JSON.parse(fs.readFileSync(path.join(root, workspace, 'package.json'), 'utf-8'))
    };

write(path.join(bin, 'npm'), '#!/bin/sh\nexit 0\n');
fs.chmodSync(path.join(bin, 'npm'), 0o755);

try {
    // ── The app name stays data: the server script holds the route as a string ─────────────────────────────────────
    // `%CD%` and `ͻ` (UTF-8 CD BB) are the names a percent-encoded route in a cmd.exe line would expand
    const names = ['MyApp', 'Sales Desk', "O'Brien", 'x; touch pwned', '$(id)', '`id`', 'a&b|c>d', '"q"', 'Ünïcödé',
        '~(!*)', '%CD%', 'ͻ', '</script>\\', ' '];

    for (const [index, name] of names.entries()) {
        const workspace = path.join(root, 'names', String(index));

        writeEngineFileServer(workspace);
        createServerScript.init(name, workspace, fs, os, path);

        const open = await openedRoute(workspace);

        assert.match(open, /^apps\/[^/]+\/$/, `${name} → ${open}`);
        assert.equal(decodeURIComponent(open.slice(5, -1)), name.toLowerCase(), `${open} decodes to the folder name`)
    }

    // ── A name with a space: the folder keeps it, the route encodes it, the shell line never sees it ───────────────
    {
        const {scripts} = run('spaced', '-n', 'Sales Desk');

        assert.equal(scripts['server-start'], serverStart, 'the shell line holds no app name');
        assert.equal(await openedRoute(path.join(root, 'spaced')), 'apps/sales%20desk/');
        assert.ok(exists('spaced', 'apps/sales desk/index.html'), 'the folder the route decodes to')
    }

    // ── The defaults: the file server opens the app; no webpack dev server, no src/index.js, no docs app ───────────
    {
        const {devDependencies, scripts} = run('plain');

        assert.equal(scripts['server-start'], serverStart, 'the same shell line for every app name');
        assert.doesNotMatch(scripts['server-start'], /webpack/, 'server-start starts no webpack process');
        assert.equal(devDependencies['webpack-dev-server'], undefined, 'a workspace installs no webpack dev server');
        // The engine's Playwright configs test the engine's own tree, and its specs are not in the npm package
        assert.deepEqual(Object.keys(scripts).filter(name => /^test(-|$)/.test(name)), [], 'a workspace carries no engine test command');
        assert.equal(await openedRoute(path.join(root, 'plain')), 'apps/myapp/', 'server-start opens the app the generator wrote');
        assert.equal(exists('plain', 'src/index.js'), false, 'no webpack entry is written');

        for (const file of ['src/MicroLoader.mjs', 'src/main/addon/README.md']) {
            assert.ok(exists('plain', file), `${file} is still written`)
        }

        for (const folder of ['docs', 'dist/development/docs', 'dist/production/docs']) {
            assert.equal(exists('plain', folder), false, `without --docs there is no ${folder}`)
        }
    }

    // ── Styles are plain CSS: the app's folder per theme under resources/css, and no Sass anywhere ─────────────────
    {
        const {devDependencies} = JSON.parse(fs.readFileSync(path.join(root, 'plain/package.json'), 'utf-8'));

        for (const folder of ['src', 'theme-dark', 'theme-light', 'theme-neo-light']) {
            assert.ok(exists('plain', `resources/css/${folder}/apps/myapp`), `resources/css/${folder} holds the app's folder`)
        }

        assert.equal(exists('plain', 'resources/scss'), false, 'no resources/scss');
        assert.deepEqual(fs.readdirSync(path.join(root, 'plain'), {recursive: true}).filter(file => file.endsWith('.scss')), [], 'no .scss file');
        assert.equal(devDependencies.sass, undefined, 'a workspace installs no Sass');
        // The parity check compares only declared ranges, so it cannot see this one missing
        assert.ok(devDependencies['highlight.js'], 'the engine builds its highlight.js bundle from the workspace install')
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
