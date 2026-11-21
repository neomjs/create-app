#!/usr/bin/env node
/**
 * @summary Contract checks for the first run: `server-start` starts the engine's file server, no webpack, and opens
 * the app the generator wrote, with the app name as data in the workspace's server script and never in a shell line;
 * a workspace gets no `src/index.js`, no `webpack-dev-server` and no command that runs the engine's own test suite,
 * its styles are plain CSS under `resources/css` with no Sass, and the engine's docs app is copied only with `--docs`.
 * A workspace declares only the packages its first run imports; the build tools stand under `neo.buildTools` as a
 * recipe, and `buildScripts/addBuildTools.mjs` installs them once. The generator runs for real in a throwaway
 * directory; the stand-in for npm it runs with installs nothing, so each workspace gets the slice of the installed
 * engine the run reads.
 */

import assert                             from 'node:assert/strict';
import {spawn, spawnSync}                 from 'node:child_process';
import fs                                 from 'node:fs';
import os                                 from 'node:os';
import path                               from 'node:path';
import {fileURLToPath,
        pathToFileURL}                    from 'node:url';
import {declareTools, missingBuildTools}  from '../resources/addBuildTools.mjs';
import {ADD_BUILD_TOOLS, FIRST_RUN,
        NEEDS_BUILD_TOOLS}                from '../tasks/createPackageJson.mjs';
