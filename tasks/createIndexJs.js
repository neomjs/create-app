'use strict';

module.exports = {
    init: function (folder, fs, os, path) {
        const content = [
            "// We ONLY need this empty file for the webpack dev server.",
            "// Without it, starting the server causes 2 errors.",
            "// => We are not mapping it to the dist folder, since we want to access the apps & examples folder as well.",
            "// Ticket: https://github.com/neomjs/neo/issues/1152"
        ].join(os.EOL);

        fs.writeFileSync(path.join(folder, 'index.js'), content);
    }
};