/**
 * Drop-in compatibility layer for object-hash v3.0.0.
 *
 * Replace:
 *   const hash = require('object-hash');
 * With:
 *   const hash = require('@agentine/signet/compat/object-hash');
 *
 * Or for ESM:
 *   import hash from '@agentine/signet/compat/object-hash';
 */
import hash from '../index.js';

export default hash;
export const sha1 = hash.sha1;
export const MD5 = hash.MD5;
export const keys = hash.keys;
export const keysMD5 = hash.keysMD5;
export const writeToStream = hash.writeToStream;
export type { HashOptions, Algorithm, Encoding } from '../types.js';
