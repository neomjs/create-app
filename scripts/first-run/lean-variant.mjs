// Rewrites what a packed generator's scaffold installs, for one measurement arm. Nothing of this merges.
// usage: node lean-variant.mjs <generator dir> <control | no-nested | lean | floor>
//   no-nested: the candidate without the second `npm i` inside node_modules/neo.mjs
//   lean     : no-nested, and only the packages a first-run step imports with the engine's scripts as they are
//   floor    : the engine, Font Awesome and the file server's one import; no postinstall
import fs   from 'node:fs';
import path from 'node:path';

const
    [dir, variant] = process.argv.slice(2),
    file           = path.join(dir, 'tasks/createPackageJson.mjs'),
    bundles        = 'npm run bundle-parse5 && npm run bundle-marked',
    sets           = {
        lean: {
            '@fortawesome/fontawesome-free': '^7.3.1',
            'autoprefixer'                 : '^10.6.1',
            'chalk'                        : '^6.0.1',
            'commander'                    : '^15.0.0',
            'cssnano'                      : '^9.3.2',
            'envinfo'                      : '^7.21.0',
            'esbuild'                      : '^0.28.2',
            'fs-extra'                     : '^11.4.1',
            'inquirer'                     : '^14.2.3',
            'marked'                       : '^18.1.0',
            'parse5'                       : '^8.0.1',
            'postcss'                      : '^8.5.29'
        },
        floor: {
            '@fortawesome/fontawesome-free': '^7.3.1',
            'commander'                    : '^15.0.0'
        }
    };

let source = fs.readFileSync(file, 'utf8');

const swap = (pattern, to, what) => {
    const found = source.match(new RegExp(pattern.source, 'g')) || [];

    if (found.length !== 1) {
        console.error(`${what}: expected one match in ${file}, found ${found.length}`);
        process.exit(1)
    }

    source = source.replace(pattern, to)
};

if (variant !== 'control') {
    const postinstall = /"postinstall" +: "cd node_modules\/neo\.mjs && npm i && npm run bundle-parse5 && npm run bundle-marked",\n/;

    swap(postinstall, variant === 'floor' ? '' : `"postinstall"        : "${bundles}",\n`, 'postinstall');

    // omit-dev: one list, split along npm's own two groups. What a first-run step imports moves to `dependencies`,
    // the rest stays in `devDependencies`, and the arm runs with npm_config_omit=dev.
    if (variant === 'omit-dev') {
        const
            block   = source.match(/ {12}devDependencies: \{([\s\S]*?)\n {12}\},/),
            entries = [...block[1].matchAll(/"([^"]+)" *: *"([^"]+)"/g)].map(([, name, range]) => [name, range]),
            first   = entries.filter(([name]) => name in sets.lean),
            later   = entries.filter(([name]) => !(name in sets.lean)),
            lines   = list => list.map(([name, range]) => `                ${JSON.stringify(name)}: ${JSON.stringify(range)}`).join(',\n');

        if (first.length !== Object.keys(sets.lean).length) {
            console.error(`omit-dev: ${first.length} of ${Object.keys(sets.lean).length} first-run packages found in the scaffold`);
            process.exit(1)
        }

        swap(/( {12}devDependencies: \{)[\s\S]*?(\n {12}\},)/, `$1\n${lines(later)}$2`, 'devDependencies');
        swap(/( {12}dependencies: \{\n)( {16}"neo\.mjs": "[^"]+")(\n {12}\},)/, `$1$2,\n${lines(first)}$3`, 'dependencies');
        swap(/packageJson\.devDependencies\['neo-agent-skills'\] = AGENT_SKILLS_RANGE;/, `packageJson.dependencies['neo-agent-skills'] = AGENT_SKILLS_RANGE;`, 'agent skills');

        console.log(`omit-dev: ${first.length + 1} dependencies and the skills, ${later.length} devDependencies`)
    }

    if (sets[variant]) {
        const block = Object.entries(sets[variant]).map(([name, range]) => `                ${JSON.stringify(name)}: ${JSON.stringify(range)}`).join(',\n');

        swap(/( {12}devDependencies: \{)[\s\S]*?(\n {12}\},)/, `$1\n${block}$2`, 'devDependencies')
    }

    fs.writeFileSync(file, source)
}

console.log(`${variant}: ${variant === 'control' ? 'unchanged' : `${Object.keys(sets[variant] || {}).length || 'all'} devDependencies, postinstall ${variant === 'floor' ? 'none' : bundles}`}`);
