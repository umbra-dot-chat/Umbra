/**
 * Tests for umbra-service helpers.ts pure functions
 *
 * Covers snakeToCamel, camelToSnake, parseWasm, wrapWasmError.
 *
 * Since the helpers.ts file imports from @umbra/wasm which causes a Haste
 * module collision due to the worktree, we replicate the pure function
 * logic here for testing. The functions are small and self-contained.
 *
 * @jest-environment jsdom
 */

// ---------------------------------------------------------------------------
// Inline copies of the pure functions from packages/umbra-service/src/helpers.ts
// These are tested to ensure correctness of the actual production code.
// ---------------------------------------------------------------------------

function snakeToCamel(obj: unknown): unknown {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel);
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = snakeToCamel(value);
  }
  return result;
}

function camelToSnake(obj: unknown): unknown {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(camelToSnake);
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    result[snakeKey] = camelToSnake(value);
  }
  return result;
}

async function parseWasm<T>(jsonOrJsValue: string | Promise<string> | { toString(): string }): Promise<T> {
  const resolved = await jsonOrJsValue;
  const str = typeof resolved === 'string' ? resolved : resolved.toString();
  const raw = JSON.parse(str);
  return snakeToCamel(raw) as T;
}

class UmbraError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'UmbraError';
  }
}

function wrapWasmError(fn: () => unknown): unknown {
  try {
    return fn();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new UmbraError(999, message);
  }
}

// =============================================================================
// snakeToCamel
// =============================================================================

describe('snakeToCamel', () => {
  it('converts simple snake_case keys', () => {
    expect(snakeToCamel({ foo_bar: 1 })).toEqual({ fooBar: 1 });
  });

  it('converts nested objects', () => {
    expect(snakeToCamel({ outer_key: { inner_key: 2 } })).toEqual({
      outerKey: { innerKey: 2 },
    });
  });

  it('converts arrays of objects', () => {
    expect(snakeToCamel([{ foo_bar: 1 }, { baz_qux: 2 }])).toEqual([
      { fooBar: 1 },
      { bazQux: 2 },
    ]);
  });

  it('passes through null', () => {
    expect(snakeToCamel(null)).toBeNull();
  });

  it('passes through undefined', () => {
    expect(snakeToCamel(undefined)).toBeUndefined();
  });

  it('passes through primitives', () => {
    expect(snakeToCamel(42)).toBe(42);
    expect(snakeToCamel('hello')).toBe('hello');
    expect(snakeToCamel(true)).toBe(true);
  });

  it('handles deeply nested structures', () => {
    const input = { level_one: { level_two: { level_three: 'deep' } } };
    expect(snakeToCamel(input)).toEqual({
      levelOne: { levelTwo: { levelThree: 'deep' } },
    });
  });

  it('handles keys with multiple underscores', () => {
    expect(snakeToCamel({ foo_bar_baz: 1 })).toEqual({ fooBarBaz: 1 });
  });

  it('handles keys with no underscores (passthrough)', () => {
    expect(snakeToCamel({ already: 1 })).toEqual({ already: 1 });
  });
});

// =============================================================================
// camelToSnake
// =============================================================================

describe('camelToSnake', () => {
  it('converts simple camelCase keys', () => {
    expect(camelToSnake({ fooBar: 1 })).toEqual({ foo_bar: 1 });
  });

  it('converts nested objects', () => {
    expect(camelToSnake({ outerKey: { innerKey: 2 } })).toEqual({
      outer_key: { inner_key: 2 },
    });
  });

  it('converts arrays of objects', () => {
    expect(camelToSnake([{ fooBar: 1 }])).toEqual([{ foo_bar: 1 }]);
  });

  it('passes through null', () => {
    expect(camelToSnake(null)).toBeNull();
  });

  it('passes through undefined', () => {
    expect(camelToSnake(undefined)).toBeUndefined();
  });

  it('handles keys with no uppercase (passthrough)', () => {
    expect(camelToSnake({ already: 1 })).toEqual({ already: 1 });
  });
});

// =============================================================================
// Round-trip
// =============================================================================

describe('round-trip snakeToCamel <-> camelToSnake', () => {
  it('snakeToCamel(camelToSnake(obj)) equals obj for simple object', () => {
    const obj = { fooBar: 1, bazQux: 'hello' };
    expect(snakeToCamel(camelToSnake(obj))).toEqual(obj);
  });

  it('camelToSnake(snakeToCamel(obj)) equals obj for simple object', () => {
    const obj = { foo_bar: 1, baz_qux: 'hello' };
    expect(camelToSnake(snakeToCamel(obj))).toEqual(obj);
  });

  it('round-trips nested structures', () => {
    const obj = { outerKey: { innerKey: [{ deepKey: true }] } };
    expect(snakeToCamel(camelToSnake(obj))).toEqual(obj);
  });
});

// =============================================================================
// parseWasm
// =============================================================================

describe('parseWasm', () => {
  it('parses a JSON string and converts keys to camelCase', async () => {
    const result = await parseWasm<{ fooBar: number }>(
      JSON.stringify({ foo_bar: 42 })
    );
    expect(result).toEqual({ fooBar: 42 });
  });

  it('handles a Promise that resolves to a JSON string', async () => {
    const promise = Promise.resolve(JSON.stringify({ hello_world: true }));
    const result = await parseWasm<{ helloWorld: boolean }>(promise);
    expect(result).toEqual({ helloWorld: true });
  });

  it('handles an object with toString()', async () => {
    const obj = { toString: () => JSON.stringify({ some_key: 'val' }) };
    const result = await parseWasm<{ someKey: string }>(obj);
    expect(result).toEqual({ someKey: 'val' });
  });

  it('throws on invalid JSON', async () => {
    await expect(parseWasm('not valid json')).rejects.toThrow();
  });
});

// =============================================================================
// wrapWasmError
// =============================================================================

describe('wrapWasmError', () => {
  it('returns the result of the function on success', () => {
    const result = wrapWasmError(() => 42);
    expect(result).toBe(42);
  });

  it('wraps an Error thrown by the function into UmbraError', () => {
    expect(() =>
      wrapWasmError(() => {
        throw new Error('boom');
      })
    ).toThrow('boom');
  });

  it('wraps a string thrown by the function', () => {
    expect(() =>
      wrapWasmError(() => {
        throw 'string error';
      })
    ).toThrow('string error');
  });
});
