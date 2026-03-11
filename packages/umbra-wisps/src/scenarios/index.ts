/**
 * Scenario framework for orchestrating wisp behavior sequences.
 *
 * Scenarios are named sequences of steps that exercise different
 * wisp capabilities (DMs, groups, calls, friend requests).
 */

import type { WispOrchestrator } from '../orchestrator.js';
import type { Wisp } from '../wisp.js';

export interface ScenarioStep {
  name: string;
  action: (ctx: ScenarioContext) => Promise<void>;
}

export interface WispScenario {
  name: string;
  description: string;
  steps: ScenarioStep[];
}

export interface ScenarioContext {
  orchestrator: WispOrchestrator;
  wisps: Wisp[];
  state: Map<string, unknown>;
}

export async function runScenario(
  scenario: WispScenario,
  orchestrator: WispOrchestrator,
): Promise<{ success: boolean; error?: string }> {
  const ctx: ScenarioContext = {
    orchestrator,
    wisps: orchestrator.getWisps(),
    state: new Map(),
  };
  console.log(`[Scenario] Running: ${scenario.name}`);
  for (const step of scenario.steps) {
    console.log(`[Scenario]   Step: ${step.name}`);
    try {
      await step.action(ctx);
    } catch (err) {
      console.error(`[Scenario]   FAILED: ${step.name}`, err);
      return { success: false, error: String(err) };
    }
  }
  console.log(`[Scenario] Completed: ${scenario.name}`);
  return { success: true };
}

// -- Scenario Registry --

const scenarios: Map<string, WispScenario> = new Map();

export function registerScenario(s: WispScenario): void {
  scenarios.set(s.name, s);
}

export function getScenario(name: string): WispScenario | undefined {
  return scenarios.get(name);
}

export function listScenarios(): string[] {
  return Array.from(scenarios.keys());
}
