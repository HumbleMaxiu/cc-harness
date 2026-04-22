#!/usr/bin/env node
'use strict';

/**
 * session-start-bootstrap.js
 *
 * Bootstrap loader for the cc-harness SessionStart hook.
 *
 * Problem this solves: the previous approach embedded this logic as an inline
 * `node -e "..."` string inside hooks.json. Characters like `!` (used in
 * `!org.isDirectory()`) can trigger bash history expansion or other shell
 * interpretation issues depending on the environment, causing
 * "SessionStart:startup hook error" to appear in the Claude Code CLI header.
 *
 * By extracting to a standalone file, the shell never sees the JavaScript
 * source and the `!` characters are safe. Behaviour is otherwise identical.
 *
 * How it works:
 *   1. Reads the raw JSON event from stdin (passed by Claude Code).
 *   2. Resolves the hook runner script from the current mirrored directory first,
 *      then falls back to known plugin locations for Claude installs.
 *   3. Runs `session-start.js` which injects the using-brainstorming skill.
 *   4. Passes stdout/stderr through and forwards the child exit code.
 *   5. If the plugin root cannot be found, emits a warning and passes stdin
 *      through unchanged so Claude Code can continue normally.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function getStdinTimeoutMs() {
  const value = Number.parseInt(process.env.CC_HARNESS_HOOK_STDIN_TIMEOUT_MS || '1000', 10);
  return Number.isFinite(value) && value >= 0 ? value : 1000;
}

function readStdinWithTimeout(timeoutMs) {
  if (process.stdin.isTTY) {
    return Promise.resolve({ raw: '', timedOut: false });
  }

  return new Promise((resolve) => {
    let raw = '';
    let settled = false;

    const finish = (timedOut) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      process.stdin.removeListener('data', onData);
      process.stdin.removeListener('end', onEnd);
      process.stdin.removeListener('error', onError);
      resolve({ raw, timedOut });
    };

    const onData = (chunk) => {
      raw += chunk;
    };
    const onEnd = () => finish(false);
    const onError = () => finish(false);

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', onData);
    process.stdin.on('end', onEnd);
    process.stdin.on('error', onError);
    process.stdin.resume();

    const timer = setTimeout(() => finish(true), timeoutMs);
  });
}

const CURRENT_PLUGIN_SLUG = 'cc-harness';
const LEGACY_PLUGIN_SLUGS = ['ecc', 'everything-claude-code'];
const REL_HOOK_PATH = path.join('scripts', 'hooks', 'session-start.js');

/**
 * Returns true when `candidate` looks like a valid root containing the hook runner.
 *
 * @param {unknown} candidate
 * @returns {boolean}
 */
function hasHookScript(candidate) {
  const value = typeof candidate === 'string' ? candidate.trim() : '';
  return value.length > 0 && fs.existsSync(path.resolve(value));
}

/**
 * Resolve the runner script path across repo-local Codex mirrors and Claude plugin installs.
 *
 * @returns {string}
 */
function resolveScriptPath() {
  const directLocal = path.join(__dirname, 'session-start.js');
  if (hasHookScript(directLocal)) {
    return directLocal;
  }

  const repoLocal = path.join(process.cwd(), '.codex', REL_HOOK_PATH);
  if (hasHookScript(repoLocal)) {
    return repoLocal;
  }

  const envRoot = process.env.CLAUDE_PLUGIN_ROOT || '';
  const envScript = envRoot ? path.join(path.resolve(envRoot.trim()), REL_HOOK_PATH) : '';
  if (hasHookScript(envScript)) {
    return envScript;
  }

  const home = require('os').homedir();
  const claudeDir = path.join(home, '.claude');
  const directClaude = path.join(claudeDir, REL_HOOK_PATH);
  if (hasHookScript(directClaude)) {
    return directClaude;
  }

  const pluginRoots = [
    [CURRENT_PLUGIN_SLUG],
    [`${CURRENT_PLUGIN_SLUG}@${CURRENT_PLUGIN_SLUG}`],
    ['marketplace', CURRENT_PLUGIN_SLUG],
    ...LEGACY_PLUGIN_SLUGS.flatMap((slug) => [
      [slug],
      [`${slug}@${slug}`],
      ['marketplace', slug],
    ]),
  ].map((segments) => path.join(claudeDir, 'plugins', ...segments, REL_HOOK_PATH));

  for (const candidate of pluginRoots) {
    if (hasHookScript(candidate)) {
      return candidate;
    }
  }

  for (const slug of [CURRENT_PLUGIN_SLUG, ...LEGACY_PLUGIN_SLUGS]) {
    const cacheBase = path.join(claudeDir, 'plugins', 'cache', slug);
    try {
      for (const org of fs.readdirSync(cacheBase, { withFileTypes: true })) {
        if (!org.isDirectory()) continue;
        for (const version of fs.readdirSync(path.join(cacheBase, org.name), { withFileTypes: true })) {
          if (!version.isDirectory()) continue;
          const candidate = path.join(cacheBase, org.name, version.name, REL_HOOK_PATH);
          if (hasHookScript(candidate)) {
            return candidate;
          }
        }
      }
    } catch {
      // cache directory may not exist; that's fine
    }
  }

  return '';
}

async function main() {
  const { raw, timedOut } = await readStdinWithTimeout(getStdinTimeoutMs());
  if (timedOut) {
    process.stderr.write(
      '[SessionStart] WARNING: stdin read timed out; continuing with partial payload\n'
    );
  }

  const script = resolveScriptPath();

  if (script) {
    const result = spawnSync(
      process.execPath,
      [script],
      {
        input: raw,
        encoding: 'utf8',
        env: process.env,
        cwd: process.cwd(),
        timeout: 30000,
      }
    );

    const stdout = typeof result.stdout === 'string' ? result.stdout : '';
    if (stdout) {
      process.stdout.write(stdout);
    } else {
      process.stdout.write(raw);
    }

    if (result.stderr) {
      process.stderr.write(result.stderr);
    }

    if (result.error || result.status === null || result.signal) {
      const reason = result.error
        ? result.error.message
        : result.signal
          ? 'signal ' + result.signal
          : 'missing exit status';
      process.stderr.write('[SessionStart] ERROR: session-start hook failed: ' + reason + '\n');
      process.exit(1);
    }

    process.exit(Number.isInteger(result.status) ? result.status : 0);
  }

  process.stderr.write(
    '[SessionStart] WARNING: could not resolve cc-harness session-start runner; skipping session-start hook\n'
  );
  process.stdout.write(raw);
}

main().catch((error) => {
  process.stderr.write('[SessionStart] ERROR: unexpected failure: ' + error.message + '\n');
  process.exit(1);
});
