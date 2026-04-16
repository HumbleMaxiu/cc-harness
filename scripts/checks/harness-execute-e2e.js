#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..', '..');
const fixturesRoot = path.join(repoRoot, 'fixtures', 'repos');

function parseArgs(argv) {
  const options = {
    fixture: null,
    outputDir: null,
    keepOutput: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--fixture') {
      options.fixture = argv[index + 1] || null;
      index += 1;
      continue;
    }
    if (token === '--output-dir') {
      options.outputDir = argv[index + 1] || null;
      index += 1;
      continue;
    }
    if (token === '--keep-output') {
      options.keepOutput = true;
      continue;
    }
    throw new Error(`Unknown argument: ${token}`);
  }

  if (!options.fixture) {
    throw new Error('Usage: node scripts/checks/harness-execute-e2e.js --fixture <fixture-id> [--output-dir <dir>] [--keep-output]');
  }

  return options;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content);
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function copyDirContents(sourceDir, targetDir) {
  if (!exists(sourceDir)) {
    return;
  }

  ensureDir(targetDir);
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDirContents(sourcePath, targetPath);
      continue;
    }
    ensureDir(path.dirname(targetPath));
    fs.copyFileSync(sourcePath, targetPath);
  }
}

function createExecutionContext(fixtureDir, outputDir) {
  const logLines = [];
  const eventLog = [];

  function log(message) {
    const line = `[${new Date().toISOString()}] ${message}`;
    logLines.push(line);
    console.log(message);
  }

  function event(stage, status, details = {}) {
    eventLog.push({
      time: new Date().toISOString(),
      stage,
      status,
      ...details,
    });
  }

  const context = {
    repoRoot,
    fixtureDir,
    outputDir,
    readTask() {
      return readText(path.join(fixtureDir, 'task.md'));
    },
    write(relPath, content) {
      writeFile(path.join(outputDir, relPath), content);
    },
    read(relPath) {
      return readText(path.join(outputDir, relPath));
    },
    exists(relPath) {
      return exists(path.join(outputDir, relPath));
    },
    log,
    event,
    finalizeExecutionLog() {
      writeFile(path.join(outputDir, 'artifacts', 'execution-log.md'), `${logLines.join('\n')}\n`);
      writeFile(path.join(outputDir, 'artifacts', 'execution-events.json'), `${JSON.stringify(eventLog, null, 2)}\n`);
    },
  };

  return context;
}

function runGrader(fixtureId, submissionDir) {
  const runner = path.join(repoRoot, 'scripts', 'checks', 'harness-behavior-evals.js');
  return spawnSync(process.execPath, [runner, '--fixture', fixtureId, '--submission', submissionDir], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const fixtureDir = path.join(fixturesRoot, options.fixture);
  const executorPath = path.join(fixtureDir, 'executor.js');

  if (!exists(fixtureDir)) {
    throw new Error(`Fixture not found: ${options.fixture}`);
  }
  if (!exists(executorPath)) {
    throw new Error(`Fixture ${options.fixture} does not define executor.js`);
  }

  const tempRoot = options.outputDir
    ? path.resolve(options.outputDir)
    : fs.mkdtempSync(path.join(os.tmpdir(), `cc-harness-e2e-${options.fixture}-`));
  ensureDir(tempRoot);

  const submissionDir = path.join(tempRoot, 'submission');
  ensureDir(submissionDir);
  copyDirContents(path.join(fixtureDir, 'input'), submissionDir);

  const executor = require(executorPath);
  if (typeof executor.run !== 'function') {
    throw new Error(`${options.fixture}: executor.js must export run(context)`);
  }

  const execution = createExecutionContext(fixtureDir, submissionDir);

  try {
    console.log(`Executing fixture ${options.fixture}`);
    await executor.run(execution);
    execution.finalizeExecutionLog();

    const gradeResult = runGrader(options.fixture, submissionDir);
    const stdout = (gradeResult.stdout || '').trim();
    const stderr = (gradeResult.stderr || '').trim();
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);

    if (gradeResult.status !== 0) {
      console.error(`E2E execution failed validation. Output kept at: ${submissionDir}`);
      process.exit(gradeResult.status || 1);
    }

    console.log(`E2E execution passed. Output at: ${submissionDir}`);
    if (!options.keepOutput && !options.outputDir) {
      console.log('Use --keep-output or --output-dir to preserve artifacts outside temp space.');
    }
  } catch (error) {
    execution.finalizeExecutionLog();
    console.error(error.message || error);
    console.error(`Execution artifacts kept at: ${submissionDir}`);
    process.exit(1);
  }
}

main();