import createServerScript                 from '../tasks/createServerScript.mjs';

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
        '~(!*)', '%CD%', 'ͻ', '</script>\\', ' '];

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
        const {devDependencies, neo} = JSON.parse(fs.readFileSync(path.join(root, 'plain/package.json'), 'utf-8'));

        for (const folder of ['src', 'theme-dark', 'theme-light', 'theme-neo-light']) {
            assert.ok(exists('plain', `resources/css/${folder}/apps/myapp`), `resources/css/${folder} holds the app's folder`)
        }

        assert.equal(exists('plain', 'resources/scss'), false, 'no resources/scss');
        assert.deepEqual(fs.readdirSync(path.join(root, 'plain'), {recursive: true}).filter(file => file.endsWith('.scss')), [], 'no .scss file');
        assert.equal(devDependencies.sass, undefined, 'a workspace installs no Sass');
        // The parity check compares only declared ranges, so it cannot see this one missing
        assert.ok(neo.buildTools['highlight.js'], 'the engine builds its highlight.js bundle from the workspace install')
    }

    // ── Every generated script is sorted: it needs a build tool, it chains sorted scripts, or the first run runs it ─
    // Kept apart from NEEDS_BUILD_TOOLS on purpose. A script that loses its wrapper fails here, and so does a new
    // script that nobody sorted.
    {
        const
            {scripts} = JSON.parse(fs.readFileSync(path.join(root, 'plain/package.json'), 'utf-8')),
            builds    = ['build-all', 'build-all-questions', 'build-dist-esm', 'build-highlightjs', 'build-threads', 'bundle-mermaid',
                'bundle-monaco', 'generate-docs-json'],
            chains    = ['bundle-browser-deps', 'postinstall'],
            firstRun  = ['add-build-tools', 'add-config', 'add-reactive-tags', 'build-themes', 'bundle-marked', 'bundle-parse5',
                'check-reactive-tags', 'copy-examples', 'create-app', 'create-app-minimal', 'create-class', 'create-component',
                'server-start', 'watch-themes'];

        assert.deepEqual(Object.keys(scripts).sort(), [...builds, ...chains, ...firstRun].sort(), 'every generated script stands in one list');
        assert.equal(scripts['add-build-tools'], ADD_BUILD_TOOLS);

        for (const name of builds) {
            assert.ok(scripts[name].startsWith(`${ADD_BUILD_TOOLS} && node `), `${name} adds the build tools first`)
        }

        for (const name of firstRun.slice(1)) {
            assert.doesNotMatch(scripts[name], /addBuildTools/, `${name} runs on the first install`)
        }

        for (const name of chains) {
            for (const part of scripts[name].split(' && ')) {
                assert.ok(/^npm run [\w-]+$/.test(part) && part.slice(8) in scripts, `${name} runs only the workspace's own scripts`)
            }
        }

        assert.deepEqual([...NEEDS_BUILD_TOOLS].sort(), builds, 'and the generator wraps exactly the builds');
        assert.equal(scripts.postinstall, 'npm run bundle-parse5 && npm run bundle-marked', 'the install installs nothing inside the engine')
    }

    // ── The first run installs what it runs; the build tools stand as a recipe, and one step installs them once ────
    {
        const
            workspace = path.join(root, 'plain'),
            manifest  = path.join(workspace, 'package.json'),
            read      = () => fs.readFileSync(manifest, 'utf-8'),
            lean      = read(),
            {devDependencies, neo} = JSON.parse(lean),
            tools     = Object.keys(neo.buildTools),
            toolFile  = name => path.join(workspace, 'node_modules', name, 'package.json'),
            present   = () => tools.filter(name => fs.existsSync(toolFile(name))),
            remove    = () => tools.forEach(name => fs.rmSync(path.dirname(toolFile(name)), {force: true, recursive: true})),
            lockDir   = path.join(workspace, 'node_modules/.neo-build-tools.lock'),
            npmLog    = path.join(root, 'npm.log'),
            npmRuns   = () => fs.existsSync(npmLog) ? fs.readFileSync(npmLog, 'utf-8').split('\n').filter(Boolean).length : 0,
            options   = npmBin => ({cwd: workspace, encoding: 'utf-8', env: {...process.env, NPM_LOG: npmLog, PATH: npmBin + path.delimiter + process.env.PATH}}),
            addTools  = npmBin => spawnSync(process.execPath, ['buildScripts/addBuildTools.mjs'], options(npmBin)),
            helper    = (name, lines) => {
                write(path.join(root, name), lines.join('\n'));
                return path.join(root, name)
            },
            // What an install leaves behind: a folder with a package.json for every declared devDependency
            installer = helper('install.mjs', [
                "import fs from 'node:fs';",
                "for (const name of Object.keys(JSON.parse(fs.readFileSync('package.json', 'utf8')).devDependencies || {})) {",
                "    fs.mkdirSync(`node_modules/${name}`, {recursive: true});",
                "    fs.writeFileSync(`node_modules/${name}/package.json`, '{}')",
                "}"
            ]),
            // A person's edit of package.json while npm runs
            editor    = helper('edit.mjs', [
                "import fs from 'node:fs';",
                "const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));",
                "packageJson.scripts.mine = 'echo';",
                "fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 4) + '\\n')"
            ]),
            // Loaded with -r: the first call of fs[PAUSE_AT] on a path that matches PAUSE_PATH leaves PAUSE_FILE and
            // waits there until PAUSE_FILE.go stands
            pauser    = helper('pause.cjs', [
                "const fs = require('node:fs'), {existsSync, writeFileSync} = fs;",
                "const original = fs[process.env.PAUSE_AT], pattern = new RegExp(process.env.PAUSE_PATH);",
                "let done = false;",
                "fs[process.env.PAUSE_AT] = (...args) => {",
                "    if (!done && pattern.test(String(args[0]).replaceAll('\\\\', '/'))) {",
                "        done = true;",
                "        writeFileSync(process.env.PAUSE_FILE, '');",
                "        while (!existsSync(`${process.env.PAUSE_FILE}.go`)) {",
                "            Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20)",
                "        }",
                "    }",
                "    return original(...args)",
                "};",
                "require('node:module').syncBuiltinESMExports();"
            ]),
            // A stand-in for npm: it notes the call, then runs its lines
            standIn   = (name, ...lines) => {
                write(path.join(root, name, 'npm'), ['#!/bin/sh', 'echo run >> "$NPM_LOG"', ...lines, ''].join('\n'));
                fs.chmodSync(path.join(root, name, 'npm'), 0o755);
                return path.join(root, name)
            },
            node      = file => `"${process.execPath}" "${file}"`,
            failing   = standIn('failing', 'exit 1'),
            editing   = standIn('editing', node(editor), 'exit 1'),
            working   = standIn('working', node(installer)),
            slow      = standIn('slow', 'sleep 1', node(installer));

        assert.deepEqual(Object.keys(devDependencies).sort(), [...FIRST_RUN].sort(), 'devDependencies hold what the first run imports');

        for (const name of ['webpack', 'webpack-cli', 'terser', 'monaco-editor', 'mermaid', '@playwright/test', 'jsdoc-api']) {
            assert.ok(neo.buildTools[name], `${name} stands with the build tools`)
        }

        // A failed install: the recipe stays, nothing is installed, and the next run tries again
        assert.equal(addTools(failing).status, 1, 'a failed install fails the run');
        assert.deepEqual(JSON.parse(read()).neo, neo, 'the recipe stays where it is');
        assert.deepEqual(present(), [], 'and nothing is installed');

        assert.equal(addTools(editing).status, 1);
        assert.equal(JSON.parse(read()).scripts.mine, 'echo', 'an edit made while npm runs stays after a failure');

        let runs = npmRuns();

        assert.equal(addTools(working).status, 0, 'the next run repeats a failed install');
        assert.equal(npmRuns(), runs + 1);
        assert.deepEqual(present(), tools, 'every build tool is installed');

        const
            text   = read(),
            merged = JSON.parse(text);

        assert.deepEqual(Object.keys(merged.devDependencies).sort(), [...Object.keys(devDependencies), ...tools].sort(),
            'every build tool is declared, each once');
        assert.equal(merged.devDependencies.webpack, neo.buildTools.webpack, 'with the range of the recipe');
        assert.deepEqual(merged.neo, neo, 'and the recipe stays');

        runs = npmRuns();
        assert.equal(addTools(working).status, 0);
        assert.equal(read(), text, 'a second run changes nothing');
        assert.equal(npmRuns(), runs, 'and starts no install');

        // An install that was interrupted: the tools are declared and not there
        remove();
        assert.equal(addTools(working).status, 0, 'tools that are declared and not installed get installed');
        assert.deepEqual(present(), tools);
        assert.equal(read(), text, 'with no change to package.json');

        // npm reports success and the tools are not there
        remove();

        const idle = addTools(bin);

        assert.equal(idle.status, 1, 'an install that ends without the tools fails the run');
        assert.match(idle.stderr, /ended without these build tools/);

        // The workspace's own range of a build tool
        fs.writeFileSync(manifest, text.replace(`"webpack": "${neo.buildTools.webpack}"`, '"webpack": "5.0.0"'));
        assert.equal(addTools(working).status, 0);
        assert.equal(JSON.parse(read()).devDependencies.webpack, '5.0.0', 'a range the workspace declares stays');
        fs.writeFileSync(manifest, text);

        // An entry whose run is gone
        const gone = `${spawnSync(process.execPath, ['-e', '']).pid}-1`;

        remove();
        fs.mkdirSync(lockDir, {recursive: true});
        fs.writeFileSync(path.join(lockDir, gone), '');
        assert.equal(addTools(working).status, 0, 'a run that is gone holds no lock');
        assert.deepEqual(present(), tools);
        assert.deepEqual(fs.readdirSync(lockDir), [], 'and the lock folder is empty again');

        // Two runs at once: one installs, the other waits for it and finds the tools
        remove();
        runs = npmRuns();

        const
            start = pause => {
                const
                    {env, ...spawnOptions} = options(slow),
                    run   = {out: ''},
                    child = spawn(process.execPath, [...(pause ? ['-r', pauser] : []), 'buildScripts/addBuildTools.mjs'],
                        {...spawnOptions, env: {...env, ...pause}});

                child.stdout.on('data', chunk => run.out += chunk);
                run.done = new Promise(resolve => child.on('close', status => resolve(Object.assign(run, {status}))));
                return run
            },
            first = start();

        await new Promise(resolve => setTimeout(resolve, 400));

        let [one, two] = await Promise.all([first.done, start().done]);

        assert.deepEqual([one.status, two.status], [0, 0], 'two runs at once both end well');
        assert.equal(npmRuns(), runs + 1, 'with one install between them');
        assert.match(two.out, /Waiting for the run that adds the build tools/, 'the second one waited');
        assert.deepEqual(present(), tools);
        assert.equal(read(), text, 'and package.json is as one run leaves it');

        // One run stopped inside the step that takes the lock, and a second run started beside it. The second one gets
        // the time to wait or to start npm before the first goes on.
        const
            until  = async (what, condition) => {
                const end = Date.now() + 20000;

                while (!condition()) {
                    assert.ok(Date.now() < end, what);
                    await new Promise(resolve => setTimeout(resolve, 20))
                }
            },
            paused = async (name, at, pattern, settled) => {
                const
                    file    = path.join(root, `${name}.paused`),
                    stopped = start({PAUSE_AT: at, PAUSE_FILE: file, PAUSE_PATH: pattern});

                await until(`${name}: the first run reaches ${at}`, () => fs.existsSync(file));

                const beside = start();

                await until(`${name}: the second run waits or installs`, () => settled(beside));
                fs.writeFileSync(`${file}.go`, '');

                return Promise.all([stopped.done, beside.done])
            };

        // Both find an entry whose run is gone, and the first is stopped before it removes what it found
        remove();
        runs = npmRuns();
        fs.writeFileSync(path.join(lockDir, gone), '');
        [one, two] = await paused('gone', 'rmSync', `\\.neo-build-tools\\.lock(/${gone})?$`,
            beside => /Waiting for the run/.test(beside.out) || npmRuns() > runs);

        assert.deepEqual([one.status, two.status], [0, 0], 'two runs that find a run gone both end well');
        assert.equal(npmRuns(), runs + 1, 'and only one of them installs');
        assert.deepEqual(fs.readdirSync(lockDir), [], 'and no entry stays');

        // The first is stopped before it writes its entry, and goes on while the second one installs
        remove();
        runs = npmRuns();
        [one, two] = await paused('entry', 'writeFileSync', '\\.neo-build-tools\\.lock/\\d+-\\d+$', () => npmRuns() > runs);

        assert.deepEqual([one.status, two.status], [0, 0], 'a run that arrives during an install ends well');
        assert.equal(npmRuns(), runs + 1, 'and starts no second one');

        // The two decisions as data
        assert.deepEqual(missingBuildTools({devDependencies: {a: '^1'}, neo: {buildTools: {a: '^2', b: '^3', c: '^4'}}}, name => name === 'c'),
            {missing: ['a', 'b'], undeclared: {b: '^3'}}, 'an installed tool is left alone, a declared range is not replaced');
        assert.deepEqual(missingBuildTools({}, () => false), {missing: [], undeclared: {}}, 'no recipe, nothing to add');
        assert.equal(declareTools('{\r\n  "name": "x"\r\n}\r\n', {b: '^3'}),
            '{\r\n  "name": "x",\r\n  "devDependencies": {\r\n    "b": "^3"\r\n  }\r\n}\r\n', 'the indent and the line ending stay')
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
