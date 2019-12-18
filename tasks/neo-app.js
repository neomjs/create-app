#!/usr/bin/env node

'use strict';

//const fs = require('fs');
//const path = require('path');
//const cp = require('child_process');

console.log('Create neo.mjs app');

const handleExit = () => {
    console.log('Exiting without error.');
    process.exit();
};

const handleError = e => {
    console.error('ERROR! An error was encountered while executing');
    console.error(e);
    console.log('Exiting with error.');
    process.exit(1);
};

process.on('SIGINT', handleExit);
process.on('uncaughtException', handleError);

// Cleanup
handleExit();