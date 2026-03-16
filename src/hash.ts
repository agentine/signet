import crypto from 'node:crypto';
import type { Algorithm, Encoding, HashOptions } from './types.js';
import { serialize } from './serialize.js';

export function computeHash(
  value: unknown,
  options: HashOptions = {}
): string | Buffer {
  const algorithm: Algorithm = options.algorithm ?? 'sha1';
  const encoding: Encoding = options.encoding ?? 'hex';

  const serialized = serialize(value, options);

  if (algorithm === 'passthrough') {
    return serialized;
  }

  const hash = crypto.createHash(algorithm);
  hash.update(serialized);

  if (encoding === 'buffer') {
    return hash.digest();
  }

  return hash.digest(encoding as 'hex' | 'base64' | 'binary');
}
