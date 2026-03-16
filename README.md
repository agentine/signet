# @agentine/signet

Deterministic object hashing for Node.js — drop-in replacement for [object-hash](https://github.com/puleos/object-hash).

## Install

```bash
npm install @agentine/signet
```

## Usage

```typescript
import hash from '@agentine/signet';

hash({ foo: 'bar' });
// => sha1 hex digest

hash(obj, { algorithm: 'sha256', encoding: 'hex' });
hash(obj, { excludeKeys: (key) => key.startsWith('_') });
hash(obj, { respectType: false });

hash.sha1(obj);
hash.MD5(obj);
hash.keys(obj);
```

## License

MIT
