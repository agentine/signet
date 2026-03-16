import { describe, it, expect } from 'vitest';
import hash from '../src/index.js';
import objectHash from 'object-hash';

describe('hash – algorithms', () => {
  const obj = { foo: 'bar', baz: [1, 2, 3] };

  it('defaults to sha1 hex', () => {
    const result = hash(obj) as string;
    expect(result).toBe(objectHash(obj));
    expect(result).toMatch(/^[0-9a-f]{40}$/);
  });

  it('sha256', () => {
    const result = hash(obj, { algorithm: 'sha256' }) as string;
    expect(result).toBe(objectHash(obj, { algorithm: 'sha256' }));
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it('sha512', () => {
    const result = hash(obj, { algorithm: 'sha512' }) as string;
    expect(result).toBe(objectHash(obj, { algorithm: 'sha512' }));
    expect(result).toMatch(/^[0-9a-f]{128}$/);
  });

  it('md5', () => {
    const result = hash(obj, { algorithm: 'md5' }) as string;
    expect(result).toBe(objectHash(obj, { algorithm: 'md5' }));
    expect(result).toMatch(/^[0-9a-f]{32}$/);
  });

  it('passthrough', () => {
    const result = hash(obj, { algorithm: 'passthrough' }) as string;
    expect(result).toBe(objectHash(obj, { algorithm: 'passthrough' }));
    expect(typeof result).toBe('string');
  });
});

describe('hash – encodings', () => {
  const obj = { test: 'value' };

  it('hex encoding', () => {
    const result = hash(obj, { encoding: 'hex' }) as string;
    expect(result).toBe(objectHash(obj, { encoding: 'hex' }));
  });

  it('base64 encoding', () => {
    const result = hash(obj, { encoding: 'base64' }) as string;
    expect(result).toBe(objectHash(obj, { encoding: 'base64' }));
  });

  it('binary encoding', () => {
    const result = hash(obj, { encoding: 'binary' }) as string;
    expect(result).toBe(objectHash(obj, { encoding: 'binary' }));
  });

  it('buffer encoding', () => {
    const result = hash(obj, { encoding: 'buffer' }) as Buffer;
    const ohResult = objectHash(obj, { encoding: 'buffer' });
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.equals(ohResult)).toBe(true);
  });
});

describe('hash – sugar methods', () => {
  const obj = { a: 1, b: 2 };

  it('sha1', () => {
    expect(hash.sha1(obj)).toBe(objectHash.sha1(obj));
  });

  it('MD5', () => {
    expect(hash.MD5(obj)).toBe(objectHash.MD5(obj));
  });

  it('keys', () => {
    expect(hash.keys(obj)).toBe(objectHash.keys(obj));
  });

  it('keysMD5', () => {
    expect(hash.keysMD5(obj)).toBe(objectHash.keysMD5(obj));
  });
});

describe('hash – writeToStream', () => {
  it('writes serialized data to stream (2-arg)', () => {
    const { PassThrough } = require('stream');
    const ohStream = new PassThrough();
    objectHash.writeToStream({ a: 1 }, ohStream);

    const sigStream = new PassThrough();
    hash.writeToStream({ a: 1 }, sigStream);

    expect(sigStream.read().toString()).toBe(ohStream.read().toString());
  });

  it('writes serialized data to stream (3-arg)', () => {
    const { PassThrough } = require('stream');
    const ohStream = new PassThrough();
    objectHash.writeToStream({ a: 1 }, { respectType: false }, ohStream);

    const sigStream = new PassThrough();
    hash.writeToStream({ a: 1 }, { respectType: false }, sigStream);

    expect(sigStream.read().toString()).toBe(ohStream.read().toString());
  });
});

describe('hash – determinism', () => {
  it('same input always produces same hash', () => {
    const obj = { x: [1, 2, 3], y: { nested: true } };
    const h1 = hash(obj);
    const h2 = hash(obj);
    expect(h1).toBe(h2);
  });

  it('different key order produces same hash', () => {
    const h1 = hash({ a: 1, b: 2 });
    const h2 = hash({ b: 2, a: 1 });
    expect(h1).toBe(h2);
  });

  it('different values produce different hashes', () => {
    const h1 = hash({ a: 1 });
    const h2 = hash({ a: 2 });
    expect(h1).not.toBe(h2);
  });
});
