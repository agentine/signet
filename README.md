# @agentine/signet

Deterministic object hashing for Node.js — drop-in replacement for [object-hash](https://github.com/puleos/object-hash).

- TypeScript-first with full type safety
- Zero runtime dependencies
- ESM + CJS dual build
- Node.js 18+
- Byte-identical output to object-hash v3.0.0

## Install

```bash
npm install @agentine/signet
```

## Usage

```typescript
import hash from '@agentine/signet';

// Default: sha1 + hex
hash({ foo: 'bar' });
// => '67b69634f9880a282c14a0f0cb3ba90cddb95014'

// Algorithm and encoding
hash(obj, { algorithm: 'sha256', encoding: 'base64' });

// Exclude keys
hash(obj, { excludeKeys: (key) => key.startsWith('_') });

// Hash structure only (keys, no values)
hash(obj, { excludeValues: true });

// Ignore prototype chain
hash(obj, { respectType: false });

// Sort arrays before hashing
hash(obj, { unorderedArrays: true });

// Sugar methods
hash.sha1(obj);
hash.MD5(obj);
hash.keys(obj);       // excludeValues + sha1
hash.keysMD5(obj);    // excludeValues + md5

// Streaming
hash.writeToStream(obj, options, stream);
hash.writeToStream(obj, stream); // options optional
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `algorithm` | `'sha1' \| 'sha256' \| 'sha512' \| 'md5' \| 'passthrough'` | `'sha1'` | Hash algorithm |
| `encoding` | `'hex' \| 'base64' \| 'buffer' \| 'binary'` | `'hex'` | Output encoding |
| `excludeKeys` | `(key: string) => boolean` | — | Filter out object keys |
| `excludeValues` | `boolean` | `false` | Hash keys only |
| `ignoreUnknown` | `boolean` | `false` | Skip unknown types instead of throwing |
| `respectType` | `boolean` | `true` | Include prototype/constructor in hash |
| `respectFunctionNames` | `boolean` | `true` | Include function names |
| `respectFunctionProperties` | `boolean` | `true` | Include function properties |
| `unorderedArrays` | `boolean` | `false` | Sort arrays before hashing |
| `unorderedSets` | `boolean` | `true` | Sort Sets/Maps before hashing |
| `unorderedObjects` | `boolean` | `true` | Sort object keys |
| `replacer` | `(value: unknown) => unknown` | — | Transform values before hashing |

## Migrating from object-hash

### Option 1: Direct replacement

```diff
-import hash from 'object-hash';
+import hash from '@agentine/signet';
```

### Option 2: Compatibility layer

```diff
-const hash = require('object-hash');
+const hash = require('@agentine/signet/compat/object-hash');
```

Both produce identical hash output for all supported types.

## Supported Types

Primitives: string, number, boolean, null, undefined, bigint, symbol.
Objects: plain objects, class instances, null-prototype objects.
Collections: Array, Set, Map, TypedArrays, ArrayBuffer, Buffer.
Special: Date, RegExp, Error, URL, functions.
Circular references are detected and handled.

## License

MIT
