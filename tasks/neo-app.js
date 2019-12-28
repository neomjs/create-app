#!/usr/bin/env node

'use strict';

const chalk       = require('chalk'),
      commander   = require('commander'),
      cp          = require('child_process'),
      envinfo     = require('envinfo'),
      fs          = require('fs-extra'),
      inquirer    = require('inquirer'),
      os          = require('os'),
      path        = require('path'),
      packageJson = require('../package.json');

const program = new commander.Command(packageJson.name)
    .version(packageJson.version)
    .option('-i, --info',      'print environment debug info')
    .option('-n, --name',      'name of your app in PascalCase')
    .option('-t, --themes',    'array of themes to use inside your app')
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
    })
}

let foo = [{
    type   : 'input',
    name   : 'appName',
    message: 'Please choose a name for your neo app:',
    default: 'MyApp'
}, {
    type   : 'list',
    name   : 'theme',
    message: 'Please choose a theme for your neo app:',
    choices: ['neo-theme-dark', 'neo-theme-light', 'both'],
    default: 'both'
}];

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
    console.log(answers);

    const workspace = answers['workspace'],
          appName   = answers['appName'],
          lAppName  = appName.toLowerCase(),
          appPath   = 'apps/' + lAppName + '/',
          folder    = lAppName;

    console.log(workspace);

    fs.mkdir(folder, { recursive: true }, (err) => {
        if (err) {
            throw err;
        }

        require('./createApp')          .init(appName, folder, fs, os, path);
        require('./createIndexHtml')    .init(answers, appName, folder, fs, os, path);
        require('./createMainContainer').init(appName, folder, fs, os, path);
        require('./createGitignore')    .init(folder, fs, os, path);
        require('./createPackageJson')  .init(appName, folder, fs, os, path);

        // npm install
        cp.spawnSync(npmCmd, ['i'], { env: process.env, cwd: folder, stdio: 'inherit' });

        // Cleanup
        handleExit();
    });
});