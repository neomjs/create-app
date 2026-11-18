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
    const generated = spawnSync(process.execPath, [path.join(here, 'measure.mjs'), `generator-${i}`, root, cache, '--',
        'npx', '--yes', generator, '-n', 'MyApp', '-w', 'ws', '-t', 'all', '-u', 'no', '-s', 'false'], {encoding: 'utf8'});

    run.generatorSeconds = seconds(Date.now() - t0);
    run.generatorCode    = lastJson(generated.stdout)?.code ?? null;

    fs.existsSync(path.join(root, `generator-${i}.log`)) &&
        fs.copyFileSync(path.join(root, `generator-${i}.log`), path.join(outDir, `generator-${i}.log`));

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
        arm, generator, shaping,
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
    const rows = runs.map(r => `| ${r.run} | ${r.generatorSeconds ?? ''} | ${r.serverSeconds ?? ''} | ${r.frame?.textMs ?? ''} | ${r.frame?.idleMs ?? ''} | ${r.toTextSeconds ?? ''} | ${r.toIdleSeconds ?? ''} | ${r.frame?.requests ?? ''} | ${r.frame?.failedCount ?? ''} | ${r.error || r.frame?.errors?.[0] || ''} |`);

    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, [
        `## ${arm}: ${generator}, shaping ${shaping}`,
        '',
        `${report.machine.cpu}, ${report.machine.memoryGb} GB, ${report.machine.platform}, ${report.machine.image || 'no image id'}, Node ${report.machine.node}, npm ${report.machine.npm}`,
        '',
        '| run | generator s | server s | text ms | idle ms | to text s | to idle s | requests | failed | first error |',
        '|---|---:|---:|---:|---:|---:|---:|---:|---:|---|',
        ...rows,
        '',
        `To the styled frame (network idle): ${JSON.stringify(report.toIdleSeconds)}. Five seconds met: ${report.fiveSecondsMet}.`,
        ''
    ].join('\n'))
}

process.exit(measured.length ? 0 : 1);
