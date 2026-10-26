/**
 * @summary The coding-agent layer of a workspace: what an agent working in it reads first, and the skills it gets.
 *
 * A workspace `neo-app` creates is usually built by a coding agent, and an agent that knows nothing about the
 * engine writes React into it. The layer is four things, each from its single source:
 *
 * - `AGENTS.md`, emitted by the installed `neo-agent-skills` generator for the `neo-app-workspace` kind, after the
 *   workspace's own install. It is written once and then belongs to the workspace, so later installs never
 *   overwrite an edited copy.
 * - `CLAUDE.md`, which only imports `AGENTS.md`: Claude Code reads its own file name.
 * - the `app` skills, linked into `.agents/skills` and `.claude/skills` by the workspace's `prepare` on every install,
 *   so they update with the package.
 * - `useAiClient` in each app's `neo-config.json`, set to the development environment, so the app connects to the
 *   Neural Link while it is being built and never in a production build.
 * - project MCP configs, `.mcp.json` for Claude Code and `.codex/config.toml` for Codex, which start the published
 *   Neural Link package through `npx`. Never the user-home configs: a scaffold has no business there. Each client
 *   asks before it trusts a project's servers, and that consent stays the client's.
 */

/**
 * @summary The release whose skills carry the `app` audience.
 * @member {String}
 */
export const AGENT_SKILLS_RANGE = '^0.1.61';

/**
 * @summary The environment in which a scaffolded app connects to the Neural Link.
 * @member {String}
 */
export const AI_CLIENT_ENVIRONMENT = 'development';

/**
 * @summary The npm package that runs the Neural Link MCP server with no checkout.
 * @member {String}
 */
export const NEURAL_LINK_PACKAGE = 'neo-neural-link';

/**
 * @summary The scripts the layer adds to a workspace's `package.json`.
 * @member {Object}
 */
export const agentScripts = {
    prepare: 'neo-agent-skills-materialize --audience app'
};

const
    CLAUDE_MD = '@AGENTS.md\n',
    // The generator's declared kind for a workspace `neo-app` creates; never one of the engine's own repositories.
    AGENTS_MD_ARGS = ['--no-install', 'neo-agent-skills-agents-md', '--repo', 'neo-app-workspace', '--audience', 'app', '--out', 'AGENTS.md'];

export default {
    /**
     * @summary Writes the project MCP configs that start the Neural Link, each only where the workspace has none.
     * @param {String} workspace
     * @param {Object} fs
     * @param {Object} path
     * @returns {String[]} The files it wrote, relative to the workspace
     */
    writeMcpConfigs(workspace, fs, path) {
        const
            written = [],
            files   = {
                '.mcp.json'         : JSON.stringify({mcpServers: {'neural-link': {command: 'npx', args: ['-y', NEURAL_LINK_PACKAGE]}}}, null, 4) + '\n',
                '.codex/config.toml': `[mcp_servers.neural-link]\ncommand = "npx"\nargs    = ["-y", "${NEURAL_LINK_PACKAGE}"]\n`
            };

        for (const [name, content] of Object.entries(files)) {
            const file = path.join(workspace, name);

            if (!fs.existsSync(file)) {
                fs.mkdirSync(path.dirname(file), {recursive: true});
                fs.writeFileSync(file, content);
                written.push(name)
            }
        }

        return written
    },

    /**
     * @summary Writes `CLAUDE.md` into a workspace that has none.
     * @param {String} workspace
     * @param {Object} fs
     * @param {Object} path
     * @returns {Boolean} Whether the file was written
     */
    writeClaudeMd(workspace, fs, path) {
        const file = path.join(workspace, 'CLAUDE.md');

        if (fs.existsSync(file)) {
            return false
        }

        fs.writeFileSync(file, CLAUDE_MD);
        return true
    },

    /**
     * @summary Emits `AGENTS.md` from the workspace's installed skills package, unless the workspace already has one.
     * Run after the workspace's install: the generator is that install's `neo-agent-skills` binary.
     * @param {String}   workspace
     * @param {Object}   fs
     * @param {Object}   path
     * @param {Function} spawnSync
     * @param {String}   npxCmd
     * @returns {Boolean} Whether the file was written
     */
    generateAgentsMd(workspace, fs, path, spawnSync, npxCmd) {
        if (fs.existsSync(path.join(workspace, 'AGENTS.md'))) {
            return false
        }

        const result = spawnSync(npxCmd, AGENTS_MD_ARGS, {cwd: workspace, encoding: 'utf-8', shell: true, stdio: 'inherit'});

        if (result.status !== 0) {
            throw new Error(`neo-app: the AGENTS.md generator exited ${result.status ?? result.error?.message}; is neo-agent-skills ${AGENT_SKILLS_RANGE} installed?`)
        }

        return true
    },

    /**
     * @summary Adds the layer to an existing workspace (`--agent-only`): the skills dependency and its `prepare`, and
     * `useAiClient` in every app that does not set it. A key the workspace already sets is left as it is.
     * @param {String} workspace
     * @param {Object} fs
     * @param {Object} os
     * @param {Object} path
     * @returns {String[]} The files it changed, relative to the workspace
     */
    addToWorkspace(workspace, fs, os, path) {
        const
            changed         = [],
            packageJsonPath = path.join(workspace, 'package.json'),
            packageJson     = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

        packageJson.scripts         ??= {};
        packageJson.devDependencies ??= {};

        if (!packageJson.scripts.prepare && !packageJson.devDependencies['neo-agent-skills']) {
            Object.assign(packageJson.scripts, agentScripts);
            packageJson.devDependencies['neo-agent-skills'] = AGENT_SKILLS_RANGE;
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4) + os.EOL);
            changed.push('package.json')
        }

        const appsDir = path.join(workspace, 'apps');

        for (const app of fs.existsSync(appsDir) ? fs.readdirSync(appsDir) : []) {
            const configPath = path.join(appsDir, app, 'neo-config.json');

            if (!fs.existsSync(configPath)) {
                continue
            }

            const neoConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

            if (!('useAiClient' in neoConfig)) {
                neoConfig.useAiClient = AI_CLIENT_ENVIRONMENT;
                fs.writeFileSync(configPath, JSON.stringify(neoConfig, null, 4));
                changed.push(path.join('apps', app, 'neo-config.json'))
            }
        }

        if (this.writeClaudeMd(workspace, fs, path)) {
            changed.push('CLAUDE.md')
        }

        changed.push(...this.writeMcpConfigs(workspace, fs, path));

        return changed
    }
};
