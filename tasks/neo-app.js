#!/usr/bin/env node

'use strict';

const chalk       = require('chalk'),
      commander   = require('commander'),
      cp          = require('child_process'),
      envinfo     = require('envinfo'),
      fs          = require('fs-extra'),
      inquirer    = require('inquirer'),
      os          = require('os'),
      packageJson = require('../package.json'),
      path        = require('path'),
      startDate   = new Date();

const program = new commander.Command(packageJson.name)
    .version(packageJson.version)
    .option('-i, --info',                    'print environment debug info')
    .option('-n, --app-name <name>',         'name of your app in PascalCase')
    .option('-m, --mainThreadAddons <name>', '"AmCharts", "AnalyticsByGoogle", "HighlightJS", "LocalStorage", "MapboxGL", "Markdown", "Siesta", "Stylesheet"')
    .option('-s, --start <name>',            'start a web-server right after the build.', 'true')
    .option('-t, --themes <name>',           '"neo-theme-dark", "neo-theme-light", "all", "none"')
    .option('-u, --useSharedWorkers <name>', '"yes", "no"')
    .option('-w, --workspace <name>',        'name of the project root folder')
    .allowUnknownOption()
    .on('--help', () => {
        console.log('\nIn case you have any issues, please create a ticket here:');
        console.log(chalk.cyan(packageJson.bugs.url));
    })
    .parse(process.argv);

if (program.info) {
    console.log(chalk.bold('\nEnvironment Info:'));
    console.log(`\n  current version of ${packageJson.name}: ${packageJson.version}`);
    console.log(`  running from ${__dirname}`);
    return envinfo
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
}

console.log(chalk.bold('Welcome to the neo.mjs app generator!'));
console.log(`current version of ${packageJson.name}: ${packageJson.version}`);

// npm binary based on OS
const npmCmd = os.platform().startsWith('win') ? 'npm.cmd' : 'npm';

const questions = [];

if (!program.workspace) {
    questions.push({
        type   : 'input',
        name   : 'workspace',
        message: 'Please choose a name for your neo workspace:',
        default: 'workspace'
    });
}

if (!program.appName) {
    questions.push({
        type   : 'input',
        name   : 'appName',
        message: 'Please choose a name for your neo app:',
        default: 'MyApp'
    });
}

if (!program.themes) {
    questions.push({
        type   : 'list',
        name   : 'themes',
        message: 'Please choose a theme for your neo app:',
        choices: ['neo-theme-dark', 'neo-theme-light', 'all', 'none'],
        default: 'all'
    });
}

if (!program.mainThreadAddons) {
    questions.push({
        type   : 'checkbox',
        name   : 'mainThreadAddons',
        message: 'Please choose your main thread addons:',
        choices: ['AmCharts', 'AnalyticsByGoogle', 'HighlightJS', 'LocalStorage', 'MapboxGL', 'Markdown', 'Siesta', 'Stylesheet'],
        default: ['Stylesheet']
    });
}

if (!program.useSharedWorkers) {
    questions.push({
        type   : 'list',
        name   : 'useSharedWorkers',
        message: 'Do you want to use SharedWorkers? Pick yes for multiple main threads (Browser Windows):',
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
    let appName          = program.appName          || answers['appName'],
        mainThreadAddons = program.appName          || answers['mainThreadAddons'],
        themes           = program.themes           || answers['themes'],
        useSharedWorkers = program.useSharedWorkers || answers.useSharedWorkers,
        workspace        = program.workspace        || answers['workspace'],
        appPath          = path.join(workspace, '/apps/', appName.toLowerCase(), '/');

    if (!Array.isArray(themes)) {
        themes = [themes];
    }

    fs.mkdirp(appPath, err => {
        if (err) {
            throw err;
        }

        require('./createApp')          .init(appName, appPath, fs, os, path);
        require('./createIndexJs')      .init(path.join(process.cwd(), workspace), fs, os, path);
        require('./createIndexHtml')    .init(appName, appPath, fs, mainThreadAddons, os, path, themes, useSharedWorkers);
        require('./createMainContainer').init(appName, appPath, fs, os, path);
        require('./createGitignore')    .init(workspace, fs, os, path);
        require('./createMyAppsJson')   .init(appName, workspace, fs, mainThreadAddons, os, path, themes, useSharedWorkers);
        require('./createPackageJson')  .init(appName, workspace, fs, os, path);

        const cpOpts = { env: process.env, cwd: workspace, stdio: 'inherit' };

        // npm install
        cp.spawnSync(npmCmd, ['i'], cpOpts);

        require('./copyDocsApp').init(fs, os, path, workspace);

        cp.spawnSync('node', ['./node_modules/neo.mjs/buildScripts/buildAll.js', '-n', '-l', 'no'], {
            cwd  : path.join(process.cwd(), workspace),
            env  : process.env,
            stdio: 'inherit'
        });

        if (program.start === 'true') {
            logBuildTime();
            cp.spawnSync(npmCmd, ['run', 'server-start'], cpOpts);
        } else {
            // Cleanup
            handleExit();
        }
    });
});