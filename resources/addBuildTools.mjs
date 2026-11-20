/**
 * @summary Installs a workspace's build tools once.
 *
 * A new workspace installs what its first run runs: dev mode needs no bundler. The packages the build scripts import
 * wait in `package.json` under `neo.buildTools`, with the ranges the engine release declares. The scripts that need
 * one run this file first. It moves the block into `devDependencies` and installs; with no block left it does
 * nothing, so a second run changes no file.
 */
import {spawnSync}                                 from 'node:child_process';
import {readFileSync, realpathSync, writeFileSync} from 'node:fs';
import os                                          from 'node:os';
import path                                        from 'node:path';
import process                                     from 'node:process';
import {fileURLToPath}                             from 'node:url';

/**
 * @summary Moves `neo.buildTools` into `devDependencies`; a range the workspace already declares stays.
 * @param {Object} packageJson Changed in place
 * @returns {String[]} The names that were added
 */
export function mergeBuildTools(packageJson) {
    const
        {buildTools = {}, ...neo} = packageJson.neo || {},
        declared                  = {...packageJson.dependencies, ...packageJson.devDependencies},
        added                     = Object.keys(buildTools).filter(name => !(name in declared));

    packageJson.devDependencies = Object.fromEntries(
        Object.entries({...packageJson.devDependencies, ...Object.fromEntries(added.map(name => [name, buildTools[name]]))})
            .sort(([a], [b]) => a.localeCompare(b))
    );

    if (Object.keys(neo).length > 0) {
        packageJson.neo = neo
    } else {
        delete packageJson.neo
    }

    return added
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
    const
        file        = path.resolve('package.json'),
        text        = readFileSync(file, 'utf8'),
        packageJson = JSON.parse(text);

    if (packageJson.neo?.buildTools) {
        const added = mergeBuildTools(packageJson);

        writeFileSync(file, JSON.stringify(packageJson, null, 4) + os.EOL);

        if (added.length > 0) {
            console.log(`Adding the build tools: ${added.join(', ')}`);

            const {status} = spawnSync('npm', ['install'], {shell: true, stdio: 'inherit'});

            if (status !== 0) {
                // The next run finds the block again and retries
                writeFileSync(file, text);
                process.exit(status ?? 1)
            }
        }
    }
}
