export default {
    init(appName, workspace, fs, os, path) {
        const lAppName          = appName.toLowerCase(),
              resourcesPath     = path.join(workspace, 'resources/scss'),
              srcPath           = path.join(resourcesPath, 'src'),
              themeDarkPath     = path.join(resourcesPath, 'theme-dark'),
              themeLightPath    = path.join(resourcesPath, 'theme-light'),
              themeNeoLightPath = path.join(resourcesPath, 'theme-neo-light');

        fs.mkdirpSync(path.join(srcPath,           'apps', lAppName));
        fs.mkdirpSync(path.join(themeDarkPath,     'apps', lAppName));
        fs.mkdirpSync(path.join(themeNeoLightPath, 'apps', lAppName));

        fs.writeFileSync(path.join(themeDarkPath,     '_all.scss'), ['@import "apps/all";'].join(os.EOL));
        fs.writeFileSync(path.join(themeLightPath,    '_all.scss'), ['@import "apps/all";'].join(os.EOL));
        fs.writeFileSync(path.join(themeNeoLightPath, '_all.scss'), ['@import "apps/all";'].join(os.EOL));

        fs.writeFileSync(path.join(themeDarkPath,     'apps', '_all.scss'), ['@import "' + lAppName + '/all";'].join(os.EOL));
        fs.writeFileSync(path.join(themeLightPath,    'apps', '_all.scss'), ['@import "' + lAppName + '/all";'].join(os.EOL));
        fs.writeFileSync(path.join(themeNeoLightPath, 'apps', '_all.scss'), ['@import "' + lAppName + '/all";'].join(os.EOL));

        fs.writeFileSync(path.join(themeDarkPath,     'apps', lAppName, '_all.scss'), os.EOL);
        fs.writeFileSync(path.join(themeLightPath,    'apps', lAppName, '_all.scss'), os.EOL);
        fs.writeFileSync(path.join(themeNeoLightPath, 'apps', lAppName, '_all.scss'), os.EOL);
    }
};
