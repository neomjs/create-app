#!/usr/bin/env node
/**
 * @summary Contract checks for the coding-agent layer: what a new workspace gets with and without it, and what
 * `--agent-only` adds to an existing one — against real files in a throwaway directory, with no install.
 */

import assert                                                from 'node:assert/strict';
// node:fs, not fs-extra: the CI job runs this with no install, and the tasks need only the plain calls.
import fs                                                    from 'node:fs';
import os                                                    from 'node:os';
import path                                                  from 'node:path';
import createAgentLayer, {AGENT_SKILLS_RANGE, AI_CLIENT_ENVIRONMENT, NEURAL_LINK_PACKAGE} from '../tasks/createAgentLayer.mjs';
import createNeoConfigJson                                   from '../tasks/createNeoConfigJson.mjs';
import createPackageJson                                     from '../tasks/createPackageJson.mjs';

const
    root    = fs.mkdtempSync(path.join(os.tmpdir(), 'neo-app-agent-')),
    read    = (...parts) => JSON.parse(fs.readFileSync(path.join(...parts), 'utf-8')),
    scaffold = (name, agent) => {
        const workspace = path.join(root, name),
              appPath   = path.join(workspace, 'apps', 'myapp');

        fs.mkdirSync(appPath, {recursive: true});
        createPackageJson.init('MyApp', workspace, fs, os, path, agent);
        createNeoConfigJson.init('MyApp', appPath, fs, ['DragDrop', 'Navigator', 'Stylesheet'], os, path, ['all'], 'no', 'no', agent);
        if (agent) {
            createAgentLayer.writeClaudeMd(workspace, fs, path);
            createAgentLayer.writeMcpConfigs(workspace, fs, path);
        }

        return workspace
    };

try {
    // ── A new workspace gets the layer by default ────────────────────────────────────────────────
    {
        const workspace   = scaffold('with', true),
              packageJson = read(workspace, 'package.json');

        assert.equal(packageJson.scripts.prepare, 'neo-agent-skills-materialize --audience app', 'its install links the app skills');
        assert.equal(packageJson.devDependencies['neo-agent-skills'], AGENT_SKILLS_RANGE, 'from the release that declares them');
        assert.deepEqual(Object.keys(packageJson.devDependencies), [...Object.keys(packageJson.devDependencies)].sort(), 'devDependencies stay alphabetical');
        assert.deepEqual(Object.keys(packageJson.scripts), [...Object.keys(packageJson.scripts)].sort(), 'and so do the scripts');
        assert.equal(read(workspace, 'apps', 'myapp', 'neo-config.json').useAiClient, AI_CLIENT_ENVIRONMENT, 'the app connects to the Neural Link in development');
        assert.equal(fs.readFileSync(path.join(workspace, 'CLAUDE.md'), 'utf-8'), '@AGENTS.md\n', 'and CLAUDE.md only imports AGENTS.md');

        // Project MCP configs start the published Neural Link package; nothing in a user's home is touched.
        assert.deepEqual(read(workspace, '.mcp.json'), {mcpServers: {'neural-link': {command: 'npx', args: ['-y', NEURAL_LINK_PACKAGE]}}},
            'Claude Code starts the Neural Link from npm');
        assert.equal(fs.readFileSync(path.join(workspace, '.codex', 'config.toml'), 'utf-8'),
            `[mcp_servers.neural-link]\ncommand = "npx"\nargs    = ["-y", "${NEURAL_LINK_PACKAGE}"]\n`, 'and so does Codex');
    }

    // ── --no-agent writes none of it ─────────────────────────────────────────────────────────────
    {
        const workspace   = scaffold('without', false),
              packageJson = read(workspace, 'package.json');

        assert.equal(packageJson.scripts.prepare, undefined, 'no prepare');
        assert.equal(packageJson.devDependencies['neo-agent-skills'], undefined, 'no skills dependency');
        assert.equal(read(workspace, 'apps', 'myapp', 'neo-config.json').useAiClient, undefined, 'no Neural Link client');
        assert.ok(!fs.existsSync(path.join(workspace, 'CLAUDE.md')), 'no CLAUDE.md');
        assert.ok(!fs.existsSync(path.join(workspace, '.mcp.json')) && !fs.existsSync(path.join(workspace, '.codex')), 'and no MCP config');
    }

    // ── --agent-only adds the layer to an existing workspace, and only once ──────────────────────
    {
        const workspace = scaffold('existing', false),
              other     = path.join(workspace, 'apps', 'other');

        fs.mkdirSync(other, {recursive: true});
        fs.writeFileSync(path.join(other, 'neo-config.json'), JSON.stringify({useAiClient: false}, null, 4));
        fs.writeFileSync(path.join(workspace, 'README.md'), 'mine\n');
        fs.writeFileSync(path.join(workspace, '.mcp.json'), '{"mcpServers": {}}\n');

        const changed = createAgentLayer.addToWorkspace(workspace, fs, os, path);

        assert.deepEqual(changed.sort(), ['.codex/config.toml', 'CLAUDE.md', path.join('apps', 'myapp', 'neo-config.json'), 'package.json'].sort(),
            'it changes the package and the app without the switch, and adds CLAUDE.md and the Codex config');
        assert.equal(fs.readFileSync(path.join(workspace, '.mcp.json'), 'utf-8'), '{"mcpServers": {}}\n', 'a workspace\'s own .mcp.json is never overwritten');
        assert.equal(read(other, 'neo-config.json').useAiClient, false, 'an app that already sets useAiClient keeps its choice');
        assert.equal(fs.readFileSync(path.join(workspace, 'README.md'), 'utf-8'), 'mine\n', 'and no other file changes');
        assert.deepEqual(createAgentLayer.addToWorkspace(workspace, fs, os, path), [], 'a second run changes nothing');
    }

    // ── AGENTS.md: an existing file is the workspace's, never regenerated ───────────────────────
    {
        const workspace = path.join(root, 'with');

        fs.writeFileSync(path.join(workspace, 'AGENTS.md'), 'edited\n');

        const spawned = [];

        assert.equal(createAgentLayer.generateAgentsMd(workspace, fs, path, (...args) => {spawned.push(args); return {status: 0}}, 'npx'), false);
        assert.equal(spawned.length, 0, 'the generator is not even started');
        assert.equal(fs.readFileSync(path.join(workspace, 'AGENTS.md'), 'utf-8'), 'edited\n');
    }

    // ── A generator that fails is a loud failure, not a missing file ────────────────────────────
    {
        const workspace = path.join(root, 'without');

        assert.throws(() => createAgentLayer.generateAgentsMd(workspace, fs, path, () => ({status: 1}), 'npx'), /AGENTS\.md generator exited 1/);
    }
} finally {
    fs.rmSync(root, {force: true, recursive: true});
}

console.log('agent-layer: contract arms green.');
