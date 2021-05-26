'use strict';

const cwd          = process.cwd(),
      fs           = require('fs-extra'),
      path         = require('path'),
      examplesPath = path.join(cwd, 'examples'),
      srcPath      = [
          '../node_modules/neo.mjs/src/',
          '../../node_modules/neo.mjs/src/',
          '../../../node_modules/neo.mjs/src/',
          '../../../../node_modules/neo.mjs/src/'
      ],
      srcRegex = [
          /..\/src\//gi,
          /..\/..\/src\//gi,
          /..\/..\/..\/src\//gi,
          /..\/..\/..\/..\/src\//gi
      ];

// copy the examples folder
fs.mkdirpSync(examplesPath);
fs.copySync(path.join(cwd, 'node_modules/neo.mjs/examples'), examplesPath);

const isFile = fileName => {
    return fs.lstatSync(fileName).isFile()
};

const parseFolder = (folderPath, index) => {
    let content, itemPath;

    fs.readdirSync(folderPath).forEach(itemName => {
        itemPath = path.join(folderPath, itemName);

        if (isFile(itemPath)) {
            content = fs.readFileSync(itemPath, 'utf8').replace(srcRegex[index], srcPath[index]);

            if (itemName.endsWith('.html')) {
                content = content.replace('});', `   ,workerBasePath: '${srcPath[index]}worker/'\n});`);
            }

            fs.writeFileSync(itemPath, content, 'utf8');
        } else {
            parseFolder(itemPath, index + 1);
        }
    });
};

parseFolder(examplesPath, 0);

process.exit();
