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
  return computeHash(value, { ...options, excludeValues: true });
};

hash.writeToStream = function (
  value: unknown,
  options: HashOptions | undefined,
  stream: Writable
): void {
  const serialized = serialize(value, options ?? {});
  stream.write(serialized);
};

export default hash;
