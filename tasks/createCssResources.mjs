export default {
    /**
     * @summary Creates the app's style folders under `resources/css`: `src` and one per theme, each with
     * `apps/<app>`. The engine's theme build reads plain CSS files there, so nothing is seeded: plain CSS has
     * no `@import` chain to start.
     * @param {String} appName
     * @param {String} workspace
     * @param {Object} fs
     * @param {Object} os
     * @param {Object} path
     */
    init(appName, workspace, fs, os, path) {
        const appFolder = path.join('apps', appName.toLowerCase());

        ['src', 'theme-dark', 'theme-light', 'theme-neo-light'].forEach(folder => {
            fs.mkdirpSync(path.join(workspace, 'resources/css', folder, appFolder))
        })
    }
};
