#!/usr/bin/env node
/**
 * @summary Contract checks for the first run: `server-start` opens the app the generator wrote, with the app name as
 * data in the workspace's server config and never in a shell line, and the engine's docs app is copied only with
 * `--docs`. The generator runs for real in a throwaway directory; a stand-in for npm installs nothing, so each
 * workspace gets the slice of the installed engine the run reads.
 */

import assert             from 'node:assert/strict';
import {spawnSync}        from 'node:child_process';
import fs                 from 'node:fs';
import os                 from 'node:os';
import path               from 'node:path';
import {fileURLToPath,
        pathToFileURL}    from 'node:url';
import createServerConfig from '../tasks/createServerConfig.mjs';

const
    generator   = fileURLToPath(new URL('../tasks/neo-app.mjs', import.meta.url)),
    root        = fs.mkdtempSync(path.join(os.tmpdir(), 'neo-app-first-run-')),
    bin         = path.join(root, 'bin'),
    serverStart = 'webpack serve -c ./buildScripts/webpack.server.config.mjs',
    exists      = (...parts) => fs.existsSync(path.join(root, ...parts)),
    write       = (file, content) => {
        fs.mkdirSync(path.dirname(file), {recursive: true});
        fs.writeFileSync(file, content)
    },
    // The engine's own server config, reduced to a devServer value the workspace's config has to keep
    writeEngineServerConfig = workspace => write(
        path.join(workspace, 'node_modules/neo.mjs/buildScripts/webpack/webpack.server.config.mjs'),
        'export default {devServer: {port: 4321}};'
    ),
    serverConfig = async workspace => (await import(
        pathToFileURL(path.join(workspace, 'buildScripts/webpack.server.config.mjs')).href
    )).default,
    run = (workspace, ...options) => {
        const engine = path.join(root, workspace, 'node_modules/neo.mjs');

        // What a real install leaves behind: the docs app is always there, so only the option decides the copy
        write(path.join(engine, 'buildScripts/build/themes.mjs'), '');
        write(path.join(engine, 'docs/app/view/Viewport.mjs'),    '');
        write(path.join(engine, 'docs/examples.json'),            '[]');
        write(path.join(engine, 'docs/neo-config.json'),          '{}');
        write(path.join(engine, 'docs/resources/logo.svg'),       '<svg/>');
        writeEngineServerConfig(path.join(root, workspace));

        const result = spawnSync(process.execPath, [
            generator, '-w', workspace, '-n', 'MyApp', '-t', 'neo-theme-dark', '-u', 'no', '-s', 'false', '--no-agent', ...options
        ], {cwd: root, encoding: 'utf-8', env: {...process.env, PATH: bin + path.delimiter + process.env.PATH}});

        assert.equal(result.status, 0, result.stderr);
        return JSON.parse(fs.readFileSync(path.join(root, workspace, 'package.json'), 'utf-8'))
    };

write(path.join(bin, 'npm'), '#!/bin/sh\nexit 0\n');
fs.chmodSync(path.join(bin, 'npm'), 0o755);

try {
    // ── The app name stays data: the config holds the route as a string, and the engine's devServer stays ──────────
    // `%CD%` and `ͻ` (UTF-8 CD BB) are the names a percent-encoded route in a cmd.exe line would expand
    const names = ['MyApp', 'Sales Desk', "O'Brien", 'x; touch pwned', '$(id)', '`id`', 'a&b|c>d', '"q"', 'Ünïcödé',
        '~(!*)', '%CD%', 'ͻ', '</script>\\', ' '];

    for (const [index, name] of names.entries()) {
        const workspace = path.join(root, 'names', String(index));

        writeEngineServerConfig(workspace);
        createServerConfig.init(name, workspace, fs, os, path);

        const {devServer} = await serverConfig(workspace);

        assert.match(devServer.open, /^apps\/[^/]+\/$/, `${name} → ${devServer.open}`);
        assert.equal(decodeURIComponent(devServer.open.slice(5, -1)), name.toLowerCase(), `${devServer.open} decodes to the folder name`);
        assert.equal(devServer.port, 4321, 'the engine\'s devServer values stay')
    }

    // ── A name with a space: the folder keeps it, the route encodes it, the shell line never sees it ───────────────
    {
        const {scripts} = run('spaced', '-n', 'Sales Desk');

        assert.equal(scripts['server-start'], serverStart, 'the shell line holds no app name');
        assert.equal((await serverConfig(path.join(root, 'spaced'))).devServer.open, 'apps/sales%20desk/');
        assert.ok(exists('spaced', 'apps/sales desk/index.html'), 'the folder the route decodes to')
    }

    // ── The defaults: the server opens the app, and nothing of the docs app is copied ──────────────────────────────
    {
        const {scripts} = run('plain');

        assert.equal(scripts['server-start'], serverStart, 'the same shell line for every app name');
        assert.equal((await serverConfig(path.join(root, 'plain'))).devServer.open, 'apps/myapp/', 'server-start opens the app the generator wrote');

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
