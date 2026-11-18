// Times the first run of a new workspace, several times, each from an empty npm cache:
// the generator, the server start, and the first styled frame in a headless browser.
// A runner has no browser for --open, so the generator runs with -s false and this script starts the
// server the generated `server-start` starts, with --no-open, and navigates itself.
// usage: node arm.mjs <arm label> <runs> <generator spec> <dir holding node_modules/playwright> <out dir> [shaping note]
import {spawn, spawnSync}             from 'node:child_process';
import fs                             from 'node:fs';
import os                             from 'node:os';
import path                           from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const
    [arm, runCount, generator, pwDir, outDir, shaping = 'none'] = process.argv.slice(2),
    here    = path.dirname(fileURLToPath(import.meta.url)),
    isWin   = process.platform === 'win32',
    pwPath  = pathToFileURL(path.join(pwDir, 'node_modules/playwright/index.mjs')).href,
    seconds = ms => +(ms / 1000).toFixed(2),
    // A packed generator stands in for a registry copy that does not exist yet. npx would install it into its cache
    // and run its bin; `npx --package <tarball>` is no stand-in, because it hands npm_config_package to every npx
    // the generator starts itself.
    packed  = /\.tgz$/.test(generator),
    measure = path.join(here, 'measure.mjs'),
    lastJson = text => { try { return JSON.parse(text.trim().split('\n').pop()) } catch (e) { return null } },
    runs    = [];

const waitForServer = async (base, timeoutMs) => {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        try {
            if ((await fetch(base + '/')).ok) {
                return
            }
        } catch (e) { /* not listening yet */ }

        await new Promise(resolve => setTimeout(resolve, 100))
    }

    throw new Error(`${base} did not answer within ${timeoutMs / 1000} s`)
};

// Reads the phases out of a stamped generator log. A marker a generator version does not print leaves its phase null.
const phases = logFile => {
    const
        lines = fs.readFileSync(logFile, 'utf8').split('\n').map(line => line.match(/^\s*([\d.]+) (.*)$/)).filter(Boolean)
            .map(([, at, text]) => ({at: +at, text})),
        at    = (pattern, from = 0) => lines.find(l => l.at >= from && pattern.test(l.text))?.at ?? null,
        span  = (start, end) => start != null && end != null ? +(end - start).toFixed(2) : null,
        welcome      = at(/Welcome to the Neo\.mjs App Generator/),
        firstBuild   = at(/ build(All|Themes)\b|Bundling highlight\.js/),
        installEnd   = lines.filter(l => /^added \d+ packages/.test(l.text) && (firstBuild == null || l.at <= firstBuild)).at(-1)?.at ?? null,
        nestedStart  = at(/ postinstall$/),
        hljsStart    = at(/Bundling highlight\.js/),
        themesStart  = at(/ buildThemes$/),
        threadsStart = at(/ buildThreads$/),
        threadsEnd   = at(/Total time for \S+ buildThreads/),
        end          = lines.at(-1)?.at ?? null;

    return {
        fetchGenerator: welcome,
        install       : span(welcome, installEnd),
        nestedInstall : span(nestedStart, nestedStart == null ? null : at(/^added \d+ packages/, nestedStart)),
        highlightJs   : span(hljsStart, at(/Minified highlight\.js bundle created/)),
        themes        : span(themesStart, threadsStart ?? end),
        webpack       : span(threadsStart, threadsEnd),
        distEsm       : span(threadsEnd, at(/Total time for dist\/esm/))
    }
};

const stop = server => {
    if (isWin) {
        spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'])
    } else {
        try { process.kill(-server.pid, 'SIGTERM') } catch (e) { /* already gone */ }
    }
};

fs.mkdirSync(outDir, {recursive: true});

