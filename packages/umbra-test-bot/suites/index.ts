/**
 * Suite Index — Imports and registers all test suites.
 *
 * Each suite file calls registerSuite() on import, populating ALL_SUITES.
 * This file just ensures all suites are loaded.
 */

// Import all suite files (each self-registers via registerSuite())
import './friends.js';
import './messages.js';
import './threads.js';
import './reactions.js';
import './receipts.js';
import './typing.js';
import './groups.js';
import './calls.js';
import './stress.js';
import './resilience.js';

// Re-export suite management from scenarios
export { ALL_SUITES, getSuite, getAllScenarios, getScenariosByTag } from '../scenarios.js';
