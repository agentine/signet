# Changelog

## 0.1.0 (2026-03-16)

Initial release.

### Features

- Deterministic object-to-string serialization matching object-hash v3.0.0 byte-for-byte
- Hash algorithms: SHA-1 (default), SHA-256, SHA-512, MD5, passthrough
- Encodings: hex (default), base64, buffer, binary
- Full options support: `excludeKeys`, `excludeValues`, `respectType`, `respectFunctionNames`, `respectFunctionProperties`, `unorderedArrays`, `unorderedSets`, `unorderedObjects`, `replacer`, `ignoreUnknown`
- Circular reference detection
- All JS types: primitives, Date, RegExp, Error, URL, Set, Map, Buffer, TypedArray, ArrayBuffer, BigInt, Symbol, functions
- Drop-in object-hash compatibility layer (`@agentine/signet/compat/object-hash`)
- Convenience methods: `hash.sha1()`, `hash.MD5()`, `hash.keys()`, `hash.keysMD5()`, `hash.writeToStream()`
- TypeScript-first with full type declarations
- ESM + CJS dual package
- Zero dependencies
- Node.js 18+ (LTS baseline)
