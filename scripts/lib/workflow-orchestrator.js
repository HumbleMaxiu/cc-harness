/**
 * Workflow Orchestrator
 * Manages the feature development pipeline state and agent handoffs
 */

const fs = require('fs');
const path = require('path');

const WORKFLOW_STATE_DIR = '.claude';
const WORKFLOW_STATE_FILE = 'workflow-state.json';

// Feedback loop tracking
const FEEDBACK_LOOPS = {
  review: {
    name: 'Review Loop',
    from: 'code-reviewer',
    to: 'fix-agent',
    reason: 'issues_found'
  },
  test: {
    name: 'Test Feedback',
    from: 'test-agent',
    to: 'fix-agent',
    reason: 'tests_failed'
  },
  lint: {
    name: 'Lint Feedback',
    from: 'lint-agent',
    to: 'fix-agent',
    reason: 'lint_errors'
  }
};

// Phase definitions
const PHASES = {
  spec: { name: 'SPEC', next: 'planner', required: true },
  planner: { name: 'PLANNER', next: 'tdd', required: true },
  tdd: { name: 'TDD', next: 'develop', required: true },
  develop: { name: 'DEVELOP', next: 'review', required: true },
  review: { name: 'REVIEW', next: 'test', required: true, feedbackLoop: 'review' },
  test: { name: 'TEST', next: 'lint', required: true, feedbackLoop: 'test' },
  lint: { name: 'LINT', next: 'pr', required: true, feedbackLoop: 'lint' },
  pr: { name: 'PR', next: null, required: false }
};

const WORKFLOW_TYPES = {
  feature: ['spec', 'planner', 'tdd', 'develop', 'review', 'test', 'lint', 'pr'],
  'feature-notlint': ['spec', 'planner', 'tdd', 'develop', 'review', 'test', 'pr'],
  'feature-notest': ['spec', 'planner', 'develop', 'review', 'lint', 'pr'],
  minimal: ['spec', 'planner', 'develop', 'review', 'pr'],
  bugfix: ['spec', 'tdd', 'develop', 'review', 'test', 'lint', 'pr'],
  'bugfix-notlint': ['spec', 'tdd', 'develop', 'review', 'test', 'pr'],
  'bugfix-notest': ['spec', 'develop', 'review', 'lint', 'pr'],
  hotfix: ['spec', 'develop', 'review', 'test', 'lint', 'pr'],
  refactor: ['planner', 'develop', 'review', 'test', 'lint', 'pr']
};

/**
 * Tool detection results
 */
const TOOL_STATUS = {
  TEST_AVAILABLE: 'test',
  TEST_UNAVAILABLE: 'test',
  COVERAGE_AVAILABLE: 'coverage',
  COVERAGE_UNAVAILABLE: 'coverage',
  LINT_AVAILABLE: 'lint',
  LINT_UNAVAILABLE: 'lint',
  ESLINT_AVAILABLE: 'eslint',
  ESLINT_UNAVAILABLE: 'eslint',
  TYPESCRIPT_AVAILABLE: 'typescript',
  TYPESCRIPT_UNAVAILABLE: 'typescript'
};

/**
 * Detect available tools in the project
 * @returns {Object} - Tool availability status
 */
function detectTools() {
  // This would typically run actual commands to check
  // For now, return structure that can be populated by workflow
  return {
    test: false,
    coverage: false,
    lint: false,
    eslint: false,
    typescript: false,
    checked: false
  };
}

/**
 * Determine workflow type based on tool availability
 * @param {Object} tools - Tool detection results
 * @returns {string} - Recommended workflow type
 */
function determineWorkflowType(tools) {
  if (!tools.checked) {
    return 'feature'; // Default to full flow if not checked
  }

  if (tools.test && tools.lint) {
    return 'feature';
  } else if (tools.test && !tools.lint) {
    return 'feature-notlint';
  } else if (!tools.test && tools.lint) {
    return 'feature-notest';
  } else {
    return 'minimal';
  }
}

/**
 * Create initial workflow state
 */
function createWorkflowState(workflowId, type, description) {
  const phases = WORKFLOW_TYPES[type] || WORKFLOW_TYPES.feature;

  const state = {
    workflowId,
    type,
    description,
    status: 'in_progress',
    currentPhase: phases[0],
    completedPhases: [],
    phases,
    artifacts: {
      spec: null,
      plan: null,
      tests: [],
      changes: []
    },
    iterationCount: {
      reviewLoop: 0,
      fixLoop: 0
    },
    feedbackLoopHistory: [],  // Track all feedback loop triggers
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return state;
}

/**
 * Save workflow state to disk
 */
function saveWorkflowState(state) {
  const stateDir = path.join(process.cwd(), WORKFLOW_STATE_DIR);

  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true });
  }

  state.updatedAt = new Date().toISOString();

  const statePath = path.join(stateDir, WORKFLOW_STATE_FILE);
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');

  return state;
}

