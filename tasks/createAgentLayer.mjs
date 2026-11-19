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
 * @summary The skills release a workspace takes: the caret of the release the engine pins, so the workspace gets the
 * engine's release and the newer ones in its major. `scripts/check-engine-parity.mjs` fails when it differs from the
 * caret of the pin in the engine release the scaffold's `neo.mjs` range resolves to.
 * @member {String}
 */
export const AGENT_SKILLS_RANGE = '^2.0.1';

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
 * @summary The npm package that runs the standalone Memory Core MCP server with no checkout.
 * @member {String}
 */
export const MEMORY_CORE_PACKAGE = 'neo-memory-core';

/**
 * @summary Normalizes an app or folder name into a portable lowercase slug (`neo-app` fallback), never a path.
 * @param {String} rawName
 * @returns {String}
 */
export function toWorkspaceSlug(rawName) {
    const cleaned = String(rawName ?? '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return cleaned || 'neo-app'
}

/**
 * @summary Normalizes the CLI `--memory` flag (`true`, `'yes'`, or `'no'`) into a boolean.
 * @param {Boolean|String} value
 * @returns {Boolean}
 */
export function resolveUseMemory(value) {
    return value === true || value === 'yes'
}

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
    AGENTS_MD_ARGS = ['--no-install', 'neo-agent-skills-agents-md', '--repo', 'neo-app-workspace', '--audience', 'app', '--out', 'AGENTS.md'],
    // Guidance appended once to AGENTS.md when --memory is enabled; kept in step with StandaloneServer#getServerInstructions.
    MEMORY_AGENTS_MD_SECTION = [
        '## Persistent Memory (neo-memory-core)',
        '',
        'This workspace configures standalone `neo-memory-core` (`npx -y neo-memory-core`) for cross-harness episodic memory:',
        '- At session start, call `query_recent_turns` (and `query_raw_memories` for targeted keyword recall) to recover prior decisions before re-deriving context.',
        '- After completing meaningful work, call `add_memory` (`prompt`, `decisionContext`, `response`) so subsequent sessions inherit durable context.'
    ].join('\n') + '\n',
    hasMemoryGuidance = text => /^## Persistent Memory \(neo-memory-core\)/m.test(text) || text.includes(MEMORY_CORE_PACKAGE);

export default {
    /**
     * @summary Writes missing project MCP configs, and when `useMemory` is enabled adds a missing `memory-core` entry to existing configs without altering other servers.
     * @param {String}  workspace
     * @param {Object}  fs
     * @param {Object}  path
     * @param {Object}  [options={}]
     * @param {String}  [options.appName]
     * @param {Boolean} [options.useMemory=false]
     * @returns {String[]} The files it wrote or updated, relative to the workspace
     */
    writeMcpConfigs(workspace, fs, path, {appName, useMemory = false} = {}) {
        const
            slug             = useMemory ? toWorkspaceSlug(appName || path.basename(workspace)) : null,
            memoryEntry      = useMemory ? {command: 'npx', args: ['-y', MEMORY_CORE_PACKAGE, '--workspace', slug]} : null,
            codexMemoryBlock = useMemory ? `[mcp_servers.memory-core]\ncommand = "npx"\nargs    = ["-y", "${MEMORY_CORE_PACKAGE}", "--workspace", "${slug}"]\n` : null,
            written          = [],
            mcpFile          = path.join(workspace, '.mcp.json'),
            codexFile        = path.join(workspace, '.codex/config.toml');

        if (!fs.existsSync(mcpFile)) {
            const mcpServers = {'neural-link': {command: 'npx', args: ['-y', NEURAL_LINK_PACKAGE]}};

            if (useMemory) {
                mcpServers['memory-core'] = memoryEntry;
            }
            fs.writeFileSync(mcpFile, JSON.stringify({mcpServers}, null, 4) + '\n');
            written.push('.mcp.json');
        } else if (useMemory) {
            let parsed = null;
            try {
                parsed = JSON.parse(fs.readFileSync(mcpFile, 'utf-8'));
            } catch {
                parsed = null;
            }
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                const servers = parsed.mcpServers && typeof parsed.mcpServers === 'object' && !Array.isArray(parsed.mcpServers)
                    ? parsed.mcpServers
                    : {};
                if (!Object.hasOwn(servers, 'memory-core')) {
                    parsed.mcpServers = {...servers, 'memory-core': memoryEntry};
                    fs.writeFileSync(mcpFile, JSON.stringify(parsed, null, 4) + '\n');
                    written.push('.mcp.json');
                }
            }
        }

        if (!fs.existsSync(codexFile)) {
            fs.mkdirSync(path.dirname(codexFile), {recursive: true});
            const baseToml = `[mcp_servers.neural-link]\ncommand = "npx"\nargs    = ["-y", "${NEURAL_LINK_PACKAGE}"]\n`;
            fs.writeFileSync(codexFile, useMemory ? `${baseToml}\n${codexMemoryBlock}` : baseToml);
            written.push('.codex/config.toml');
        } else if (useMemory) {
            const existingToml = fs.readFileSync(codexFile, 'utf-8');
            if (!/^\s*\[mcp_servers\.(?:"memory-core"|'memory-core'|memory-core)(?:\.|\])/m.test(existingToml)) {
                const nextToml = existingToml.trim().length > 0 ? `${existingToml.trimEnd()}\n\n${codexMemoryBlock}` : codexMemoryBlock;
                fs.writeFileSync(codexFile, nextToml);
                written.push('.codex/config.toml');
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
     * @summary Emits `AGENTS.md` when absent, and when `useMemory` is enabled appends the `neo-memory-core` section once if missing.
     * @param {String}   workspace
     * @param {Object}   fs
     * @param {Object}   path
     * @param {Function} spawnSync
     * @param {String}   npxCmd
     * @param {Object}   [options={}]
     * @param {Boolean}  [options.useMemory=false]
     * @returns {Boolean} Whether the file was created or updated
     */
    generateAgentsMd(workspace, fs, path, spawnSync, npxCmd, {useMemory = false} = {}) {
        const
            target               = path.join(workspace, 'AGENTS.md'),
            appendMemoryIfMissing = () => {
                if (!useMemory || !fs.existsSync(target)) {
                    return false
                }
                const existing = fs.readFileSync(target, 'utf-8');
                if (hasMemoryGuidance(existing)) {
                    return false
                }
                const next = existing.trim().length > 0 ? `${existing.trimEnd()}\n\n${MEMORY_AGENTS_MD_SECTION}` : MEMORY_AGENTS_MD_SECTION;
                fs.writeFileSync(target, next);
                return true
            };

        if (fs.existsSync(target)) {
            return appendMemoryIfMissing()
        }

        const result = spawnSync(npxCmd, AGENTS_MD_ARGS, {cwd: workspace, encoding: 'utf-8', shell: true, stdio: 'inherit'});

        if (result.status !== 0) {
            throw new Error(`neo-app: the AGENTS.md generator exited ${result.status ?? result.error?.message}; is neo-agent-skills ${AGENT_SKILLS_RANGE} installed?`)
        }

        appendMemoryIfMissing();
        return true
    },

    /**
     * @summary Adds the layer to an existing workspace (`--agent-only`): the skills dependency and its `prepare`, and
     * `useAiClient` in every app that does not set it. A key the workspace already sets is left as it is.
     * @param {String}  workspace
     * @param {Object}  fs
     * @param {Object}  os
     * @param {Object}  path
     * @param {Object}  [options={}]
     * @param {String}  [options.appName]
     * @param {Boolean} [options.useMemory=false]
     * @returns {String[]} The files it changed, relative to the workspace
     */
    addToWorkspace(workspace, fs, os, path, {appName, useMemory = false} = {}) {
        const
            changed         = [],
            packageJsonPath = path.join(workspace, 'package.json'),
            packageJson     = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')),
            resolvedAppName = appName || packageJson.name || path.basename(workspace);

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

        changed.push(...this.writeMcpConfigs(workspace, fs, path, {appName: resolvedAppName, useMemory}));

        return changed
    }
};
