#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const options = {
    target: 'both',
    dest: process.cwd(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--target') {
      options.target = argv[index + 1] || '';
      index += 1;
    } else if (arg === '--dest') {
      options.dest = argv[index + 1] || '';
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function usage() {
  return [
    'Usage: ./install.sh [--target claude-code|codex|both] [--dest /path/to/project]',
    '',
    'Installs cc-harness skills and hooks into a project for Claude Code and/or Codex.',
  ].join('\n');
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyDir(source, target) {
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(source, target, { recursive: true });
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function commandFor(scriptPath, args = []) {
  const quotedScript = JSON.stringify(scriptPath);
  return ['node', quotedScript, ...args.map((arg) => JSON.stringify(arg))].join(' ');
}

function claudeHooks(claudeRoot) {
  const hookRoot = path.join(claudeRoot, 'scripts', 'hooks');
  const runner = path.join(hookRoot, 'run-with-flags.js');
  return {
    SessionStart: [{
      matcher: '*',
      hooks: [{
        type: 'command',
        command: commandFor(path.join(hookRoot, 'session-start-bootstrap.js')),
      }],
      description: 'Inject using-brainstorming skill and memory snapshot on session start',
      id: 'session-start',
    }],
    UserPromptSubmit: [{
      matcher: '*',
      hooks: [{
        type: 'command',
        command: commandFor(runner, ['user-prompt-submit:plan-status', 'scripts/hooks/plan-status.js', 'standard,strict']),
      }],
      description: 'Inject current active plan status on every user prompt',
      id: 'plan-status',
    }],
    PreToolUse: [{
      matcher: '*',
      hooks: [{
        type: 'command',
        command: commandFor(runner, ['pre-tool-use:plan-refresh', 'scripts/hooks/plan-refresh.js', 'standard,strict']),
      }],
      description: 'Refresh active plan and run trace before tool execution',
      id: 'plan-refresh',
    }],
    PostToolUse: [{
      matcher: '*',
      hooks: [{
        type: 'command',
        command: commandFor(runner, ['post-tool-use:plan-write-reminder', 'scripts/hooks/plan-write-reminder.js', 'standard,strict']),
      }],
      description: 'Remind the agent to update Run Trace after writes',
      id: 'plan-write-reminder',
    }],
    Stop: [{
      matcher: '*',
      hooks: [{
        type: 'command',
        command: commandFor(runner, ['stop:plan-stop-check', 'scripts/hooks/plan-stop-check.js', 'standard,strict']),
      }],
      description: 'Check active plan completeness before stop',
      id: 'plan-stop-check',
    }],
  };
}

function codexHooks(codexRoot) {
  const hookRoot = path.join(codexRoot, 'scripts', 'hooks');
  return {
    SessionStart: [{
      matcher: 'startup|resume',
      hooks: [{
        type: 'command',
        command: commandFor(path.join(hookRoot, 'session-start.js')),
      }],
      description: 'Inject using-brainstorming skill and memory snapshot on session start',
      id: 'session-start',
    }],
    UserPromptSubmit: [{
      hooks: [{
        type: 'command',
        command: commandFor(path.join(hookRoot, 'plan-status.js')),
      }],
      description: 'Attach current active plan summary before prompt submission',
      id: 'plan-status',
    }],
    PreToolUse: [{
      matcher: 'Bash',
      hooks: [{
        type: 'command',
        command: commandFor(path.join(hookRoot, 'plan-refresh.js')),
      }],
      description: 'Re-anchor the active plan before Bash tool use',
      id: 'plan-refresh',
    }],
    PostToolUse: [{
      matcher: 'Bash',
      hooks: [{
        type: 'command',
        command: commandFor(path.join(hookRoot, 'plan-write-reminder.js')),
      }],
      description: 'Remind the agent to update Run Trace after writes',
      id: 'plan-write-reminder',
    }],
    Stop: [{
      hooks: [{
        type: 'command',
        command: commandFor(path.join(hookRoot, 'plan-stop-check.js')),
      }],
      description: 'Check active plan completeness before stop',
      id: 'plan-stop-check',
    }],
  };
}

function installSharedFiles(runtimeRoot) {
  copyDir(path.join(repoRoot, 'skills'), path.join(runtimeRoot, 'skills'));
  copyDir(path.join(repoRoot, 'scripts', 'hooks'), path.join(runtimeRoot, 'scripts', 'hooks'));
  writeJson(path.join(runtimeRoot, 'hook-logging.json'), {
    enabled: true,
    logPath: 'logs/hooks.log',
  });
}

function installClaude(dest) {
  const claudeRoot = path.join(dest, '.claude');
  installSharedFiles(claudeRoot);
  const settingsPath = path.join(claudeRoot, 'settings.json');
  const settings = readJsonIfExists(settingsPath);
  settings.$schema = settings.$schema || 'https://json.schemastore.org/claude-code-settings.json';
  settings.hooks = {
    ...(settings.hooks || {}),
    ...claudeHooks(claudeRoot),
  };
  writeJson(settingsPath, settings);
  return claudeRoot;
}

function installCodex(dest) {
  const codexRoot = path.join(dest, '.codex');
  installSharedFiles(codexRoot);
  writeJson(path.join(codexRoot, 'hooks.json'), { hooks: codexHooks(codexRoot) });
  fs.writeFileSync(path.join(codexRoot, 'config.toml'), '[features]\ncodex_hooks = true\n');
  return codexRoot;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  const target = String(options.target || '').trim();
  const dest = path.resolve(options.dest || process.cwd());
  if (!['claude-code', 'codex', 'both'].includes(target)) {
    throw new Error(`Invalid --target value: ${target}`);
  }

  const installed = [];
  if (target === 'claude-code' || target === 'both') {
    installed.push(installClaude(dest));
  }
  if (target === 'codex' || target === 'both') {
    installed.push(installCodex(dest));
  }

  console.log('cc-harness installed:');
  for (const dir of installed) {
    console.log(`- ${dir}`);
  }
}

try {
  main();
} catch (error) {
  console.error(`install failed: ${error.message}`);
  process.exit(1);
}
