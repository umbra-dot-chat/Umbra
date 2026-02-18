/**
 * Scenario Runner — Framework for automated test scenarios.
 *
 * Provides the ScenarioRunner class, types, helpers, and suite management.
 * Actual scenarios live in testing/suites/*.ts.
 */

import { TestBot } from './test-bot.js';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ScenarioStep {
  name: string;
  action: (ctx: ScenarioContext) => Promise<void>;
  /** Poll until true or timeout. If omitted, step passes after action completes. */
  validate?: (ctx: ScenarioContext) => boolean;
  /** Per-step timeout in ms (default 10000) */
  timeout?: number;
}

export interface Scenario {
  name: string;
  description: string;
  botCount: number;
  steps: ScenarioStep[];
  /** Overall scenario timeout in ms */
  timeout: number;
  /** Tags for filtering (e.g., ['smoke', 'critical', 'slow']) */
  tags?: string[];
}

export interface ScenarioContext {
  bots: TestBot[];
  state: Map<string, any>;
}

export interface StepResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

export interface ScenarioResult {
  name: string;
  passed: boolean;
  steps: StepResult[];
  duration: number;
  error?: string;
  /** Number of attempts (with retry) */
  attempts?: number;
}

export interface ScenarioSuite {
  name: string;
  description: string;
  scenarios: Scenario[];
}

export interface RunnerOptions {
  /** Continue running even if a scenario fails */
  continueOnError: boolean;
  /** Output verbosity */
  verbosity: 'quiet' | 'normal' | 'verbose';
  /** Output format */
  outputFormat: 'console' | 'json';
  /** Number of retries for failed scenarios */
  retryCount: number;
}

