/**
 * @summary Writes the workspace's server script, which starts the engine's file server and opens the app the
 * generator wrote.
 *
 * The route lives in this script as a JavaScript string, never in the npm script `server-start`: a shell parses that
 * script, and `cmd.exe` expands `%…%` even inside a percent-encoded route. So the app name reaches the server as data
 * on every platform, and `npm run server-start -- --no-open` still overrides it from the command line.
 */
export default {
    /**
     * @param {String} appName Its lower-cased form names the folder under `apps/` that the server opens
     * @param {String} folder  The workspace
     * @param {Object} fs
     * @param {Object} os
     * @param {Object} path
     */
    init(appName, folder, fs, os, path) {
        const directory = path.join(folder, 'buildScripts'),
              route     = `apps/${encodeURIComponent(appName.toLowerCase())}/`;

        fs.mkdirSync(directory, {recursive: true});

        fs.writeFileSync(path.join(directory, 'server.mjs'), [
            '/**',
            ' * @summary Starts the engine\'s file server on this workspace and opens the app create-app wrote.',
            ' * `npm run server-start -- --no-open` starts it without a browser; `--port <n>` or `PORT` picks the port.',
            ' */',
            'import {run} from \'../node_modules/neo.mjs/buildScripts/util/fileServer.mjs\';',
            '',
            `run({open: ${JSON.stringify(route)}});`,
            ''
        ].join(os.EOL))
    }
};
