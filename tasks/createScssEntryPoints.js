'use strict';

module.exports = {
    init: function(workspace, fs, os, path) {
        const scssPath = path.join(workspace, 'buildScripts/webpack/entrypoints/scss');
        let content;

        fs.mkdirpSync(scssPath);

        // create the .mjs files (webpack theme build entry points)

        content = ["import './scss_structure.scss';"].join(os.EOL);
        fs.writeFileSync(path.join(scssPath, 'scss_structure.scss.mjs'), content);

        content = ["import './theme_dark.noCss4.scss';"].join(os.EOL);
        fs.writeFileSync(path.join(scssPath, 'theme_dark.noCss4.scss.mjs'), content);

        content = ["import './theme_dark.scss';"].join(os.EOL);
        fs.writeFileSync(path.join(scssPath, 'theme_dark.scss.mjs'), content);

        content = ["import './theme_light.noCss4.scss';"].join(os.EOL);
        fs.writeFileSync(path.join(scssPath, 'theme_light.noCss4.scss.mjs'), content);

        content = ["import './theme_light.scss';"].join(os.EOL);
        fs.writeFileSync(path.join(scssPath, 'theme_light.scss.mjs'), content);

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