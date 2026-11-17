/**
 * @summary Writes the workspace's dev-server config, which opens the app the generator wrote.
 *
 * The route lives in this config as a JavaScript string, never in the npm script `server-start`: a shell parses that
 * script, and `cmd.exe` expands `%…%` even inside a percent-encoded route. So the app name reaches the dev server as
 * data on every platform, and `npm run server-start -- --no-open` still overrides it from the command line.
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

        fs.writeFileSync(path.join(directory, 'webpack.server.config.mjs'), [
            '/**',
            ' * @summary The engine\'s dev-server config, opening the app create-app wrote.',
            ' * `npm run server-start -- --no-open` starts the server without a browser.',
            ' */',
            'import config from \'../node_modules/neo.mjs/buildScripts/webpack/webpack.server.config.mjs\';',
            '',
            'export default {',
            '    ...config,',
            '    devServer: {',
            '        ...config.devServer,',
            `        open: ${JSON.stringify(route)}`,
            '    }',
            '};',
            ''
        ].join(os.EOL))
    }
};
