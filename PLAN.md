# signet — Implementation Plan

## Overview

**signet** is a modern, zero-dependency, TypeScript-first replacement for
[object-hash](https://github.com/puleos/object-hash) (31–41M weekly npm
downloads, unmaintained since 2022, single maintainer, 30 open issues,
10 unmerged PRs).

signet provides a 100% object-hash-compatible API so existing code can migrate
with a single import path change.

**npm package:** `@agentine/signet`
**License:** MIT

---

## Why object-hash Needs Replacing

| Signal | Detail |
|---|---|
| Downloads | 31–41M weekly / 130M+ monthly |
| Dependents | 3,704 npm packages |
| Maintainer | Sole maintainer (Scott Puleo / puleos) |
| Last release | v3.0.0 — 4 years ago |
| Last commit | July 2024 (minor, no release) |
| Open issues | 30 |
| Open PRs | 10 (unmerged) |
| Source language | Plain JavaScript — no TypeScript types |
| Module format | CJS only — no ESM |
| Browser support | Requires Node crypto polyfill |
| Stars | 1.5k |

**No API-compatible replacement exists.** ohash (unjs) has a completely
different API (only SHA-256, no options). node-object-hash has a different API
and only 815K weekly downloads. hash-it has 86 dependents and a different API.

---

## Design Principles

1. **Drop-in compatible** — same exports, same options, same output format
2. **TypeScript-first** — full type safety, generics, strict mode
3. **Zero dependencies** — uses Node.js crypto + Web Crypto API
4. **Browser-native** — Web Crypto API for browsers, Node crypto for server
5. **ESM + CJS** — dual-publish for all environments
6. **Node.js 18+** — modern baseline (LTS)
7. **Deterministic** — identical inputs always produce identical hashes

---

## Architecture

### Core Components

#### 1. Serializer (`src/serialize.ts`)
Deterministic object-to-string serialization that handles all JavaScript types:
- Primitives: string, number, boolean, null, undefined, bigint, symbol
- Objects: plain objects, class instances, prototypes
- Collections: Array, Set, Map, TypedArray, ArrayBuffer, Buffer
- Special: Date, RegExp, Error, URL, NaN, Infinity, -0
- Circular reference detection (WeakSet-based)
- Sorted key iteration for deterministic output
- Options: `excludeKeys`, `excludeValues`, `respectType`,
  `unorderedArrays`, `unorderedSets`, `unorderedObjects`

#### 2. Hasher (`src/hash.ts`)
Hash digest generation from serialized strings:
- Algorithms: `sha1` (default), `sha256`, `sha512`, `md5`
- Encodings: `hex` (default), `base64`, `buffer`, `binary`
- Node.js: `crypto.createHash()`
- Browser: `crypto.subtle.digest()` with sync fallback
- `passthrough` algorithm returns raw serialized string (for debugging)

#### 3. Main API (`src/index.ts`)
```typescript
// Default export — hash(value, options?)
import hash from '@agentine/signet';

hash({ foo: 'bar' });
// => '67b69634f9880a282c14a0f0cb3ba90cddb95014'

hash(obj, { algorithm: 'sha256', encoding: 'hex' });
hash(obj, { excludeKeys: (key) => key.startsWith('_') });
hash(obj, { excludeValues: true }); // hash structure only
hash(obj, { respectType: false });
hash(obj, { unorderedArrays: true });

// Named exports
hash.sha1(obj);
hash.MD5(obj);
hash.keys(obj);
hash.writeToStream(obj, options, stream);
```

#### 4. Compatibility Layer (`src/compat/object-hash.ts`)
Drop-in module for seamless migration:
```typescript
// signet/compat/object-hash
// Re-exports the main API under the exact object-hash interface
```

### Directory Structure

```
src/
  index.ts          — main entry, default export + named exports
  serialize.ts      — deterministic serializer
  hash.ts           — hash digest generation
  types.ts          — TypeScript interfaces/types
  compat/
    object-hash.ts  — drop-in compatibility layer
test/
  serialize.test.ts — serializer unit tests
  hash.test.ts      — hash function tests
  compat.test.ts    — object-hash compatibility tests
  fixtures/         — test fixtures (complex objects, edge cases)
```

---

## Options Interface

```typescript
interface HashOptions {
  algorithm?: 'sha1' | 'sha256' | 'sha512' | 'md5' | 'passthrough';
  encoding?: 'hex' | 'base64' | 'buffer' | 'binary';
  excludeKeys?: (key: string) => boolean;
  excludeValues?: boolean;
  respectType?: boolean;       // default: true
  respectFunctionNames?: boolean; // default: true
  respectFunctionProperties?: boolean; // default: true
  unorderedArrays?: boolean;   // default: false
  unorderedSets?: boolean;     // default: true
  unorderedObjects?: boolean;  // default: true
  replacer?: (value: unknown) => unknown;
}
```

---

## Deliverables

1. **Core library** — serializer + hasher + types
2. **Compatibility layer** — `signet/compat/object-hash`
3. **Test suite** — unit tests + object-hash parity tests
4. **Package config** — ESM + CJS dual build, TypeScript declarations
5. **README** — usage, migration guide, API reference

---

## Hash Output Parity

The serializer must produce byte-identical output to object-hash v3.0.0 for
all supported types. Test suite should include:
- All primitive types
- Nested objects and arrays
- Set, Map, TypedArray, Buffer, Date, RegExp, Error
- Circular references
- Functions (names, properties, source)
- Prototype chains
- `excludeKeys`, `excludeValues`, `respectType` combinations
- `unorderedArrays` sorting behavior
- Edge cases: NaN, Infinity, -0, undefined in arrays, sparse arrays, symbols
