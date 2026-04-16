#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const fixturesRoot = path.join(repoRoot, 'fixtures', 'repos');

function toPosix(relPath) {
  return relPath.split(path.sep).join('/');
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function parseArgs(argv) {
  const options = {
    fixture: null,
    sample: null,
    submission: null,
    list: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--fixture') {
      options.fixture = argv[index + 1] || null;
      index += 1;
      continue;
    }

    if (token === '--sample') {
      options.sample = argv[index + 1] || null;
      index += 1;
      continue;
    }

    if (token === '--submission') {
      options.submission = argv[index + 1] || null;
      index += 1;
      continue;
    }

    if (token === '--list') {
      options.list = true;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  if (options.submission && !options.fixture) {
    throw new Error('--submission requires --fixture <fixture-id>');
  }

  return options;
}

function listFixtureDirs() {
  if (!exists(fixturesRoot)) {
    return [];
  }

  return fs.readdirSync(fixturesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(fixturesRoot, entry.name))
    .sort();
}

function loadFixture(fixtureDir) {
  const scenarioPath = path.join(fixtureDir, 'scenario.json');
  const graderPath = path.join(fixtureDir, 'grader.js');
  const inputDir = path.join(fixtureDir, 'input');
  const taskPath = path.join(fixtureDir, 'task.md');

  if (!exists(scenarioPath) || !exists(graderPath)) {
    return null;
  }

  return {
    dir: fixtureDir,
    id: path.basename(fixtureDir),
    scenario: readJson(scenarioPath),
    graderPath,
    grader: require(graderPath),
    inputDir,
    taskPath,
  };
}

function discoverFixtures() {
  return listFixtureDirs()
    .map(loadFixture)
    .filter(Boolean);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
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

function makeHelpers(baseDir) {
  return {
    path(relPath) {
      return path.join(baseDir, relPath);
    },
    exists(relPath) {
      return exists(path.join(baseDir, relPath));
    },
    read(relPath) {
      return readText(path.join(baseDir, relPath));
    },
    readJson(relPath) {
      return readJson(path.join(baseDir, relPath));
    },
    listFiles() {
      if (!exists(baseDir)) {
        return [];
      }

      const files = [];
      const queue = [''];

      while (queue.length > 0) {
        const relDir = queue.pop();
        const absDir = path.join(baseDir, relDir);

        for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
          const relPath = relDir ? path.join(relDir, entry.name) : entry.name;
          if (entry.isDirectory()) {
            queue.push(relPath);
            continue;
          }
          files.push(toPosix(relPath));
        }
      }

      return files.sort();
    },
  };
}

function createContext(fixture, submissionDir) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), `cc-harness-eval-${fixture.id}-`));
  const initialSnapshotDir = path.join(tempRoot, 'initial');
  const submissionSnapshotDir = path.join(tempRoot, 'submission');

  copyDirContents(fixture.inputDir, initialSnapshotDir);
  copyDirContents(submissionDir, submissionSnapshotDir);

  const task = exists(fixture.taskPath) ? readText(fixture.taskPath) : '';
  const assertions = [];

  const helperSet = {
    fixtureId: fixture.id,
    scenario: fixture.scenario,
    task,
    fixtureDir: fixture.dir,
    initial: makeHelpers(initialSnapshotDir),
    submission: makeHelpers(submissionSnapshotDir),
    assert(condition, message) {
      if (!condition) {
        assertions.push(message);
      }
    },
    assertIncludes(content, snippet, label) {
      if (!content.includes(snippet)) {
        assertions.push(`${label}: missing "${snippet}"`);
      }
    },
  };

  return {
    tempRoot,
    initialSnapshotDir,
    submissionSnapshotDir,
    helperSet,
    assertions,
  };
}

