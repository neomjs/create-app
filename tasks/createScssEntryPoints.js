'use strict';

module.exports = {
    init: function(workspace, fs, os, path) {
        const scssPath = path.join(workspace, 'buildScripts/webpack/entrypoints/scss');

        fs.mkdirpSync(scssPath);

        // create the .mjs files (webpack theme build entry points)

        function createMjsFile(name) {
            fs.writeFileSync(path.join(scssPath, name + '.mjs'), ["import './" + name + "';"].join(os.EOL));
        }

        createMjsFile('scss_structure.scss');
        createMjsFile('theme_dark.noCss4.scss');
        createMjsFile('theme_dark.scss');
        createMjsFile('theme_light.noCss4.scss');
        createMjsFile('theme_light.scss');

        // create the .scss files (combinations of theme & app based entrypoints)

        function createScssFile(name, folder, useCssVars) {
            let content = [
                '@use "sass:map";',
                '$neoMap: ();',
                '',
                '$useCss4Vars: ' + useCssVars + ';',
                '',
                '@import "../../../../node_modules/neo.mjs/resources/scss/mixins/all";',
                '@import "../../../../node_modules/neo.mjs/resources/scss/' + folder + '/all";',
            ];

            if (!useCssVars) {
                content.push('@import "../../../../node_modules/neo.mjs/resources/scss/src/all";');
            }

            content.push(
                '',
                '@import "../../../../resources/scss/' + folder + '/all";'
            );

            if (!useCssVars) {
                content.push('@import "../../../../resources/scss/src/all";');
            }

            fs.writeFileSync(path.join(scssPath, name), content.join(os.EOL));
        }

        createScssFile('scss_structure.scss',     'src',         true);
        createScssFile('theme_dark.noCss4.scss',  'theme-dark',  false);
        createScssFile('theme_dark.scss',         'theme-dark',  true);
        createScssFile('theme_light.noCss4.scss', 'theme-light', false);
        createScssFile('theme_light.scss',        'theme-light', true);
    }
};