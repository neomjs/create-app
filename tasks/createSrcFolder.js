'use strict';

module.exports = {
    init: function (folder, fs, os, path) {
        const content = [
            "// We ONLY need this empty file for the webpack dev server.",
            "// Without it, starting the server causes 2 errors.",
            "// => We are not mapping it to the dist folder, since we want to access the apps & examples folder as well.",
            "// Ticket: https://github.com/neomjs/neo/issues/1152"
        ].join(os.EOL);

        if (!fs.existsSync(path.join(folder, 'src'))) {
            fs.mkdirSync(path.join(folder, 'src'));
        }

        fs.writeFileSync(path.join(folder, 'src/index.js'), content);

        fs.copySync(path.join(__dirname, '../resources/MicroLoader.mjs'), path.join(folder, 'src/MicroLoader.mjs'));
    }
};
