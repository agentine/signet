import type { Writable } from 'node:stream';
import type { HashOptions } from './types.js';
import { computeHash } from './hash.js';
import { serialize } from './serialize.js';

export type { HashOptions, Algorithm, Encoding } from './types.js';
export { serialize } from './serialize.js';

function hash(value: unknown, options?: HashOptions): string | Buffer {
  return computeHash(value, options);
}

hash.sha1 = function (value: unknown, options?: Omit<HashOptions, 'algorithm'>): string | Buffer {
  return computeHash(value, { ...options, algorithm: 'sha1' });
};

hash.MD5 = function (value: unknown, options?: Omit<HashOptions, 'algorithm'>): string | Buffer {
  return computeHash(value, { ...options, algorithm: 'md5' });
};

hash.keys = function (value: unknown, options?: HashOptions): string | Buffer {
  return computeHash(value, { ...options, excludeValues: true, algorithm: 'sha1', encoding: 'hex' });
};

hash.keysMD5 = function (value: unknown, options?: HashOptions): string | Buffer {
  return computeHash(value, { ...options, excludeValues: true, algorithm: 'md5', encoding: 'hex' });
};

hash.writeToStream = function (
  value: unknown,
  optionsOrStream: HashOptions | Writable | undefined,
  stream?: Writable
): void {
  let opts: HashOptions = {};
  let target: Writable;
  if (stream === undefined) {
    target = optionsOrStream as Writable;
  } else {
    opts = (optionsOrStream as HashOptions) ?? {};
    target = stream;
  }
  const serialized = serialize(value, opts);
  target.write(serialized);
};

export default hash;
