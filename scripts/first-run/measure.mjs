// Runs one command and stamps every output line with the seconds since its start. The log lands in <cwd>.
// usage: node measure.mjs <label> <cwd> <npm cache dir | -> -- <cmd> [args...]
import {spawn} from 'node:child_process';
import fs      from 'node:fs';
import os      from 'node:os';
import path    from 'node:path';

const
    argv                = process.argv.slice(2),
    split               = argv.indexOf('--'),
    [label, cwd, cache] = argv.slice(0, split),
    [cmd, ...args]      = argv.slice(split + 1),
    logFile             = path.join(cwd, `${label}.log`),
    env                 = {...process.env, npm_config_progress: 'false', npm_config_fund: 'false', FORCE_COLOR: '0', NO_COLOR: '1'},
    loadStart           = os.loadavg()[0],
    t0                  = Date.now(),
    stamp               = () => ((Date.now() - t0) / 1000).toFixed(2).padStart(7);

let lines = 0, rest = '';

if (cache !== '-') {
    env.npm_config_cache = cache
}

fs.mkdirSync(cwd, {recursive: true});

const
    out    = fs.createWriteStream(logFile),
    // Windows starts npx and npm through .cmd shims, which Node spawns only through a shell
    child  = spawn(cmd, args, {cwd, env, stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32'}),
    onData = chunk => {
        const parts = (rest + chunk.toString()).split(/\r?\n|\r/);

        rest = parts.pop();

        for (const line of parts) {
            if (line.trim()) {
                lines++;
                out.write(`${stamp()} ${line}\n`)
            }
        }
    };

child.stdout.on('data', onData);
child.stderr.on('data', onData);

child.on('close', code => {
    rest.trim() && out.write(`${stamp()} ${rest}\n`);
    out.end(() => {
        console.log(JSON.stringify({
            label, code,
            wallSeconds: +((Date.now() - t0) / 1000).toFixed(2),
            lines, logFile,
            load1Start: +loadStart.toFixed(2),
            load1End  : +os.loadavg()[0].toFixed(2),
            at        : new Date().toISOString()
        }))
    })
});
