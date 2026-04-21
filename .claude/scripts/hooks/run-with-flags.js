#!/usr/bin/env node
'use strict';

/**
 * run-with-flags.js
 *
 * Hook runner that applies hook-profile gating and executes the specified hook script.
 *
 * Usage: node run-with-flags.js <event> <hook-script> <flags>
 *
 * Arguments:
 *   event       - The hook event name (e.g., "session:start", "pre:bash:block-no-verify")
 *   hook-script - Path to the hook script (repo-local, mirrored, or plugin-relative)
 *   flags       - Comma-separated list of hook profiles this hook belongs to
 *                 (e.g., "minimal,standard,strict")
 *
 * Environment:
 *   ECC_HOOK_PROFILE - Controls which hooks run. Can be "minimal", "standard", or "strict".
 *                       Hooks only run if their flags overlap with the current profile.
 *                       Default is "standard".
 *
 * The hook profile hierarchy is:
 *   minimal  - Only essential hooks (session start, etc.)
 *   standard - Default hooks (most development hooks)
 *   strict   - All hooks including quality gates and strict checks
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Profile hierarchy - each level includes the previous
const PROFILE_HIERARCHY = {
  minimal: ['minimal'],
  standard: ['minimal', 'standard'],
  strict: ['minimal', 'standard', 'strict'],
};

/**
 * Get the current hook profile from ECC_HOOK_PROFILE env var
 */
function getCurrentProfile() {
  const profile = process.env.ECC_HOOK_PROFILE || 'standard';
  if (!PROFILE_HIERARCHY[profile]) {
    return 'standard';
  }
  return profile;
}

/**
 * Check if a hook should run based on its flags and the current profile
 */
function shouldRunHook(hookFlags) {
  const currentProfile = getCurrentProfile();
  const allowedProfiles = PROFILE_HIERARCHY[currentProfile] || ['standard'];

  // Hook flags are comma-separated
  const hookProfiles = hookFlags.split(',').map(f => f.trim());

  // Check if any of the hook's profiles match the current profile
  return hookProfiles.some(profile => allowedProfiles.includes(profile));
}

/**
 * Parse arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error('[run-with-flags] ERROR: Insufficient arguments');
    console.error('Usage: node run-with-flags.js <event> <hook-script> <flags>');
    process.exit(1);
  }

  return {
    event: args[0],
    hookScript: args[1],
    flags: args[2],
  };
}

/**
 * Resolve the hook script path across repo-local Codex mirrors and Claude plugin installs.
 */
function resolveHookScriptPath(hookScript) {
  const normalized = String(hookScript || '').trim();
  if (!normalized) {
    return '';
  }

  if (path.isAbsolute(normalized) && fs.existsSync(normalized)) {
    return normalized;
  }

  const cwdPath = path.resolve(process.cwd(), normalized);
  if (fs.existsSync(cwdPath)) {
    return cwdPath;
  }

  const mirroredRootPath = path.resolve(__dirname, '..', '..', normalized);
  if (fs.existsSync(mirroredRootPath)) {
    return mirroredRootPath;
  }

  const CURRENT_PLUGIN_SLUG = 'cc-harness';
  const LEGACY_PLUGIN_SLUGS = ['ecc', 'everything-claude-code'];
  const KNOWN_PLUGIN_PATHS = [
    [CURRENT_PLUGIN_SLUG],
    [`${CURRENT_PLUGIN_SLUG}@${CURRENT_PLUGIN_SLUG}`],
    ['marketplace', CURRENT_PLUGIN_SLUG],
    ...LEGACY_PLUGIN_SLUGS.flatMap((slug) => [
      [slug],
      [`${slug}@${slug}`],
      ['marketplace', slug],
    ]),
  ];
  const CACHE_PLUGIN_SLUGS = [CURRENT_PLUGIN_SLUG, ...LEGACY_PLUGIN_SLUGS];

  function hasRunnerRoot(candidate) {
    const value = typeof candidate === 'string' ? candidate.trim() : '';
    return value.length > 0 && fs.existsSync(path.join(path.resolve(value), normalized));
  }

  const envRoot = process.env.CLAUDE_PLUGIN_ROOT || '';
  if (hasRunnerRoot(envRoot)) {
    return path.join(path.resolve(envRoot.trim()), normalized);
  }

  const home = require('os').homedir();
  const claudeDir = path.join(home, '.claude');

  if (hasRunnerRoot(claudeDir)) {
    return path.join(claudeDir, normalized);
  }

  const knownPaths = KNOWN_PLUGIN_PATHS.map((segments) =>
    path.join(claudeDir, 'plugins', ...segments)
  );

  for (const candidate of knownPaths) {
    if (hasRunnerRoot(candidate)) {
      return path.join(candidate, normalized);
    }
  }

  // Walk versioned cache
  try {
    for (const slug of CACHE_PLUGIN_SLUGS) {
      const cacheBase = path.join(claudeDir, 'plugins', 'cache', slug);
      for (const org of fs.readdirSync(cacheBase, { withFileTypes: true })) {
        if (!org.isDirectory()) continue;
        for (const version of fs.readdirSync(path.join(cacheBase, org.name), { withFileTypes: true })) {
          if (!version.isDirectory()) continue;
          const candidate = path.join(cacheBase, org.name, version.name);
          if (hasRunnerRoot(candidate)) {
            return path.join(candidate, normalized);
          }
        }
      }
    }
  } catch {
    // cache directory may not exist
  }

  return '';
}

// Main execution
const { event, hookScript, flags } = parseArgs();

// Check if hook should run based on profile
if (!shouldRunHook(flags)) {
  // Read stdin and pass through without running hook
  const raw = fs.readFileSync(0, 'utf8');
  process.stdout.write(raw);
  process.exit(0);
}

// Resolve plugin root and hook script path
const scriptPath = resolveHookScriptPath(hookScript);

if (!scriptPath || !fs.existsSync(scriptPath)) {
  console.error(`[run-with-flags] ERROR: Hook script not found: ${scriptPath}`);
  const raw = fs.readFileSync(0, 'utf8');
  process.stdout.write(raw);
  process.exit(0);
}

// Read stdin
const raw = fs.readFileSync(0, 'utf8');

// Determine the proper Node.js executable
const nodePath = process.execPath;

// Spawn the hook script
const result = spawnSync(
  nodePath,
  [scriptPath],
  {
    input: raw,
    encoding: 'utf8',
    env: process.env,
    cwd: process.cwd(),
    timeout: 30000,
  }
);

// Handle output
const stdout = typeof result.stdout === 'string' ? result.stdout : '';
if (stdout) {
  process.stdout.write(stdout);
} else {
  process.stdout.write(raw);
}

if (result.stderr) {
  process.stderr.write(result.stderr);
}

// Handle errors
if (result.error || result.status === null || result.signal) {
  const reason = result.error
    ? result.error.message
    : result.signal
      ? 'signal ' + result.signal
      : 'missing exit status';
  console.error(`[run-with-flags] ERROR: Hook "${event}" failed: ${reason}`);
  process.exit(1);
}

process.exit(Number.isInteger(result.status) ? result.status : 0);
