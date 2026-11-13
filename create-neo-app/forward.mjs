import {spawnSync} from 'child_process';
import fs          from 'fs';
import path        from 'path';

const generator = 'neo-app@latest';

/**
 * @summary Chooses how the generator is started, so that no shell reads the forwarded arguments.
 *
 * A shell changes them: it expands `$NAME`, drops an empty string and splits on whitespace. `npx.cmd`
 * on Windows cannot be started without one, so npm's own JavaScript entry is run by node wherever it
 * is found, and `npx` from the path is the last resort.
 * @param {String[]} args The arguments to forward
 * @param {Object}   opts
 * @param {Object}   opts.env
 * @param {String}   opts.execPath The running node binary
 * @param {String}   opts.platform
 * @param {Function} [opts.exists=fs.existsSync]
 * @returns {{command: String, args: String[]}}
 */
export function resolveCommand(args, {env, execPath, platform, exists=fs.existsSync}) {
    const npmCli = env.npm_execpath;

    // Started by `npm create`, `npm init` or `npx`: npm names its own entry file.
    if (npmCli && path.basename(npmCli) === 'npm-cli.js' && exists(npmCli)) {
        return {command: execPath, args: [npmCli, 'exec', '--yes', '--', generator, ...args]}
    }

    if (platform === 'win32') {
        // The Windows installer keeps npm beside node.exe.
        const npxCli = path.join(path.dirname(execPath), 'node_modules', 'npm', 'bin', 'npx-cli.js');

        if (exists(npxCli)) {
            return {command: execPath, args: [npxCli, '--yes', generator, ...args]}
        }
    }

    return {command: 'npx', args: ['--yes', generator, ...args]}
}

/**
 * @summary Forwards the arguments to the latest `neo-app` and returns the exit status of that run.
 * @param {String[]} args
 * @param {Object}   [opts]
 * @param {Object}   [opts.env=process.env]
 * @param {String}   [opts.execPath=process.execPath]
 * @param {String}   [opts.platform=process.platform]
 * @returns {Number}
 */
export function forward(args, {env=process.env, execPath=process.execPath, platform=process.platform}={}) {
    const
        {command, args: commandArgs} = resolveCommand(args, {env, execPath, platform}),
        result                       = spawnSync(command, commandArgs, {env, stdio: 'inherit'});

    if (result.error) {
        console.error(`create-neo-app: the generator could not be started (${result.error.message}). Run: npx neo-app`);
        return 1
    }

    return result.status ?? 1
}
