# Migrating from object-hash to signet

## Quick Start

Replace the import:

```diff
-const hash = require('object-hash');
+const hash = require('@agentine/signet/compat/object-hash');
```

Or for ESM:

```diff
-import hash from 'object-hash';
+import hash from '@agentine/signet';
```

No code changes needed — signet produces byte-identical hash output.

## What's the same

- `hash(value, options)` — same signature, same output
- `hash.sha1(value)` — same
- `hash.MD5(value)` — same
- `hash.keys(value)` — same
- `hash.keysMD5(value)` — same
- `hash.writeToStream(value, options, stream)` — same
- All options: `algorithm`, `encoding`, `excludeKeys`, `excludeValues`, `ignoreUnknown`, `respectType`, `respectFunctionNames`, `respectFunctionProperties`, `unorderedArrays`, `unorderedSets`, `unorderedObjects`, `replacer`

## What's different

- Written in TypeScript with full type definitions
- ESM + CJS dual build (object-hash is CJS only)
- Zero dependencies
- Node.js 18+ (object-hash supports older Node versions)
- Active maintenance
