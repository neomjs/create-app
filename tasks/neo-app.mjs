#!/usr/bin/env node

import chalk               from 'chalk';
import {spawnSync}         from 'child_process';
import {Command, Option}   from 'commander/esm.mjs';
import copyDocsApp         from './copyDocsApp.mjs';
import createAgentLayer    from './createAgentLayer.mjs';
import createApp           from './createApp.mjs';
import createGitignore     from './createGitignore.mjs';
import createIndexHtml     from './createIndexHtml.mjs';
import createMyAppsJson    from './createMyAppsJson.mjs';
import createNeoConfigJson from './createNeoConfigJson.mjs';
import createPackageJson   from './createPackageJson.mjs';
import createScssResources from './createScssResources.mjs';
import createSrcFolder     from './createSrcFolder.mjs';
import createServiceWorker from './createServiceWorker.mjs';
import createViewport      from './createViewport.mjs';
import envinfo             from 'envinfo';
import fs                  from 'fs-extra';
import inquirer            from 'inquirer';
import os                  from 'os';
import path                from 'path';
import {fileURLToPath}     from 'url';

const
    __dirname     = fileURLToPath(path.dirname(import.meta.url)),
    cwd           = process.cwd(),
    requireJson   = path => JSON.parse(fs.readFileSync((path))),
    packageJson   = requireJson(path.join(__dirname, '../package.json')),
    program       = new Command(),
    startDate     = new Date(),
    sanitizeInput = value => {
        if (typeof value === 'string') {
            return value.replace(/^["']|["']$/g, '').trim();
        }
        return value;
    };

program
    .name(packageJson.name)
    .version(packageJson.version)
    .option('-i, --info',                                   'print environment debug info')
    .option('-n, --app-name <name>',                        'name of your app in PascalCase', sanitizeInput)
    .option('-m, --mainThreadAddons <name>',                '"AmCharts", "AnalyticsByGoogle", "DragDrop", "HighlightJS", "LocalStorage", "MapboxGL", "Markdown", "ServiceWorker", "Siesta", "Stylesheet"', sanitizeInput)
    .option('-s, --start <name>',                           'start a web-server right after the build.', sanitizeInput, 'true')
    .addOption(new Option('-t, --themes <name>',            'theme for your neo app').choices(['neo-theme-dark', 'neo-theme-light', 'neo-theme-neo-light', 'all', 'none']).argParser(sanitizeInput))
    .addOption(new Option('-u, --useSharedWorkers <name>',  'use SharedWorkers').choices(['yes', 'no']).argParser(sanitizeInput))
    .addOption(new Option('-v, --useServiceWorker <value>', 'use ServiceWorker').choices(['yes', 'no']).argParser(sanitizeInput))
    .option('-w, --workspace <name>',                       'name of the project root folder', sanitizeInput)
    .option('--no-agent',                                   'skip the coding-agent layer (AGENTS.md, CLAUDE.md, the app skills, the Neural Link in development)')
    .option('--agent-only',                                 'add the coding-agent layer to the existing workspace named by -w, then exit')
    .allowUnknownOption()
    .on('--help', () => {
        console.log('\nIn case you have any issues, please create a ticket here:');
        console.log(chalk.cyan(packageJson.bugs.url));
    })
    .parse(process.argv);

const programOpts = program.opts();

if (programOpts.info) {
    console.log(chalk.bold('\nEnvironment Info:'));
    console.log(`\n  current version of ${packageJson.name}: ${packageJson.version}`);
    console.log(`  running from ${__dirname}`);

    envinfo
        .run({
            System           : ['OS', 'CPU'],
            Binaries         : ['Node', 'npm', 'Yarn'],
            Browsers         : ['Chrome', 'Edge', 'Firefox', 'Safari'],
            npmPackages      : ['neo.mjs'],
            npmGlobalPackages: ['neo-app']
        }, {
            duplicates  : true,
            showNotFound: true
        })
        .then(console.log);
} else if (programOpts.agentOnly) {
    // An existing workspace gets the layer and nothing else: no app, no build, no server.
    const
        npmCmd    = os.platform() === 'win32' ? 'npm.cmd' : 'npm',
        npxCmd    = os.platform() === 'win32' ? 'npx.cmd' : 'npx',
        workspace = path.resolve(cwd, programOpts.workspace ?? '.');

    if (!fs.existsSync(path.join(workspace, 'package.json'))) {
        console.error(chalk.red(`neo-app --agent-only: ${workspace} has no package.json; name an existing workspace with -w.`));
        process.exit(1);
    }

    const changed = createAgentLayer.addToWorkspace(workspace, fs, os, path);

    spawnSync(npmCmd, ['i'], {encoding: 'utf-8', env: process.env, cwd: workspace, shell: true, stdio: 'inherit'});

    if (createAgentLayer.generateAgentsMd(workspace, fs, path, spawnSync, npxCmd)) {
        changed.push('AGENTS.md');
    }

    console.log(changed.length ? `Added the coding-agent layer: ${changed.join(', ')}` : 'The workspace already has the coding-agent layer.');
} else {
    console.log(chalk.bold('Welcome to the Neo.mjs App Generator!'));
    console.log(`current version of ${packageJson.name}: ${packageJson.version}`);

    // npm binary based on OS
    const npmCmd = os.platform() === 'win32' ? 'npm.cmd' : 'npm',
          npxCmd = os.platform() === 'win32' ? 'npx.cmd' : 'npx';

    const questions = [];

    if (!programOpts.workspace) {
        questions.push({
            type   : 'input',
            name   : 'workspace',
            message: 'Please choose a name for your Neo.mjs Workspace:',
            default: 'workspace'
        });
    }

    if (!programOpts.appName) {
        questions.push({
            type   : 'input',
            name   : 'appName',
            message: 'Please choose a name for your Neo.mjs App:',
            default: 'MyApp'
        });
    }

    if (!programOpts.themes) {
        questions.push({
            type   : 'list',
            name   : 'themes',
            message: 'Please choose a Design-Theme for your Neo.mjs App:',
            choices: ['neo-theme-dark', 'neo-theme-light', 'neo-theme-neo-light', 'all', 'none'],
            default: 'all'
        });
    }

    if (!programOpts.useSharedWorkers) {
        questions.push({
            type   : 'list',
            name   : 'useSharedWorkers',
            message: 'Do you want to use SharedWorkers? Only pick yes for multiple main threads (Browser Windows):',
            choices: ['yes', 'no'],
            default: 'no'
        });
    }

    const handleError = e => {
        console.error('ERROR! An error was encountered while executing');
        console.error(e);
        console.log('Exiting with error.');
        process.exit(1);
    };

    const handleExit = () => {
        logBuildTime();
        console.log('Exiting without error.');
        process.exit();
    };

    const logBuildTime = () => {
        const processTime = (Math.round((new Date - startDate) * 100) / 100000).toFixed(2);
        console.log(`Total time: ${processTime}s`);
    };

    process.on('SIGINT', handleExit);
    process.on('uncaughtException', handleError);

    inquirer.prompt(questions).then(answers => {
        let appName          = programOpts.appName          || answers['appName'],
            mainThreadAddons = programOpts.mainThreadAddons || ['DragDrop', 'Navigator', 'Stylesheet'],
            themes           = programOpts.themes           || answers['themes'],
            useSharedWorkers = programOpts.useSharedWorkers || answers.useSharedWorkers,
            useServiceWorker = programOpts.useServiceWorker || 'no',
            workspace        = programOpts.workspace        || answers['workspace'],
            appPath          = path.join(workspace, '/apps/', appName.toLowerCase(), '/');

        if (!Array.isArray(themes)) {
            themes = [themes];
        }

        fs.mkdirp(appPath, err => {
            if (err) {
                throw err;
            }

            createApp          .init(appName, appPath, fs, os, path);
            createGitignore    .init(workspace, fs, os, path);
            createIndexHtml    .init(appName, appPath, fs, os, path);
            createViewport     .init(appName, appPath, fs, os, path);
            createMyAppsJson   .init(appName, workspace, fs, os, path);
            createNeoConfigJson.init(appName, appPath, fs, mainThreadAddons, os, path, themes, useSharedWorkers, useServiceWorker, programOpts.agent);
            createPackageJson  .init(appName, workspace, fs, os, path, programOpts.agent);
            createScssResources.init(appName, workspace, fs, os, path);
            createServiceWorker.init(appName, workspace, fs, os, path);
            createSrcFolder    .init(path.join(cwd, workspace), fs, os, path, __dirname);

            programOpts.agent && createAgentLayer.writeClaudeMd(workspace, fs, path);

            fs.copySync(
                path.join(__dirname, '../resources/copyExamples.mjs'),
                path.join(workspace, 'buildScripts/copyExamples.mjs')
            );

            const cpOpts = { encoding: 'utf-8', env: process.env, cwd: workspace, shell: true, stdio: 'inherit' };

            // npm install — its `prepare` links the app skills when the agent layer is on
            spawnSync(npmCmd, ['i'], cpOpts);

            programOpts.agent && createAgentLayer.generateAgentsMd(workspace, fs, path, spawnSync, npxCmd);

            copyDocsApp.init(fs, os, path, workspace);

            spawnSync('node', ['./node_modules/neo.mjs/buildScripts/build/all.mjs', '-n', '-l', 'no', '-p', 'no'], {
                cwd  : path.join(cwd, workspace),
                env  : process.env,
                stdio: 'inherit'
            });

            if (programOpts.start === 'true') {
                logBuildTime();
                spawnSync(npmCmd, ['run', 'server-start'], cpOpts);
            } else {
                // Cleanup
                handleExit();
            }
        });
    });
}
