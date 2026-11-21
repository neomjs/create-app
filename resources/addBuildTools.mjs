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
import {spawnSync}                                                                    from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync} from 'node:fs';
import path                                                                           from 'node:path';
import process                                                                        from 'node:process';
import {fileURLToPath}                                                                from 'node:url';

const
    LOCK         = path.join('node_modules', '.neo-build-tools.lock'),
    LOCK_PID     = path.join(LOCK, 'pid'),
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
 * @summary Does the process that holds the lock still run?
 * @returns {Boolean}
 */
function holderRuns() {
    let pid;

    try {
        pid = Number(readFileSync(LOCK_PID, 'utf8'))
    } catch {
        // A holder writes its pid right after it makes the folder, so a folder that stays empty is a leftover
        try {
            return Date.now() - statSync(LOCK).mtimeMs < 5000
        } catch {
            return false
        }
    }

    try {
        process.kill(pid, 0);
        return true
    } catch (error) {
        return error.code === 'EPERM'
    }
}

/**
 * @summary Waits until no other run adds the build tools, then holds the lock. A lock whose holder is gone is taken.
 */
function lock() {
    const deadline = Date.now() + LOCK_TIMEOUT;
    let told = false;

    mkdirSync('node_modules', {recursive: true});

    for (;;) {
        try {
            mkdirSync(LOCK);
            writeFileSync(LOCK_PID, String(process.pid));

            // Two runs can take a leftover lock in the same moment; the one whose pid stands holds it
            sleep(50);

            if (holdsLock()) {
                return
            }

            continue
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error
            }
        }

        if (!holderRuns()) {
            rmSync(LOCK, {force: true, recursive: true});
            continue
        }

        if (Date.now() > deadline) {
            console.error(`Another run still adds the build tools. If none does, remove ${LOCK} and run this again.`);
            process.exit(1)
        }

        if (!told) {
            console.log('Waiting for the run that adds the build tools …');
            told = true
        }

        sleep(250)
    }
}

/**
 * @returns {Boolean}
 */
function holdsLock() {
    try {
        return readFileSync(LOCK_PID, 'utf8') === String(process.pid)
    } catch {
        return false
    }
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
    const
        file      = path.resolve('package.json'),
        installed = name => existsSync(path.join('node_modules', name, 'package.json')),
        pending   = () => missingBuildTools(JSON.parse(readFileSync(file, 'utf8')), installed);

    // The usual run: the tools are there, and no other run is installing them
    if (pending().missing.length > 0 || existsSync(LOCK)) {
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
            holdsLock() && rmSync(LOCK, {force: true, recursive: true})
        }

        status !== 0 && process.exit(status)
    }
}
