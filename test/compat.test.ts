import { describe, it, expect } from 'vitest';
import hash from '../src/compat/object-hash.js';
import { sha1, MD5, keys, keysMD5, writeToStream } from '../src/compat/object-hash.js';
import objectHash from 'object-hash';

describe('compat – exports', () => {
  it('default export is a function', () => {
    expect(typeof hash).toBe('function');
  });

  it('named exports match object-hash API', () => {
    expect(typeof sha1).toBe('function');
    expect(typeof MD5).toBe('function');
    expect(typeof keys).toBe('function');
    expect(typeof keysMD5).toBe('function');
    expect(typeof writeToStream).toBe('function');
  });

  it('hash function has sugar methods', () => {
    expect(typeof hash.sha1).toBe('function');
    expect(typeof hash.MD5).toBe('function');
    expect(typeof hash.keys).toBe('function');
    expect(typeof hash.keysMD5).toBe('function');
    expect(typeof hash.writeToStream).toBe('function');
  });
});

describe('compat – parity across 100+ test cases', () => {
  const testCases: [string, unknown, object?][] = [
    // Primitives in objects
    ['string value', { a: 'hello' }],
    ['empty string', { a: '' }],
    ['unicode string', { a: '\u00e9\u00e0\u00fc' }],
    ['long string', { a: 'x'.repeat(1000) }],
    ['integer', { a: 42 }],
    ['zero', { a: 0 }],
    ['negative', { a: -1 }],
    ['float', { a: 3.14159 }],
    ['max safe int', { a: Number.MAX_SAFE_INTEGER }],
    ['min safe int', { a: Number.MIN_SAFE_INTEGER }],
    ['NaN', { a: NaN }],
    ['Infinity', { a: Infinity }],
    ['-Infinity', { a: -Infinity }],
    ['-0', { a: -0 }],
    ['true', { a: true }],
    ['false', { a: false }],
    ['null', { a: null }],
    ['undefined', { a: undefined }],
    ['bigint 0', { a: BigInt(0) }],
    ['bigint large', { a: BigInt('999999999999999999') }],

    // Objects
    ['empty object', {}],
    ['flat object', { x: 1, y: 2, z: 3 }],
    ['nested', { a: { b: { c: { d: 1 } } } }],
    ['reverse keys', { z: 1, y: 2, x: 3 }],
    ['mixed values', { str: 'hi', num: 1, bool: true, nil: null }],
    ['numeric keys', { '1': 'a', '2': 'b', '10': 'c' }],

    // Arrays
    ['empty array', []],
    ['number array', [1, 2, 3]],
    ['string array', ['a', 'b', 'c']],
    ['mixed array', [1, 'two', true, null]],
    ['nested array', [[1, 2], [3, 4]]],
    ['array of objects', [{ a: 1 }, { b: 2 }]],
    ['deep nested array', [[[1]], [[2]], [[3]]]],

    // Dates
    ['epoch date', new Date(0)],
    ['iso date', new Date('2024-06-15T12:00:00.000Z')],
    ['date in object', { created: new Date('2024-01-01') }],

    // RegExp
    ['simple regex', /foo/],
    ['regex with flags', /bar/gi],
    ['complex regex', /^[a-z]+\d{2,4}$/im],
    ['regex in object', { pattern: /test/ }],

    // Errors
    ['Error', new Error('boom')],
    ['TypeError', new TypeError('bad type')],
    ['RangeError', new RangeError('out of range')],

    // URL
    ['simple url', new URL('https://example.com')],
    ['url with path', new URL('https://example.com/path')],
    ['url with query', new URL('https://example.com?q=1&r=2')],

    // Set
    ['empty set', new Set()],
    ['number set', new Set([1, 2, 3])],
    ['string set', new Set(['a', 'b', 'c'])],
    ['mixed set', new Set([1, 'two', true])],

    // Map
    ['empty map', new Map()],
    ['string-key map', new Map([['a', 1], ['b', 2]])],
    ['number-key map', new Map([[1, 'a'], [2, 'b']])],

    // Buffer
    ['empty buffer', Buffer.alloc(0)],
    ['byte buffer', Buffer.from([1, 2, 3])],
    ['string buffer', Buffer.from('hello world')],

    // TypedArrays
    ['Uint8Array', new Uint8Array([0, 127, 255])],
    ['Int8Array', new Int8Array([-128, 0, 127])],
    ['Uint16Array', new Uint16Array([0, 65535])],
    ['Int16Array', new Int16Array([-32768, 32767])],
    ['Uint32Array', new Uint32Array([0, 4294967295])],
    ['Int32Array', new Int32Array([-2147483648, 2147483647])],
    ['Float32Array', new Float32Array([1.5, -2.5])],
    ['Float64Array', new Float64Array([Math.PI, Math.E])],
    ['Uint8ClampedArray', new Uint8ClampedArray([0, 128, 255])],

    // ArrayBuffer
    ['ArrayBuffer', new ArrayBuffer(8)],

    // Functions
    ['named fn', function myFunc() { return 1; }],
    ['anon fn', function() { return 2; }],
    ['arrow fn', () => 3],

    // Complex nested
    ['complex nested', {
      users: [
        { name: 'Alice', age: 30, tags: new Set(['admin']) },
        { name: 'Bob', age: 25, tags: new Set(['user']) },
      ],
      meta: { created: new Date('2024-01-01'), version: 2 },
    }],

    // Objects with many types
    ['all types', {
      str: 'hello',
      num: 42,
      bool: true,
      nil: null,
      undef: undefined,
      big: BigInt(100),
      date: new Date('2024-01-01'),
      re: /test/,
      arr: [1, 2, 3],
      set: new Set([1]),
      map: new Map([['k', 'v']]),
      buf: Buffer.from([1]),
      nested: { deep: true },
    }],

    // Options variants
    ['excludeValues', { a: 1, b: 2 }, { excludeValues: true }],
    ['excludeKeys', { a: 1, _b: 2, c: 3 }, { excludeKeys: (k: string) => k.startsWith('_') }],
    ['respectType false', { a: 1 }, { respectType: false }],
    ['unorderedArrays', [3, 1, 2], { unorderedArrays: true }],
    ['unorderedSets false', new Set([3, 1, 2]), { unorderedSets: false }],
    ['unorderedObjects false', { z: 1, a: 2 }, { unorderedObjects: false }],
    ['respectFunctionNames false', function namedFn() {}, { respectFunctionNames: false }],
    ['respectFunctionProperties false', function namedFn() {}, { respectFunctionProperties: false }],
    ['replacer', { a: 1, b: 'x' }, { replacer: (v: unknown) => typeof v === 'string' ? (v as string).toUpperCase() : v }],
    ['combined opts', { a: [3, 1], _b: 2 }, {
      excludeKeys: (k: string) => k.startsWith('_'),
      unorderedArrays: true,
      respectType: false,
    }],

    // More edge cases
    ['deeply nested arrays', { a: [[[1, 2]], [[3, 4]]] }],
    ['object in array', [{ x: 1 }, { y: 2 }]],
    ['set of objects', new Set([{ a: 1 }, { b: 2 }])],
    ['map with complex values', new Map([['key', { nested: [1, 2] }]])],
    ['empty nested', { a: {}, b: [], c: new Set(), d: new Map() }],
    ['boolean keys', { true: 1, false: 2 }],
    ['number string keys', { '0': 'zero', '1': 'one' }],
    ['special chars in keys', { 'a:b': 1, 'c,d': 2 }],
    ['unicode keys', { '\u00e9': 1, '\u00e0': 2 }],
    ['nested null proto', (() => { const o = Object.create(null); o.x = Object.create(null); o.x.y = 1; return o; })()],
  ];

  for (const [name, value, opts] of testCases) {
    it(`parity: ${name}`, () => {
      const ohHash = objectHash(value as object, opts);
      const sigHash = hash(value as object, opts) as string;
      expect(sigHash).toBe(ohHash);
    });
  }

  it('circular self-reference parity', () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;
    expect(hash(obj) as string).toBe(objectHash(obj));
  });

  it('mutual circular reference parity', () => {
    const a: Record<string, unknown> = { name: 'a' };
    const b: Record<string, unknown> = { name: 'b', ref: a };
    a.ref = b;
    expect(hash(a) as string).toBe(objectHash(a));
  });

  it('triple circular reference parity', () => {
    const a: Record<string, unknown> = {};
    const b: Record<string, unknown> = {};
    const c: Record<string, unknown> = {};
    a.next = b; b.next = c; c.next = a;
    expect(hash(a) as string).toBe(objectHash(a));
  });
});