for (let i = 1; i <= +runCount; i++) {
    const
        root  = fs.mkdtempSync(path.join(os.tmpdir(), `first-run-${i}-`)),
        cache = path.join(root, 'npm-cache'),
        ws    = path.join(root, 'ws'),
        base  = `http://127.0.0.1:${8090 + i}`,
        run   = {run: i},
        t0    = Date.now();

    // 1. The generator. Its defaults are passed as options, so no prompt waits.
    let command = ['npx', '--yes', generator], fetchSeconds = 0;

    if (packed) {
        const
            prefix  = path.join(root, 'generator'),
            fetched = spawnSync(process.execPath, [measure, `fetch-${i}`, root, cache, '--',
                'npm', 'install', '--prefix', prefix, '--no-audit', '--no-fund', generator], {encoding: 'utf8'});

        fetchSeconds = lastJson(fetched.stdout)?.wallSeconds ?? 0;
        command      = [path.join(prefix, 'node_modules', '.bin', 'neo-app')]
    }

    const generated = spawnSync(process.execPath, [measure, `generator-${i}`, root, cache, '--',
        ...command, '-n', 'MyApp', '-w', 'ws', '-t', 'all', '-u', 'no', '-s', 'false'], {encoding: 'utf8'});

    run.generatorSeconds = seconds(Date.now() - t0);
    run.generatorCode    = lastJson(generated.stdout)?.code ?? null;

    if (fs.existsSync(path.join(root, `generator-${i}.log`))) {
        fs.copyFileSync(path.join(root, `generator-${i}.log`), path.join(outDir, `generator-${i}.log`));
        run.phases = phases(path.join(outDir, `generator-${i}.log`));

        // the fetch of a packed generator is its install; the generator's own log starts after it
        run.phases.fetchGenerator != null && (run.phases.fetchGenerator = +(run.phases.fetchGenerator + fetchSeconds).toFixed(2))
    }

    try {
        run.engine = JSON.parse(fs.readFileSync(path.join(ws, 'node_modules/neo.mjs/package.json'), 'utf8')).version
    } catch (e) { /* the generator did not get that far */ }

    if (run.generatorCode !== 0 || !fs.existsSync(path.join(ws, 'package.json'))) {
        run.error = 'the generator did not finish';
        runs.push(run);
        continue
    }

    // On a machine that runs a Neural Link of its own, the probe app must not connect to it.
    if (process.env.FIRST_RUN_STRIP_AI_CLIENT) {
        const
            file   = path.join(ws, 'apps/myapp/neo-config.json'),
            config = JSON.parse(fs.readFileSync(file, 'utf8'));

        delete config.useAiClient;
        fs.writeFileSync(file, JSON.stringify(config, null, 4))
    }

    // 2. The server, as the generated workspace starts it, minus the browser.
    const
        serverStart = Date.now(),
        server      = spawn('npm', ['run', 'server-start', '--', '--port', String(8090 + i), '--no-open'],
            {cwd: ws, env: {...process.env, npm_config_cache: cache}, stdio: 'ignore', detached: !isWin, shell: isWin});

    try {
        await waitForServer(base, 180000);
        run.serverSeconds = seconds(Date.now() - serverStart);

        // 3. The first styled frame.
        const proof = spawnSync(process.execPath, [path.join(here, 'proof.mjs'), pwPath, `${base}/apps/myapp/index.html`], {encoding: 'utf8'});

        run.frame = lastJson(proof.stdout) || {error: (proof.stderr || proof.stdout || '').slice(0, 300)}
    } catch (e) {
        run.error = e.message
    } finally {
        stop(server)
    }

    if (run.frame?.textMs != null) {
        run.toTextSeconds = +(run.generatorSeconds + run.serverSeconds + run.frame.textMs / 1000).toFixed(2);
        run.toIdleSeconds = +(run.generatorSeconds + run.serverSeconds + run.frame.idleMs / 1000).toFixed(2)
    }

    runs.push(run);

    try { fs.rmSync(root, {recursive: true, force: true, maxRetries: 3}) } catch (e) { /* a busy file on Windows */ }
}

const
    measured = runs.filter(r => r.toIdleSeconds != null),
    spread   = key => {
        const values = measured.map(r => r[key]).sort((a, b) => a - b);

        return values.length ? {min: values[0], median: values[Math.floor(values.length / 2)], max: values.at(-1)} : null
    },
    report   = {
        arm, shaping,
        generator: process.env.GENERATOR_REF || generator,
        // a packed engine is read from disk: its download is not in the clock
        engineSource: process.env.ENGINE_LABEL || 'the registry, by the range the generator writes',
        machine: {
            platform: `${os.platform()} ${os.release()}`,
            image   : [process.env.ImageOS, process.env.ImageVersion].filter(Boolean).join(' ') || null,
            cpu     : `${os.cpus().length} x ${os.cpus()[0]?.model}`,
            memoryGb: +(os.totalmem() / 2 ** 30).toFixed(1),
            node    : process.version,
            npm     : spawnSync('npm', ['--version'], {encoding: 'utf8', shell: isWin}).stdout.trim()
        },
        cache        : 'empty npm cache per run',
        clock        : 'start of npx to the welcome text visible (toText) and to network idle (toIdle); the browser start is outside',
        runs,
        toTextSeconds: spread('toTextSeconds'),
        toIdleSeconds: spread('toIdleSeconds'),
        fiveSecondsMet: measured.length ? measured.every(r => r.toIdleSeconds <= 5) : null,
        at           : new Date().toISOString()
    };

fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

if (process.env.GITHUB_STEP_SUMMARY) {
    const
        cell      = value => value ?? '',
        rows      = runs.map(r => `| ${r.run} | ${cell(r.generatorSeconds)} | ${cell(r.serverSeconds)} | ${cell(r.frame?.textMs)} | ${cell(r.frame?.idleMs)} | ${cell(r.toTextSeconds)} | ${cell(r.toIdleSeconds)} | ${cell(r.frame?.requests)} | ${cell(r.frame?.failedCount)} | ${r.error || r.frame?.errors?.[0] || ''} |`),
        phaseRows = runs.map(r => `| ${r.run} | ${cell(r.engine)} | ${['fetchGenerator', 'install', 'nestedInstall', 'highlightJs', 'themes', 'webpack', 'distEsm'].map(key => cell(r.phases?.[key])).join(' | ')} |`);

    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, [
        `## ${arm}: ${report.generator}, shaping ${shaping}`,
        '',
        `${report.machine.cpu}, ${report.machine.memoryGb} GB, ${report.machine.platform}, ${report.machine.image || 'no image id'}, Node ${report.machine.node}, npm ${report.machine.npm}`,
        '',
        '| run | generator s | server s | text ms | idle ms | to text s | to idle s | requests | failed | first error |',
        '|---|---:|---:|---:|---:|---:|---:|---:|---:|---|',
        ...rows,
        '',
        'Seconds per generator phase; the nested install is part of the install, and an empty cell is a phase this generator does not run.',
        '',
        '| run | engine | fetch of the generator | install | nested install | highlight.js | themes | webpack | dist/esm |',
        '|---|---|---:|---:|---:|---:|---:|---:|---:|',
        ...phaseRows,
        '',
        `To the styled frame (network idle): ${JSON.stringify(report.toIdleSeconds)}. Five seconds met: ${report.fiveSecondsMet}.`,
        ''
    ].join('\n'))
}

process.exit(measured.length ? 0 : 1);
