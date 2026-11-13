#!/usr/bin/env node

import {spawnSync} from 'child_process';
import os          from 'os';

/**
 * @summary Runs the `neo-app` generator for `npm create neo-app` and `npm init neo-app`.
 *
 * npm maps both commands to the package `create-neo-app`. The generator's own name stays `neo-app`
 * (`npx neo-app`); this package only forwards to its latest release, so it never needs a release
 * of its own when the generator changes.
 */
const
    npxCmd = os.platform() === 'win32' ? 'npx.cmd' : 'npx',
    // The shell joins the arguments unescaped, so a value with whitespace is quoted first.
    args   = process.argv.slice(2).map(arg => /\s/.test(arg) ? JSON.stringify(arg) : arg),
    result = spawnSync(npxCmd, ['--yes', 'neo-app@latest', ...args], {shell: true, stdio: 'inherit'});

process.exit(result.status ?? 1);
