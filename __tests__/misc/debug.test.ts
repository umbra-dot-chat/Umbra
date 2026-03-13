/**
 * Tests for the Umbra Debug Logging Infrastructure
 *
 * Covers: log level filtering, category enable/disable,
 * render tracking, trace buffer, source filtering, performance budgets,
 * Web Vitals types, React Profiler callback, Chrome trace export.
 *
 * @jest-environment jsdom
 */

// Mock PerformanceObserver (not available in jsdom)
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();
(globalThis as any).PerformanceObserver = class MockPerformanceObserver {
  constructor(_callback: any) {}
  observe = mockObserve;
  disconnect = mockDisconnect;
};

// Mock performance.memory (Chrome-only API)
Object.defineProperty(performance, 'memory', {
  value: { usedJSHeapSize: 50 * 1024 * 1024, totalJSHeapSize: 100 * 1024 * 1024, jsHeapSizeLimit: 4096 * 1024 * 1024 },
  configurable: true,
});

// Import the debug module (singleton — we share it across tests)
import { dbg } from '../../src/utils/debug';

// Suppress console output during tests
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'debug').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'table').mockImplementation(() => {});

  // Reset logger state for clean tests
  dbg.clearBuffer();
  dbg.enableAll();
  dbg.setLevel('trace');
  dbg.clearFilter();
  dbg.resetRenderCounts();
  dbg.resetStats();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ─── Ring Buffer Tests ────────────────────────────────────────────────────────

describe('Ring Buffer', () => {
  it('stores and retrieves entries', () => {
    dbg.info('service', 'test message 1');
    dbg.info('service', 'test message 2');
    dbg.info('service', 'test message 3');

    const entries = dbg.entries();
    const msgs = entries.map((e: any) => e.msg);
    expect(msgs).toContain('test message 1');
    expect(msgs).toContain('test message 2');
    expect(msgs).toContain('test message 3');
  });

  it('clears the buffer', () => {
    dbg.info('service', 'before clear');
    expect(dbg.entries().length).toBeGreaterThan(0);

    dbg.clearBuffer();
    expect(dbg.entries().length).toBe(0);
  });

  it('entries have correct structure', () => {
    dbg.info('messages', 'structured entry', { key: 'value' }, 'TestSrc');

    const entry = dbg.entries().find((e: any) => e.msg === 'structured entry');
    expect(entry).toBeDefined();
    expect(entry!.level).toBe('info');
    expect(entry!.cat).toBe('messages');
    expect(entry!.src).toBe('TestSrc');
    expect(entry!.data).toContain('value');
    expect(typeof entry!.t).toBe('number');
    expect(typeof entry!.ts).toBe('number');
  });
});

// ─── Log Level Filtering ─────────────────────────────────────────────────────

describe('Log Level Filtering', () => {
  it('setLevel(warn) suppresses trace/debug/info from console', () => {
    dbg.setLevel('warn');

    dbg.trace('service', 'trace msg');
    dbg.debug('service', 'debug msg');
    dbg.info('service', 'info msg');

    const debugCalls = (console.debug as jest.Mock).mock.calls;
    const infoCalls = (console.info as jest.Mock).mock.calls;

    const hasTraceMsg = debugCalls.some((args: any[]) => args.some(a => typeof a === 'string' && a.includes('trace msg')));
    const hasDebugMsg = debugCalls.some((args: any[]) => args.some(a => typeof a === 'string' && a.includes('debug msg')));
    const hasInfoMsg = infoCalls.some((args: any[]) => args.some(a => typeof a === 'string' && a.includes('info msg')));

    expect(hasTraceMsg).toBe(false);
    expect(hasDebugMsg).toBe(false);
    expect(hasInfoMsg).toBe(false);
  });

  it('setLevel(warn) allows warn/error/fatal into ring buffer', () => {
    dbg.setLevel('warn');

    dbg.warn('service', 'warn msg');
    dbg.error('service', 'error msg');

    const entries = dbg.entries();
    expect(entries.some((e: any) => e.msg === 'warn msg')).toBe(true);
    expect(entries.some((e: any) => e.msg === 'error msg')).toBe(true);
  });

  it('always pushes to ring buffer regardless of level filter', () => {
    dbg.setLevel('error');

    dbg.trace('service', 'suppressed trace');
    dbg.debug('service', 'suppressed debug');

    const entries = dbg.entries();
    expect(entries.some((e: any) => e.msg === 'suppressed trace')).toBe(true);
    expect(entries.some((e: any) => e.msg === 'suppressed debug')).toBe(true);
  });
});

