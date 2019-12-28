#!/usr/bin/env node

'use strict';

const chalk       = require('chalk'),
      commander   = require('commander'),
      cp          = require('child_process'),
      envinfo     = require('envinfo'),
      fs          = require('fs-extra'),
      inquirer    = require('inquirer'),
      mkdirp      = require('mkdirp'),
      os          = require('os'),
      packageJson = require('../package.json'),
      path        = require('path');

const program = new commander.Command(packageJson.name)
    .version(packageJson.version)
    .option('-i, --info',             'print environment debug info')
    .option('-n, --app-name <name>',  'name of your app in PascalCase')
    .option('-t, --themes <name>',    '"neo-theme-dark", "neo-theme-light", "both", "none"')
    .option('-w, --workspace <name>', 'name of the project root folder')
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

console.log(chalk.bold('Create neo.mjs app'));

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
        choices: ['neo-theme-dark', 'neo-theme-light', 'both', 'none'],
        default: 'both'
    });
}

const handleError = e => {
    console.error('ERROR! An error was encountered while executing');
    console.error(e);
    console.log('Exiting with error.');
    process.exit(1);
};

const handleExit = () => {
    console.log('Exiting without error.');
    process.exit();
};

process.on('SIGINT', handleExit);
process.on('uncaughtException', handleError);

inquirer.prompt(questions).then(answers => {
    const workspace = program.workspace || answers['workspace'],
          appName   = program.appName   || answers['appName'],
          themes    = program.themes    || answers['themes'],
          lAppName  = appName.toLowerCase(),
          appPath   = path.join(workspace, '/apps/', lAppName, '/');

    fs.mkdirp(appPath, err => {
        if (err) {
            throw err;
        }

        require('./createApp')          .init(appName, appPath, fs, os, path);
        require('./createIndexHtml')    .init(appName, appPath, fs, os, path, themes);
        require('./createMainContainer').init(appName, appPath, fs, os, path);
        require('./createGitignore')    .init(workspace, fs, os, path);
        require('./createPackageJson')  .init(appName, workspace, fs, os, path);

        // npm install
        cp.spawnSync(npmCmd, ['i'], { env: process.env, cwd: workspace, stdio: 'inherit' });

        // Cleanup
        handleExit();
    });
});