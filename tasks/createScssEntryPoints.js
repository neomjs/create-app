'use strict';

module.exports = {
    init: function(workspace, fs, os, path) {
        const scssPath = path.join(workspace, 'buildScripts/webpack/entrypoints/scss');
        let content;

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

        content = [
            '@use "sass:map";',
            '$neoMap: ();',
            '',
            '$useCss4Vars: true;',
            '',
            '@import "../../../../node_modules/neo.mjs/resources/scss/mixins/all";',
            '@import "../../../../node_modules/neo.mjs/resources/scss/src/all";',
            '',
            '@import "../../../../resources/scss/src/all";'
        ].join(os.EOL);

        fs.writeFileSync(path.join(scssPath, 'scss_structure.scss'), content);

        content = [
            '@use "sass:map";',
            '$neoMap: ();',
            '',
            '$useCss4Vars: false;',
            '',
            '@import "../../../../node_modules/neo.mjs/resources/scss/mixins/all";',
            '@import "../../../../node_modules/neo.mjs/resources/scss/theme-dark/all";',
            '@import "../../../../node_modules/neo.mjs/resources/scss/src/all";',
            '',
            '@import "../../../../resources/scss/theme-dark/all";',
            '@import "../../../../resources/scss/src/all";'
        ].join(os.EOL);

        fs.writeFileSync(path.join(scssPath, 'theme_dark.noCss4.scss'), content);

        content = [
            '@use "sass:map";',
            '$neoMap: ();',
            '',
            '$useCss4Vars: true;',
            '',
            '@import "../../../../node_modules/neo.mjs/resources/scss/mixins/all";',
            '@import "../../../../node_modules/neo.mjs/resources/scss/theme-dark/all";',
            '',
            '@import "../../../../resources/scss/theme-dark/all";',
        ].join(os.EOL);

        fs.writeFileSync(path.join(scssPath, 'theme_dark.scss'), content);

        content = [
            '@use "sass:map";',
            '$neoMap: ();',
            '',
            '$useCss4Vars: false;',
            '',
            '@import "../../../../node_modules/neo.mjs/resources/scss/mixins/all";',
            '@import "../../../../node_modules/neo.mjs/resources/scss/theme-light/all";',
            '@import "../../../../node_modules/neo.mjs/resources/scss/src/all";',
            '',
            '@import "../../../../resources/scss/theme-light/all";',
            '@import "../../../../resources/scss/src/all";'
        ].join(os.EOL);

        fs.writeFileSync(path.join(scssPath, 'theme_light.noCss4.scss'), content);

        content = [
            '@use "sass:map";',
            '$neoMap: ();',
            '',
            '$useCss4Vars: true;',
            '',
            '@import "../../../../node_modules/neo.mjs/resources/scss/mixins/all";',
            '@import "../../../../node_modules/neo.mjs/resources/scss/theme-light/all";',
            '',
            '@import "../../../../resources/scss/theme-light/all";',
        ].join(os.EOL);

        fs.writeFileSync(path.join(scssPath, 'theme_light.scss'), content);
    }
};