// ─── Category Enable/Disable ─────────────────────────────────────────────────

describe('Category Enable/Disable', () => {
  it('disable() suppresses console output for that category', () => {
    dbg.disable('render');

    dbg.info('render', 'should be suppressed');
    dbg.info('service', 'should show');

    const infoCalls = (console.info as jest.Mock).mock.calls;
    const hasRender = infoCalls.some((args: any[]) => args.some(a => typeof a === 'string' && a.includes('should be suppressed')));
    const hasService = infoCalls.some((args: any[]) => args.some(a => typeof a === 'string' && a.includes('should show')));

    expect(hasRender).toBe(false);
    expect(hasService).toBe(true);
  });

  it('enable() re-enables a disabled category', () => {
    dbg.disableAll();
    dbg.enable('network');

    dbg.info('network', 'network enabled');
    dbg.info('service', 'service disabled');

    const infoCalls = (console.info as jest.Mock).mock.calls;
    const hasNetwork = infoCalls.some((args: any[]) => args.some(a => typeof a === 'string' && a.includes('network enabled')));
    const hasService = infoCalls.some((args: any[]) => args.some(a => typeof a === 'string' && a.includes('service disabled')));

    expect(hasNetwork).toBe(true);
    expect(hasService).toBe(false);
  });

  it('disableAll() suppresses all categories from console', () => {
    dbg.disableAll();

    dbg.info('service', 'suppressed svc');
    dbg.info('render', 'suppressed rnd');

    const infoCalls = (console.info as jest.Mock).mock.calls;
    const hasSvc = infoCalls.some((args: any[]) => args.some(a => typeof a === 'string' && a.includes('suppressed svc')));
    expect(hasSvc).toBe(false);
  });
});

// ─── Render Tracking ─────────────────────────────────────────────────────────

describe('Render Tracking', () => {
  it('trackRender() increments render counts', () => {
    dbg.trackRender('TestComponent');
    dbg.trackRender('TestComponent');
    dbg.trackRender('TestComponent');
    dbg.trackRender('OtherComponent');

    const counts = dbg.showRenderCounts();
    const testEntry = counts.find(([name]: [string, number]) => name === 'TestComponent');
    const otherEntry = counts.find(([name]: [string, number]) => name === 'OtherComponent');

    expect(testEntry![1]).toBe(3);
    expect(otherEntry![1]).toBe(1);
  });

  it('resetRenderCounts() clears all counts', () => {
    dbg.trackRender('Comp1');
    dbg.trackRender('Comp2');
    dbg.resetRenderCounts();

    const counts = dbg.showRenderCounts();
    expect(counts.length).toBe(0);
  });
});

// ─── Trace Buffer ────────────────────────────────────────────────────────────

describe('Trace Buffer', () => {
  it('tracePerf() writes to trace buffer', () => {
    dbg.tracePerf('service', 'wasm.decrypt', 5.3, 'messaging');
    dbg.tracePerf('service', 'wasm.encrypt', 2.1, 'messaging');

    const entries = dbg.getTraceEntries();
    const decrypt = entries.find((e: any) => e.msg.includes('wasm.decrypt'));
    expect(decrypt).toBeDefined();
    expect(decrypt!.cat).toBe('service');
    expect(decrypt!.src).toBe('messaging');
    expect(decrypt!.msg).toContain('dur=5.3ms');
  });

  it('traceStats() aggregates by category', () => {
    // Clear trace buffer by creating fresh entries
    dbg.tracePerf('service', 'op1', 10.0);
    dbg.tracePerf('service', 'op2', 20.0);
    dbg.tracePerf('render', 'render1', 5.0);

    const stats = dbg.getTraceStats();
    expect(stats.service).toBeDefined();
    expect(stats.service.count).toBeGreaterThanOrEqual(2);
    expect(stats.service.maxMs).toBeGreaterThanOrEqual(20.0);
    expect(stats.render).toBeDefined();
  });
});

