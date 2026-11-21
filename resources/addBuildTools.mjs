/**
 * @summary Installs a workspace's build tools once.
 *
 * A new workspace installs what its first run runs: dev mode needs no bundler. The packages the build scripts import
 * stand in `package.json` under `neo.buildTools`, with the ranges the engine release declares. The scripts that need
 * one run this file first.
 *
 * The block is the recipe and stays. Done means that every tool of it is installed, so the next run repeats one that
 * failed or was interrupted, and a run with nothing to do changes no file. One run works at a time: a second one waits
 * for it and then finds the tools. `package.json` is written once, before npm starts, with the tools the workspace
 * does not declare yet. Nothing is written back afterwards, so an edit made in the meantime stays.
 */
import {spawnSync}                                                                       from 'node:child_process';
import {existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync} from 'node:fs';
import path                                                                              from 'node:path';
import process                                                                           from 'node:process';
import {fileURLToPath}                                                                   from 'node:url';

const
    LOCK         = path.join('node_modules', '.neo-build-tools.lock'),
    // This run's entry in the lock folder. The pid tells whether the run still lives, the time keeps a later
    // process with the same pid apart.
    ENTRY        = path.join(LOCK, `${process.pid}-${Date.now()}`),
    LOCK_TIMEOUT = 15 * 60 * 1000,
    sleep        = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/**
 * @summary The build tools `node_modules` lacks, and the ones among them the workspace does not declare yet.
 * @param {Object}   packageJson
 * @param {Function} installed   `name => Boolean`
 * @returns {{missing: String[], undeclared: Object}} `undeclared` maps a name to the recipe's range. A range the
 * workspace declares itself stays, so that name is only installed.
 */
export function missingBuildTools(packageJson, installed) {
    const
        buildTools = packageJson.neo?.buildTools || {},
        declared   = {...packageJson.dependencies, ...packageJson.devDependencies},
        missing    = Object.keys(buildTools).filter(name => !installed(name));

    return {
        missing,
        undeclared: Object.fromEntries(missing.filter(name => !(name in declared)).map(name => [name, buildTools[name]]))
    }
}

/**
 * @summary Adds ranges to the `devDependencies` of a manifest's text. Its indent and its line ending stay.
 * @param {String} text  The content of `package.json`
 * @param {Object} tools name → range
 * @returns {String}
 */
export function declareTools(text, tools) {
    const
        packageJson = JSON.parse(text),
        indent      = text.match(/^[ \t]+(?=")/m)?.[0] ?? '    ',
        eol         = text.includes('\r\n') ? '\r\n' : '\n';

    packageJson.devDependencies = Object.fromEntries(
        Object.entries({...packageJson.devDependencies, ...tools}).sort(([a], [b]) => a.localeCompare(b))
    );

    return JSON.stringify(packageJson, null, indent).replaceAll('\n', eol) + (/\n$/.test(text) ? eol : '')
}

/**
 * @summary Does a process with this pid run?
 * @param {Number} pid
 * @returns {Boolean}
 */
function isRunning(pid) {
    try {
        process.kill(pid, 0);
        return true
    } catch (error) {
        return error.code === 'EPERM'
    }
}

/**
 * @summary The entries of the other runs in the lock folder that still live.
 *
 * An entry whose process is gone is removed, by its own name: no step here can take a living run's entry.
 * @returns {String[]}
 */
function otherRuns() {
    return readdirSync(LOCK).filter(name => {
        const
            file = path.join(LOCK, name),
            pid  = parseInt(name, 10);

        if (file === ENTRY) {
            return false
        }

        // This run's own pid under another name was left by an earlier process
        if (pid > 0 && pid !== process.pid && isRunning(pid)) {
            return true
        }

        rmSync(file, {force: true});
        return false
    })
}

/**
 * @summary Waits until no other run adds the build tools, then holds the lock.
 *
 * A run writes its entry first and looks second, so of two runs at least one sees the other. It holds the lock while
 * its entry is the only living one in the folder; a run that sees another takes its entry back, waits and tries
 * again. No run removes the folder, so none can remove what another is about to write into.
 */
function lock() {
    const deadline = Date.now() + LOCK_TIMEOUT;

    for (let look = 1;; look++) {
        mkdirSync(LOCK, {recursive: true});
        writeFileSync(ENTRY, '');

        if (otherRuns().length === 0) {
            return
        }

        unlock();

        if (Date.now() > deadline) {
            console.error(`Another run still adds the build tools. If none does, remove ${LOCK} and run this again.`);
            process.exit(1)
        }

        // Two runs that start together both step back once; one that is still there at the second look works
        look === 2 && console.log('Waiting for the run that adds the build tools …');

        // A different wait for each run, so two that stepped back together do not meet again
        sleep(200 + Math.random() * 100)
    }
}

/**
 * @summary Takes this run's entry out of the lock folder.
 */
function unlock() {
    rmSync(ENTRY, {force: true})
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
    const
        file      = path.resolve('package.json'),
        installed = name => existsSync(path.join('node_modules', name, 'package.json')),
        pending   = () => missingBuildTools(JSON.parse(readFileSync(file, 'utf8')), installed);

    // The usual run: the tools are there, and no run stands in the lock folder
    if (pending().missing.length > 0 || existsSync(LOCK) && readdirSync(LOCK).length > 0) {
        let status = 0;

        lock();

        try {
            const {missing, undeclared} = pending();

            if (missing.length > 0) {
                console.log(`Adding the build tools: ${missing.join(', ')}`);

                if (Object.keys(undeclared).length > 0) {
                    writeFileSync(file, declareTools(readFileSync(file, 'utf8'), undeclared))
                }

                // One string: the shell finds npm.cmd on Windows, and no argument list goes through it.
                // --include=dev: a production environment would skip the tools and report success.
                status = spawnSync('npm install --include=dev', {shell: true, stdio: 'inherit'}).status ?? 1;

                if (status === 0 && pending().missing.length > 0) {
                    console.error(`npm install ended without these build tools: ${pending().missing.join(', ')}`);
                    status = 1
                }
            }
        } finally {
            unlock()
        }

        status !== 0 && process.exit(status)
    }
}
