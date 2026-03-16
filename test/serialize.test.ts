import { describe, it, expect } from 'vitest';
import { serialize } from '../src/serialize.js';
import objectHash from 'object-hash';

const pass = { algorithm: 'passthrough' as const, encoding: 'hex' as const };

function expectParity(value: unknown, opts: object = {}) {
  const ohResult = objectHash(value, { ...pass, ...opts });
  const sigResult = serialize(value, opts);
  expect(sigResult).toBe(ohResult);
}

describe('serialize – primitives', () => {
  it('serializes strings', () => {
    expectParity({ a: 'hello' });
    expectParity({ a: '' });
    expectParity({ a: 'with spaces and "quotes"' });
  });

  it('serializes numbers', () => {
    expectParity({ a: 42 });
    expectParity({ a: 0 });
    expectParity({ a: -1 });
    expectParity({ a: 3.14 });
    expectParity({ a: Number.MAX_SAFE_INTEGER });
    expectParity({ a: Number.MIN_SAFE_INTEGER });
  });

  it('serializes special numbers', () => {
    expectParity({ a: NaN });
    expectParity({ a: Infinity });
    expectParity({ a: -Infinity });
    expectParity({ a: -0 });
  });

  it('serializes booleans', () => {
    expectParity({ a: true });
    expectParity({ a: false });
  });

  it('serializes null', () => {
    expectParity({ a: null });
  });

  it('serializes undefined', () => {
    expectParity({ a: undefined });
  });

  it('serializes bigint', () => {
    expectParity({ a: BigInt(0) });
    expectParity({ a: BigInt(42) });
    expectParity({ a: BigInt(-100) });
    expectParity({ a: BigInt('9007199254740993') });
  });

  it('serializes symbols', () => {
    expectParity({ a: Symbol('test') });
    expectParity({ a: Symbol() });
    expectParity({ a: Symbol.iterator });
  });
});

describe('serialize – objects', () => {
  it('serializes empty object', () => {
    expectParity({});
  });

  it('serializes flat object', () => {
    expectParity({ a: 1, b: 2, c: 3 });
  });

  it('serializes nested objects', () => {
    expectParity({ a: { b: { c: 1 } } });
  });

  it('sorts keys by default', () => {
    expectParity({ z: 1, a: 2, m: 3 });
  });

  it('preserves key order when unorderedObjects is false', () => {
    expectParity({ z: 1, a: 2 }, { unorderedObjects: false });
  });

  it('handles null prototype objects', () => {
    const obj = Object.create(null);
    obj.x = 1;
    obj.y = 2;
    expectParity(obj);
  });

  it('serializes class instances', () => {
    class MyClass {
      x: number;
      constructor() { this.x = 1; }
    }
    expectParity(new MyClass());
  });
});

describe('serialize – arrays', () => {
  it('serializes empty array', () => {
    expectParity([]);
  });

  it('serializes simple array', () => {
    expectParity([1, 2, 3]);
  });

  it('serializes mixed array', () => {
    expectParity([1, 'a', true, null]);
  });

  it('serializes nested arrays', () => {
    expectParity([[1, 2], [3, 4]]);
  });

  it('serializes array with undefined', () => {
    expectParity([1, undefined, 3]);
  });

  it('serializes sparse array', () => {
    const sparse: unknown[] = [1];
    (sparse as number[])[3] = 4;
    expectParity(sparse);
  });

  it('sorts with unorderedArrays', () => {
    expectParity([3, 1, 2], { unorderedArrays: true });
  });
});

describe('serialize – special types', () => {
  it('serializes Date', () => {
    expectParity(new Date('2024-01-01T00:00:00.000Z'));
    expectParity(new Date(0));
  });

  it('serializes RegExp', () => {
    expectParity(/test/gi);
    expectParity(/^foo$/);
    expectParity(new RegExp('bar', 'i'));
  });

  it('serializes Error', () => {
    expectParity(new Error('test error'));
    expectParity(new TypeError('type error'));
    expectParity(new RangeError('range'));
  });

  it('serializes URL', () => {
    expectParity(new URL('https://example.com'));
    expectParity(new URL('https://example.com/path?q=1#hash'));
  });

  it('serializes Set', () => {
    expectParity(new Set([1, 2, 3]));
    expectParity(new Set());
    expectParity(new Set(['a', 'b', 'c']));
  });

  it('serializes Map', () => {
    expectParity(new Map([['a', 1], ['b', 2]]));
    expectParity(new Map());
  });

  it('serializes Buffer', () => {
    expectParity(Buffer.from([1, 2, 3]));
    expectParity(Buffer.from('hello'));
    expectParity(Buffer.alloc(0));
  });

  it('serializes Uint8Array', () => {
    expectParity(new Uint8Array([1, 2, 3]));
  });

  it('serializes other TypedArrays', () => {
    expectParity(new Int8Array([1, -1]));
    expectParity(new Int16Array([1, -1]));
    expectParity(new Uint16Array([1, 2]));
    expectParity(new Int32Array([1, -1]));
    expectParity(new Uint32Array([1, 2]));
    expectParity(new Float32Array([1.5, 2.5]));
    expectParity(new Float64Array([1.5, 2.5]));
    expectParity(new Uint8ClampedArray([1, 2]));
  });

  it('serializes ArrayBuffer', () => {
    expectParity(new ArrayBuffer(4));
  });
});

describe('serialize – functions', () => {
  it('serializes named function', () => {
    expectParity(function myFunc() { return 1; });
  });

  it('serializes anonymous function', () => {
    expectParity(function() { return 1; });
  });

  it('serializes arrow function', () => {
    expectParity(() => 1);
  });

  it('respects respectFunctionNames option', () => {
    expectParity(function myFunc() { return 1; }, { respectFunctionNames: false });
  });

  it('respects respectFunctionProperties option', () => {
    expectParity(function myFunc() { return 1; }, { respectFunctionProperties: false });
  });
});

describe('serialize – circular references', () => {
  it('handles self-reference', () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;
    expectParity(obj);
  });

  it('handles nested circular', () => {
    const a: Record<string, unknown> = {};
    const b: Record<string, unknown> = { a };
    a.b = b;
    expectParity(a);
  });

  it('handles multiple circular refs', () => {
    const c1: Record<string, unknown> = { name: 'c1' };
    const c2: Record<string, unknown> = { name: 'c2', ref: c1 };
    c1.ref = c2;
    expectParity(c1);
  });
});

describe('serialize – options', () => {
  it('excludeKeys', () => {
    expectParity({ a: 1, _b: 2, c: 3 }, { excludeKeys: (k: string) => k.startsWith('_') });
  });

  it('excludeValues', () => {
    expectParity({ a: 1, b: 2 }, { excludeValues: true });
  });

  it('respectType false', () => {
    expectParity({ a: 1 }, { respectType: false });
  });

  it('replacer', () => {
    expectParity(
      { a: 1, b: 'hello' },
      { replacer: (v: unknown) => typeof v === 'string' ? (v as string).toUpperCase() : v }
    );
  });

  it('unorderedSets false', () => {
    expectParity(new Set([3, 1, 2]), { unorderedSets: false });
  });

  it('combined options', () => {
    expectParity(
      { a: 1, _private: 'secret', b: [3, 1, 2] },
      {
        excludeKeys: (k: string) => k.startsWith('_'),
        unorderedArrays: true,
        respectType: false,
      }
    );
  });
});