// ─── Source Filtering ────────────────────────────────────────────────────────

describe('Source Filtering', () => {
  it('filterSource() only shows matching source in console', () => {
    dbg.filterSource('Chat');

    dbg.info('messages', 'from chat', undefined, 'ChatArea');
    dbg.info('messages', 'from friends', undefined, 'FriendList');

    const infoCalls = (console.info as jest.Mock).mock.calls;
    const hasChat = infoCalls.some((args: any[]) => args.some(a => typeof a === 'string' && a.includes('from chat')));
    const hasFriends = infoCalls.some((args: any[]) => args.some(a => typeof a === 'string' && a.includes('from friends')));

    expect(hasChat).toBe(true);
    expect(hasFriends).toBe(false);
  });

  it('clearFilter() shows all sources again', () => {
    dbg.filterSource('Chat');
    dbg.clearFilter();

    dbg.info('messages', 'visible now', undefined, 'FriendList');

    const infoCalls = (console.info as jest.Mock).mock.calls;
    const hasVisible = infoCalls.some((args: any[]) => args.some(a => typeof a === 'string' && a.includes('visible now')));
    expect(hasVisible).toBe(true);
  });
});

// ─── Error Tracking ──────────────────────────────────────────────────────────

describe('Error Tracking', () => {
  it('error() captures stack trace', () => {
    dbg.error('service', 'something broke', { detail: 'test' });

    const entry = dbg.entries().find((e: any) => e.msg === 'something broke');
    expect(entry).toBeDefined();
    expect(entry!.stack).toBeDefined();
    expect(typeof entry!.stack).toBe('string');
  });

  it('fatal() captures stack trace and level', () => {
    dbg.fatal('lifecycle', 'critical failure');

    const entry = dbg.entries().find((e: any) => e.msg === 'critical failure');
    expect(entry).toBeDefined();
    expect(entry!.stack).toBeDefined();
    expect(entry!.level).toBe('fatal');
  });
});

// ─── Chrome Trace Export ─────────────────────────────────────────────────────

describe('Chrome Trace Export', () => {
  it('exportChromeTrace() produces valid format', () => {
    dbg.info('service', 'trace event 1');
    dbg.warn('network', 'trace event 2');

    const json = dbg.exportChromeTrace();
    const parsed = JSON.parse(json);

    expect(parsed.traceEvents).toBeDefined();
    expect(Array.isArray(parsed.traceEvents)).toBe(true);

    const event = parsed.traceEvents.find((e: any) => e.name.includes('trace event 1'));
    expect(event).toBeDefined();
    expect(event.cat).toBe('service');
    expect(event.ph).toBe('i');
    expect(typeof event.ts).toBe('number');
    expect(event.pid).toBe(1);
    expect(event.tid).toBe(1);
    expect(event.args.level).toBe('info');
  });
});

// ─── Performance Budgets ─────────────────────────────────────────────────────