async function gradeSubmission(fixture, submissionDir, sampleMeta) {
  if (!fixture.grader || typeof fixture.grader.grade !== 'function') {
    throw new Error(`${fixture.id}: grader.js must export grade(context)`);
  }

  if (!exists(submissionDir)) {
    throw new Error(`${fixture.id}: submission directory missing at ${submissionDir}`);
  }

  const context = createContext(fixture, submissionDir);

  try {
    const result = await fixture.grader.grade(context.helperSet);
    const passed = context.assertions.length === 0 && result && result.passed !== false;

    return {
      passed,
      summary: result && result.summary ? result.summary : '',
      findings: [
        ...(context.assertions || []),
        ...((result && Array.isArray(result.findings)) ? result.findings : []),
      ],
      sampleMeta,
    };
  } finally {
    fs.rmSync(context.tempRoot, { recursive: true, force: true });
  }
}

function loadSamples(fixture) {
  const samplesDir = path.join(fixture.dir, 'samples');
  if (!exists(samplesDir)) {
    return [];
  }

  return fs.readdirSync(samplesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const sampleDir = path.join(samplesDir, entry.name);
      const sampleJsonPath = path.join(sampleDir, 'sample.json');
      const submissionDir = path.join(sampleDir, 'submission');

      if (!exists(sampleJsonPath) || !exists(submissionDir)) {
        throw new Error(`${fixture.id}: sample ${entry.name} requires sample.json and submission/`);
      }

      return {
        id: entry.name,
        dir: sampleDir,
        meta: readJson(sampleJsonPath),
        submissionDir,
      };
    })
    .sort((left, right) => left.id.localeCompare(right.id));
}

async function runFixtureSamples(fixture, onlySampleId) {
  const samples = loadSamples(fixture).filter((sample) => !onlySampleId || sample.id === onlySampleId);

  if (samples.length === 0) {
    throw new Error(`${fixture.id}: no matching samples found`);
  }

  const failures = [];

  for (const sample of samples) {
    const expectedPass = sample.meta.expected === 'pass';
    const result = await gradeSubmission(fixture, sample.submissionDir, sample.meta);
    const summary = result.summary || sample.meta.description || fixture.scenario.title;

    if (result.passed !== expectedPass) {
      failures.push(`${fixture.id}/${sample.id}: expected ${sample.meta.expected}, got ${result.passed ? 'pass' : 'fail'} (${summary})`);
      for (const finding of result.findings) {
        failures.push(`  ${finding}`);
      }
      continue;
    }

    if (expectedPass) {
      console.log(`PASS ${fixture.id}/${sample.id}: ${summary}`);
    } else {
      console.log(`PASS ${fixture.id}/${sample.id}: expected failure matched`);
    }

    if (!result.passed && result.findings.length > 0) {
      console.log(`  findings: ${result.findings.join(' | ')}`);
    }
  }

  return failures;
}

async function runExternalSubmission(fixture, submissionDir) {
  const result = await gradeSubmission(fixture, submissionDir, null);

  if (!result.passed) {
    console.error(`Behavior eval failed for fixture ${fixture.id}.`);
    for (const finding of result.findings) {
      console.error(`- ${finding}`);
    }
    process.exit(1);
  }

  console.log(`Behavior eval passed for fixture ${fixture.id}.`);
  if (result.summary) {
    console.log(result.summary);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const fixtures = discoverFixtures();

  if (options.list) {
    fixtures.forEach((fixture) => console.log(fixture.id));
    return;
  }

  const selectedFixtures = options.fixture
    ? fixtures.filter((fixture) => fixture.id === options.fixture)
    : fixtures;

  if (selectedFixtures.length === 0) {
    throw new Error(options.fixture
      ? `No behavior eval fixture found for ${options.fixture}`
      : 'No behavior eval fixtures found');
  }

  if (options.submission) {
    if (selectedFixtures.length !== 1) {
      throw new Error('External submission mode requires exactly one fixture');
    }
    await runExternalSubmission(selectedFixtures[0], path.resolve(options.submission));
    return;
  }

  const failures = [];
  for (const fixture of selectedFixtures) {
    const fixtureFailures = await runFixtureSamples(fixture, options.sample);
    failures.push(...fixtureFailures);
  }

  if (failures.length > 0) {
    console.error('Harness behavior evals failed:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log('Harness behavior evals passed.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