/**
 * Load workflow state from disk
 */
function loadWorkflowState() {
  const statePath = path.join(process.cwd(), WORKFLOW_STATE_DIR, WORKFLOW_STATE_FILE);

  if (!fs.existsSync(statePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(statePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error('[WorkflowOrchestrator] Error loading state:', err.message);
    return null;
  }
}

/**
 * Advance to next phase
 */
function advancePhase(state, completedPhase) {
  const phaseIndex = state.phases.indexOf(completedPhase);

  if (phaseIndex === -1) {
    throw new Error(`Phase ${completedPhase} not found in workflow`);
  }

  if (!state.completedPhases.includes(completedPhase)) {
    state.completedPhases.push(completedPhase);
  }

  const nextPhaseIndex = phaseIndex + 1;

  if (nextPhaseIndex >= state.phases.length) {
    state.status = 'completed';
    state.currentPhase = null;
  } else {
    state.currentPhase = state.phases[nextPhaseIndex];
  }

  return state;
}

/**
 * Record an artifact from a phase
 */
function addArtifact(state, phase, artifactType, artifactPath) {
  if (!state.artifacts[artifactType]) {
    state.artifacts[artifactType] = artifactPath;
  } else if (Array.isArray(state.artifacts[artifactType])) {
    state.artifacts[artifactType].push(artifactPath);
  } else {
    state.artifacts[artifactType] = [state.artifacts[artifactType], artifactPath];
  }

  return state;
}

/**
 * Get progress percentage
 */
function getProgress(state) {
  const completed = state.completedPhases.length;
  const total = state.phases.length;

  return Math.round((completed / total) * 100);
}

/**
 * Generate status display
 */
function getStatusDisplay(state) {
  const progress = getProgress(state);
  const progressBar = generateProgressBar(progress);

  let display = `┌─────────────────────────────────────────────────────────────┐\n`;
  display += `│ Feature Flow: ${state.description.padEnd(45)} │\n`;
  display += `├─────────────────────────────────────────────────────────────┤\n`;
  display += `│ Phase: ${state.currentPhase.toUpperCase().padEnd(58)} │\n`;
  display += `│ Progress: ${progressBar} ${String(progress).padStart(3)}%                       │\n`;
  display += `│                                                             │\n`;

  for (const phase of state.phases) {
    const isCompleted = state.completedPhases.includes(phase);
    const isCurrent = state.currentPhase === phase;

    const status = isCompleted ? '✓' : (isCurrent ? '●' : '○');
    const statusText = isCompleted ? 'COMPLETE' : (isCurrent ? 'IN PROGRESS' : 'PENDING');
    const phaseName = PHASES[phase]?.name || phase.toUpperCase();

    display += `│ ${status} ${phaseName.padEnd(10)} [ ${statusText.padEnd(10)} ]                       │\n`;
  }

  display += `└─────────────────────────────────────────────────────────────┘\n`;

  return display;
}

/**
 * Generate ASCII progress bar
 */
function generateProgressBar(percent) {
  const filled = Math.round(percent / 5);
  const empty = 20 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Check if workflow is blocked
 */
function isWorkflowBlocked(state) {
  return state.status === 'blocked';
}

/**
 * Block workflow with reason
 */
function blockWorkflow(state, reason) {
  state.status = 'blocked';
  state.blockedReason = reason;
  return state;
}

/**
 * Record a feedback loop trigger
 * @param {Object} state - Workflow state
 * @param {string} loopType - Type of feedback loop (review/test/lint)
 * @param {Object} details - Details about the trigger
 * @returns {Object} - Notification message
 */
function recordFeedbackLoop(state, loopType, details = {}) {
  const loop = FEEDBACK_LOOPS[loopType];
  if (!loop) {
    throw new Error(`Unknown feedback loop type: ${loopType}`);
  }

  const entry = {
    type: loopType,
    name: loop.name,
    timestamp: new Date().toISOString(),
    fromPhase: details.fromPhase || state.currentPhase,
    reason: details.reason || loop.reason,
    iteration: state.iterationCount[`${loopType}Loop`] || 0,
    issuesFound: details.issuesFound || [],
    summary: details.summary || ''
  };

  state.feedbackLoopHistory.push(entry);
  state.iterationCount[`${loopType}Loop`] = (state.iterationCount[`${loopType}Loop`] || 0) + 1;

  // Generate notification
  return generateFeedbackLoopNotification(entry, true);
}

/**
 * Record that a feedback loop was bypassed (phase passed without issues)
 * @param {Object} state - Workflow state
 * @param {string} phase - The phase that was passed
 * @returns {Object} - Notification message
 */
function recordFeedbackLoopBypass(state, phase) {
  const loopType = PHASES[phase]?.feedbackLoop;
  if (!loopType) {
    return null;
  }

  const loop = FEEDBACK_LOOPS[loopType];
  const entry = {
    type: loopType,
    name: loop.name,
    timestamp: new Date().toISOString(),
    phase: phase,
    bypassed: true,
    summary: `${loop.name} passed - no issues detected`
  };

  state.feedbackLoopHistory.push(entry);

  return generateFeedbackLoopNotification(entry, false);
}

/**
 * Generate feedback loop notification message
 * @param {Object} entry - Feedback loop entry
 * @param {boolean} triggered - Whether the loop was triggered
 * @returns {Object} - Notification with message and type
 */
function generateFeedbackLoopNotification(entry, triggered) {
  const timestamp = new Date(entry.timestamp).toLocaleTimeString();

  if (triggered) {
    return {
      type: 'feedback_loop_triggered',
      severity: entry.type === 'review' ? 'HIGH' : 'MEDIUM',
      message: `[${timestamp}] ${entry.name} triggered! Returning to fix-agent.`,
      details: {
        reason: entry.reason,
        iteration: entry.iteration,
        issuesFound: entry.issuesFound,
        summary: entry.summary
      },
      icon: '🔄',
      entry
    };
  } else {
    return {
      type: 'feedback_loop_bypassed',
      severity: 'LOW',
      message: `[${timestamp}] ${entry.name} passed smoothly - no feedback loop needed.`,
      details: {
        phase: entry.phase,
        summary: entry.summary
      },
      icon: '✓',
      entry
    };
  }
}

/**
 * Get feedback loop summary for display
 * @param {Object} state - Workflow state
 * @returns {string} - Formatted feedback loop summary
 */
function getFeedbackLoopSummary(state) {
  const history = state.feedbackLoopHistory || [];
  if (history.length === 0) {
    return '';
  }

  let summary = '\n## Feedback Loop History\n\n';

  // Group by type
  const byType = {};
  for (const entry of history) {
    if (!byType[entry.type]) {
      byType[entry.type] = [];
    }
    byType[entry.type].push(entry);
  }

  for (const [type, entries] of Object.entries(byType)) {
    const loop = FEEDBACK_LOOPS[type];
    const triggered = entries.filter(e => !e.bypassed).length;
    const bypassed = entries.filter(e => e.bypassed).length;

    summary += `### ${loop.name}\n`;
    summary += `- Triggered: ${triggered} times\n`;
    summary += `- Bypassed: ${bypassed} times\n`;

    if (triggered > 0) {
      summary += `- Latest trigger: ${entries.filter(e => !e.bypassed).pop()?.summary || 'N/A'}\n`;
    }
    summary += '\n';
  }

  return summary;
}

/**
 * Check if max iterations reached for a feedback loop
 * @param {Object} state - Workflow state
 * @param {string} loopType - Type of feedback loop
 * @param {number} maxIterations - Maximum allowed iterations (default 3)
 * @returns {boolean} - True if max reached
 */
function isMaxIterationsReached(state, loopType, maxIterations = 3) {
  const count = state.iterationCount[`${loopType}Loop`] || 0;
  return count >= maxIterations;
}

/**
 * Generate status display with feedback loop indicators
 * @param {Object} state - Workflow state
 * @returns {string} - Formatted status display
 */
function getStatusDisplayWithFeedback(state) {
  const baseDisplay = getStatusDisplay(state);
  const feedbackSummary = getFeedbackLoopSummary(state);

  // Add feedback loop indicators to display
  const reviewCount = state.iterationCount.reviewLoop || 0;
  const fixCount = state.iterationCount.fixLoop || 0;

  const feedbackIndicator = `\n│ Feedback Loops: review=${reviewCount}, fix=${fixCount}                   │\n`;

  // Inject feedback indicator before the closing box
  const lines = baseDisplay.split('\n');
  const insertIndex = lines.length - 1; // Before last empty line

  return lines.slice(0, insertIndex).join('\n') + feedbackIndicator + '\n' + lines.slice(insertIndex).join('\n') + feedbackSummary;
}

module.exports = {
  PHASES,
  WORKFLOW_TYPES,
  FEEDBACK_LOOPS,
  TOOL_STATUS,
  createWorkflowState,
  saveWorkflowState,
  loadWorkflowState,
  advancePhase,
  addArtifact,
  getProgress,
  getStatusDisplay,
  getStatusDisplayWithFeedback,
  isWorkflowBlocked,
  blockWorkflow,
  recordFeedbackLoop,
  recordFeedbackLoopBypass,
  generateFeedbackLoopNotification,
  getFeedbackLoopSummary,
  isMaxIterationsReached,
  detectTools,
  determineWorkflowType
};
