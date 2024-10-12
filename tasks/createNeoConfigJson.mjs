export default {
    init(appName, folder, fs, mainThreadAddons, os, path, themes, useSharedWorkers, useServiceWorker) {
        let neoConfig = {
            appPath       : `../../apps/${appName.toLowerCase()}/app.mjs`,
            basePath      : '../../',
            environment   : 'development',
            mainPath      : '../node_modules/neo.mjs/src/Main.mjs',
            workerBasePath: '../../node_modules/neo.mjs/src/worker/'
        };

        if (!(
            mainThreadAddons.includes('DragDrop')   &&
            mainThreadAddons.includes('Navigator')  &&
            mainThreadAddons.includes('Stylesheet') &&
            mainThreadAddons.length === 3)
        ) {
            neoConfig.mainThreadAddons = mainThreadAddons;
        }

        if (!themes.includes('all')) { // default value
            if (themes.includes('none')) {
                neoConfig.themes = [];
            } else {
                neoConfig.themes = themes;
            }
        }

        if (useSharedWorkers !== 'no') {
            neoConfig.useSharedWorkers = true;
        }

        if (useServiceWorker !== 'no') {
            neoConfig.useServiceWorker = true;
        }

        let configs = Object.entries(neoConfig).sort((a, b) => a[0].localeCompare(b[0]));
        neoConfig = {};

        configs.forEach(([key, value]) => {
            neoConfig[key] = value;
        });

        fs.writeFileSync(path.join(folder, 'neo-config.json'), JSON.stringify(neoConfig, null, 4));
    }
};
