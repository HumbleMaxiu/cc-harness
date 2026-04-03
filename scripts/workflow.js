#!/usr/bin/env node

/**
 * Feature Workflow CLI
 * Entry point for /feature-flow command
 */

const { createWorkflowState, saveWorkflowState, loadWorkflowState, getStatusDisplay } = require('./lib/workflow-orchestrator');

const args = process.argv.slice(2);

function showHelp() {
  console.log(`
Feature Development Workflow
===========================

Usage:
  node workflow.js [type] [description]
  node workflow.js                    # Interactive mode

Types:
  feature   - Full feature development (default)
  bugfix    - Bug fix with test-first approach
  hotfix    - Urgent production fix
  refactor  - Code refactoring

Examples:
  node workflow.js feature "Add user authentication"
  node workflow.js bugfix "Fix cart calculation error"
  node workflow.js

State:
  Workflow state is saved to .claude/workflow-state.json
  `);
}

function parseArgs(args) {
  const VALID_TYPES = ['feature', 'bugfix', 'hotfix', 'refactor'];

  let type = 'feature';
  let description = '';

  for (const arg of args) {
    if (VALID_TYPES.includes(arg)) {
      type = arg;
    } else {
      description = arg;
    }
  }

  return { type, description };
}

function generateWorkflowId(type, description) {
  const timestamp = Date.now().toString(36);
  const slug = description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 20);

  return `${type}-${slug}-${timestamp}`;
}

async function interactiveMode() {
  const readline = require('readline');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (q) => new Promise((resolve) => rl.question(q, resolve));

  console.log('\n## Feature Flow - Interactive Mode\n');

  console.log('Select workflow type:');
  console.log('1. [feature]  - New feature development');
  console.log('2. [bugfix]   - Bug fix with test-first approach');
  console.log('3. [hotfix]   - Urgent production fix');
  console.log('4. [refactor] - Code refactoring\n');

  const typeChoice = await question('Enter choice (1-4) [1]: ');
  const typeMap = { '1': 'feature', '2': 'bugfix', '3': 'hotfix', '4': 'refactor', '': 'feature' };
  const type = typeMap[typeChoice] || 'feature';

  console.log('\nDescribe the feature/fix:\n');
  const description = await question('> ');

  rl.close();

  if (!description.trim()) {
    console.error('Error: Description is required');
    process.exit(1);
  }

  return { type, description: description.trim() };
}

async function main() {
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  let { type, description } = parseArgs(args);

  // Check for existing workflow
  const existingState = loadWorkflowState();

  if (existingState && existingState.status === 'in_progress') {
    console.log('\n## Existing Workflow Found\n');
    console.log(getStatusDisplay(existingState));
    console.log('\nUse /feature-flow resume to continue or /feature-flow new to start fresh.\n');
    return;
  }

  // Interactive mode if no description
  if (!description && args.length === 0) {
    try {
      ({ type, description } = await interactiveMode());
    } catch (err) {
      console.error('Interactive mode cancelled');
      process.exit(1);
    }
  }

  if (!description) {
    console.error('Error: Description is required');
    console.error('Usage: node workflow.js [type] [description]');
    process.exit(1);
  }

  // Create new workflow
  const workflowId = generateWorkflowId(type, description);
  const state = createWorkflowState(workflowId, type, description);

  saveWorkflowState(state);

  console.log('\n## Feature Flow Started\n');
  console.log(`Workflow ID: ${workflowId}`);
  console.log(`Type: ${type}`);
  console.log(`Description: ${description}\n`);
  console.log(getStatusDisplay(state));
  console.log('\nNext: Run spec agent to begin requirements analysis.\n');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
