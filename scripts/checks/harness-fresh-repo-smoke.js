#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..', '..');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content);
}

function runNodeScript(scriptPath, args, options = {}) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: options.cwd || repoRoot,
    env: options.env || process.env,
    input: options.input || '',
    encoding: 'utf8',
    timeout: options.timeout || 30000,
  });

  return result;
}

function assertOk(result, label) {
  if (result.error || result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    const stdout = (result.stdout || '').trim();
    const details = [stderr, stdout].filter(Boolean).join('\n');
    throw new Error(`${label} failed.${details ? `\n${details}` : ''}`);
  }
}

function main() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-harness-smoke-'));
  const freshRepo = path.join(tempRoot, 'fresh-repo');
  ensureDir(freshRepo);

  try {
    writeFile(path.join(freshRepo, 'README.md'), '# Fresh Repo Smoke Test\n');
    const projectSettings = fs.readFileSync(
      path.join(repoRoot, 'examples', 'claude-code', 'project-settings.json'),
      'utf8'
    );
    writeFile(path.join(freshRepo, '.claude', 'settings.json'), projectSettings);

    const hookResult = runNodeScript(
      path.join(repoRoot, 'scripts', 'hooks', 'session-start-bootstrap.js'),
      [],
      {
        cwd: freshRepo,
        env: {
          ...process.env,
          CLAUDE_PLUGIN_ROOT: repoRoot,
        },
        input: '{"session":"fresh-repo-smoke"}',
      }
    );
    assertOk(hookResult, 'session-start smoke');

    const hookOutput = hookResult.stdout || '';
    if (!hookOutput.includes('<SKILL>')) {
      throw new Error('session-start smoke failed: expected <SKILL> injection in hook output');
    }
    if (!hookOutput.includes('using-brainstorming')) {
      throw new Error('session-start smoke failed: expected using-brainstorming skill content');
    }

    const scaffoldSubmission = path.join(
      repoRoot,
      'fixtures',
      'repos',
      'greenfield-scaffold',
      'samples',
      'pass-basic-scaffold',
      'submission'
    );

    const behaviorEvalResult = runNodeScript(
      path.join(repoRoot, 'scripts', 'checks', 'harness-behavior-evals.js'),
      ['--fixture', 'greenfield-scaffold', '--submission', scaffoldSubmission],
      {
        cwd: repoRoot,
      }
    );
    assertOk(behaviorEvalResult, 'greenfield scaffold acceptance smoke');

    console.log('Fresh repo smoke check passed.');
    console.log('- SessionStart hook injected plugin skill into a fresh repo.');
    console.log('- Greenfield scaffold sample passed acceptance grading.');
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

main();