const DEFAULT_RUNNER_OPTIONS: RunnerOptions = {
  continueOnError: false,
  verbosity: 'normal',
  outputFormat: 'console',
  retryCount: 0,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Poll a condition every 200ms until it returns true or timeout.
 */
export async function pollUntil(fn: () => boolean, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (fn()) return true;
    await sleep(200);
  }
  return fn(); // Final check
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite Management
// ─────────────────────────────────────────────────────────────────────────────

/** All registered suites. Populated by suites/index.ts */
export const ALL_SUITES: Map<string, ScenarioSuite> = new Map();

/** Register a suite. Called from suite files. */
export function registerSuite(suite: ScenarioSuite): void {
  ALL_SUITES.set(suite.name, suite);
}

/** Get scenarios for a specific suite. */
export function getSuite(name: string): Scenario[] | null {
  return ALL_SUITES.get(name)?.scenarios ?? null;
}

/** Get all scenarios across all suites. */
export function getAllScenarios(): Scenario[] {
  const all: Scenario[] = [];
  for (const suite of ALL_SUITES.values()) {
    all.push(...suite.scenarios);
  }
  return all;
}

/** Get scenarios matching a tag. */
export function getScenariosByTag(tag: string): Scenario[] {
  const all = getAllScenarios();
  return all.filter((s) => s.tags?.includes(tag));
}

// ─────────────────────────────────────────────────────────────────────────────
// ScenarioRunner
// ─────────────────────────────────────────────────────────────────────────────

export class ScenarioRunner {
  private relayUrl: string;
  private options: RunnerOptions;

  constructor(relayUrl?: string, options?: Partial<RunnerOptions>) {
    this.relayUrl = relayUrl ?? 'wss://relay.umbra.chat/ws';
    this.options = { ...DEFAULT_RUNNER_OPTIONS, ...options };
  }

  /**
   * Run a single scenario (with retry support).
   */
  async run(scenario: Scenario): Promise<ScenarioResult> {
    for (let attempt = 0; attempt <= this.options.retryCount; attempt++) {
      const result = await this.runOnce(scenario);
      result.attempts = attempt + 1;

      if (result.passed || attempt === this.options.retryCount) {
        return result;
      }

      if (this.options.verbosity !== 'quiet') {
        console.log(`  \x1b[33mRetrying\x1b[0m (attempt ${attempt + 2}/${this.options.retryCount + 1})...\n`);
      }
    }

    // Unreachable, but TypeScript needs it
    return { name: scenario.name, passed: false, steps: [], duration: 0, error: 'No attempts made' };
  }

  /**
   * Run a single scenario once (no retry).
   */
  private async runOnce(scenario: Scenario): Promise<ScenarioResult> {
    const startTime = Date.now();
    const stepResults: StepResult[] = [];
    let passed = true;
    let overallError: string | undefined;

    if (this.options.verbosity !== 'quiet') {
      console.log(`\n\x1b[1mRunning scenario: ${scenario.name}\x1b[0m`);
      console.log(`\x1b[90m  ${scenario.description}\x1b[0m\n`);
    }

    // Create bots
    const names = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot',
                    'Golf', 'Hotel', 'India', 'Juliet', 'Kilo', 'Lima',
                    'Mike', 'November', 'Oscar', 'Papa', 'Quebec', 'Romeo',
                    'Sierra', 'Tango'];
    const bots: TestBot[] = [];

    try {
      for (let i = 0; i < scenario.botCount; i++) {
        const bot = new TestBot({
          name: names[i] || `Bot-${i + 1}`,
          relayUrl: this.relayUrl,
          autoAcceptFriends: true,
          autoAcceptCalls: true,
          autoAcceptGroupInvites: true,
          echoMessages: false,
          logLevel: this.options.verbosity === 'verbose' ? 'debug' : 'warn',
        });
        bots.push(bot);
      }

      // Start all bots
      for (const bot of bots) {
        await bot.start();
      }

      const ctx: ScenarioContext = {
        bots,
        state: new Map(),
      };

      // Overall timeout
      const overallDeadline = Date.now() + scenario.timeout;

      // Execute steps
      for (const step of scenario.steps) {
        if (Date.now() >= overallDeadline) {
          stepResults.push({ name: step.name, passed: false, duration: 0, error: 'Overall timeout exceeded' });
          passed = false;
          break;
        }

        const stepStart = Date.now();
        const stepTimeout = step.timeout ?? 10000;

        try {
          // Execute action
          await step.action(ctx);

          // Validate if provided
          if (step.validate) {
            const valid = await pollUntil(() => step.validate!(ctx), stepTimeout);
            if (!valid) {
              throw new Error('Validation timed out');
            }
          }

          const duration = Date.now() - stepStart;
          stepResults.push({ name: step.name, passed: true, duration });
          if (this.options.verbosity !== 'quiet') {
            console.log(`  \x1b[32m✓\x1b[0m ${step.name} \x1b[90m(${(duration / 1000).toFixed(1)}s)\x1b[0m`);
          }
        } catch (err) {
          const duration = Date.now() - stepStart;
          const errMsg = err instanceof Error ? err.message : String(err);
          stepResults.push({ name: step.name, passed: false, duration, error: errMsg });
          if (this.options.verbosity !== 'quiet') {
            console.log(`  \x1b[31m✗\x1b[0m ${step.name} \x1b[90m(${(duration / 1000).toFixed(1)}s)\x1b[0m — ${errMsg}`);
          }
          passed = false;
          break; // Stop on first failure within a scenario
        }
      }
    } catch (err) {
      passed = false;
      overallError = err instanceof Error ? err.message : String(err);
      if (this.options.verbosity !== 'quiet') {
        console.log(`  \x1b[31m✗\x1b[0m Setup failed: ${overallError}`);
      }
    } finally {
      // Cleanup: stop all bots
      for (const bot of bots) {
        try { bot.stop(); } catch { /* ignore */ }
      }
    }

    const duration = Date.now() - startTime;
    if (this.options.verbosity !== 'quiet') {
      const icon = passed ? '\x1b[32mPASSED\x1b[0m' : '\x1b[31mFAILED\x1b[0m';
      console.log(`\n  ${icon} in ${(duration / 1000).toFixed(1)}s\n`);
    }

    return { name: scenario.name, passed, steps: stepResults, duration, error: overallError };
  }

  /**
   * Run a named suite.
   */
  async runSuite(suiteName: string): Promise<ScenarioResult[]> {
    const suite = getSuite(suiteName);
    if (!suite) throw new Error(`Unknown suite: ${suiteName}`);
    return this.runAll(suite);
  }

  /**
   * Run all given scenarios sequentially.
   */
  async runAll(scenarios: Scenario[]): Promise<ScenarioResult[]> {
    const results: ScenarioResult[] = [];
    for (const scenario of scenarios) {
      const result = await this.run(scenario);
      results.push(result);
      if (!result.passed && !this.options.continueOnError) {
        break;
      }
    }
    return results;
  }

  /**
   * Generate a report from results.
   */
  generateReport(results: ScenarioResult[]): object | string {
    const passed = results.filter((r) => r.passed).length;
    const failed = results.length - passed;

    if (this.options.outputFormat === 'json') {
      return {
        summary: { total: results.length, passed, failed },
        timestamp: new Date().toISOString(),
        relayUrl: this.relayUrl,
        results: results.map((r) => ({
          name: r.name,
          passed: r.passed,
          duration: r.duration,
          attempts: r.attempts ?? 1,
          steps: r.steps,
          error: r.error,
        })),
      };
    }

    // Console summary
    const lines: string[] = [];
    lines.push('\n\x1b[1m═══════════════════════════════════════════════════\x1b[0m');
    lines.push(`\x1b[1m  Test Suite Summary\x1b[0m`);
    lines.push('\x1b[1m═══════════════════════════════════════════════════\x1b[0m\n');

    for (const r of results) {
      const icon = r.passed ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
      const retryInfo = (r.attempts ?? 1) > 1 ? ` (${r.attempts} attempts)` : '';
      lines.push(`  ${icon} ${r.name} \x1b[90m(${(r.duration / 1000).toFixed(1)}s)${retryInfo}\x1b[0m`);
      if (!r.passed && r.error) {
        lines.push(`    \x1b[31m${r.error}\x1b[0m`);
      }
    }

    lines.push('');
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const statusColor = failed === 0 ? '\x1b[32m' : '\x1b[31m';
    lines.push(`  ${statusColor}${passed} passed\x1b[0m, ${failed > 0 ? `\x1b[31m${failed} failed\x1b[0m` : `${failed} failed`} \x1b[90m(${(totalDuration / 1000).toFixed(1)}s total)\x1b[0m\n`);

    return lines.join('\n');
  }
}