describe('Performance Budgets', () => {
  it('getBudgets() returns default thresholds', () => {
    const budgets = dbg.getBudgets();
    expect(budgets.renderMs).toBe(16);
    expect(budgets.wasmMs).toBe(100);
    expect(budgets.heapPct).toBe(80);
    expect(budgets.messageSizeBytes).toBe(1_000_000);
    expect(budgets.renderRatePerSec).toBe(60);
  });

  it('setBudgets() updates thresholds partially', () => {
    dbg.setBudgets({ renderMs: 8, wasmMs: 50 });
    const budgets = dbg.getBudgets();
    expect(budgets.renderMs).toBe(8);
    expect(budgets.wasmMs).toBe(50);
    expect(budgets.heapPct).toBe(80); // unchanged
  });

  it('checkBudget() records violations when exceeded', () => {
    dbg.setBudgets({ wasmMs: 10 });
    dbg.checkBudget('wasm', 50, 'decrypt');

    const violations = dbg.getBudgetViolations();
    expect(violations.length).toBeGreaterThanOrEqual(1);
    expect(violations.some((v: string) => v.includes('BUDGET EXCEEDED') && v.includes('wasm'))).toBe(true);
  });

  it('checkBudget() does not record when within budget', () => {
    const beforeCount = dbg.getBudgetViolations().length;
    dbg.checkBudget('wasm', 5, 'encrypt');
    expect(dbg.getBudgetViolations().length).toBe(beforeCount);
  });
});

// ─── Web Vitals ──────────────────────────────────────────────────────────────

describe('Web Vitals', () => {
  it('getWebVitals() returns structure with all fields', () => {
    const vitals = dbg.getWebVitals();
    expect(vitals).toHaveProperty('inp');
    expect(vitals).toHaveProperty('cls');
    expect(vitals).toHaveProperty('lcp');
    expect(vitals).toHaveProperty('fcp');
    expect(typeof vitals.cls).toBe('number');
  });
});

// ─── React Profiler ──────────────────────────────────────────────────────────

describe('React Profiler', () => {
  it('onProfilerRender callback records stats', () => {
    dbg.onProfilerRender('TestApp', 'mount', 12.5, 15.0, 100, 112.5);
    dbg.onProfilerRender('TestApp', 'update', 3.2, 15.0, 200, 203.2);
    dbg.onProfilerRender('TestChat', 'update', 8.0, 10.0, 300, 308.0);

    const stats = dbg.getProfilerStats();
    expect(stats.TestApp).toBeDefined();
    expect(stats.TestApp.count).toBe(2);
    expect(stats.TestApp.mounts).toBe(1);
    expect(stats.TestApp.updates).toBe(1);
    expect(stats.TestApp.maxMs).toBe(12.5);

    expect(stats.TestChat).toBeDefined();
    expect(stats.TestChat.count).toBe(1);
  });

  it('onProfilerRender records budget violation for slow commits', () => {
    dbg.setBudgets({ renderMs: 10 });
    const beforeCount = dbg.getBudgetViolations().length;

    dbg.onProfilerRender('SlowComp', 'update', 25.0, 30.0, 100, 125);

    const violations = dbg.getBudgetViolations();
    expect(violations.length).toBeGreaterThan(beforeCount);
    expect(violations.some((v: string) => v.includes('SlowComp'))).toBe(true);
  });
});

// ─── Throughput Stats ────────────────────────────────────────────────────────

describe('Throughput Stats', () => {
  it('showStats() returns per-category counts', () => {
    dbg.info('service', 'msg1');
    dbg.info('service', 'msg2');
    dbg.info('network', 'msg3');

    const stats = dbg.showStats();
    const serviceRow = stats.find((r: any) => r.category === 'service');
    const networkRow = stats.find((r: any) => r.category === 'network');

    expect(serviceRow?.count).toBeGreaterThanOrEqual(2);
    expect(networkRow?.count).toBeGreaterThanOrEqual(1);
  });
});

// ─── Snapshot ────────────────────────────────────────────────────────────────

describe('Snapshot', () => {
  it('snapshot() captures current state', () => {
    dbg.trackRender('SnapComp');
    dbg.info('service', 'snapshot test');

    const snap = dbg.snapshot();
    expect(snap.timestamp).toBeDefined();
    expect(snap.renderCounts.SnapComp).toBe(1);
    expect(snap.ringBufferSize).toBeGreaterThan(0);
    expect(snap.enabledCategories).toContain('service');
  });

  it('snapshot() includes custom state getter', () => {
    const snap = dbg.snapshot(() => ({ customKey: 'customValue' }));
    expect(snap.appState.customKey).toBe('customValue');
  });
});
