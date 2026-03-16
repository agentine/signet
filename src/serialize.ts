import type { HashOptions } from './types.js';

export function serialize(value: unknown, options: HashOptions = {}): string {
  const seen = new WeakSet();
  const {
    excludeKeys,
    excludeValues = false,
    respectType = true,
    respectFunctionNames = true,
    respectFunctionProperties = true,
    unorderedArrays = false,
    unorderedSets = true,
    unorderedObjects = true,
    replacer,
  } = options;

  function _serialize(val: unknown): string {
    if (replacer) {
      val = replacer(val);
    }

    if (val === null) return 'Null:';
    if (val === undefined) return 'Undefined:';

    if (typeof val === 'boolean') return 'Boolean:' + (val ? 'true' : 'false');

    if (typeof val === 'number') {
      if (Object.is(val, -0)) return 'Number:-0';
      return 'Number:' + val;
    }

    if (typeof val === 'bigint') return 'BigInt:' + val;

    if (typeof val === 'string') return 'String:' + val;

    if (typeof val === 'symbol') return 'Symbol:' + val.toString();

    if (typeof val === 'function') {
      let out = 'Function:';
      if (respectFunctionNames) {
        out += val.name + ':';
      }
      out += val.toString();
      if (respectFunctionProperties) {
        out += _serializeObject(val as unknown as Record<string, unknown>);
      }
      return out;
    }

    if (typeof val === 'object') {
      if (seen.has(val as object)) return 'Circular';
      seen.add(val as object);

      try {
        if (val instanceof Date) return 'Date:' + val.toJSON();
        if (val instanceof RegExp) return 'RegExp:' + val.toString();
        if (val instanceof Error) {
          return 'Error:' + val.name + ':' + val.message;
        }
        if (val instanceof URL) return 'URL:' + val.toString();

        if (val instanceof Set) {
          const items = Array.from(val).map(_serialize);
          if (unorderedSets) items.sort();
          return 'Set:[' + items.join(',') + ']';
        }

        if (val instanceof Map) {
          const entries = Array.from(val.entries()).map(
            ([k, v]) => _serialize(k) + ':' + _serialize(v)
          );
          entries.sort();
          return 'Map:{' + entries.join(',') + '}';
        }

        if (ArrayBuffer.isView(val)) {
          const typeName = respectType ? val.constructor.name + ':' : '';
          const bytes =
            val instanceof Uint8Array
              ? val
              : new Uint8Array(val.buffer as ArrayBuffer, val.byteOffset, val.byteLength);
          return typeName + 'ArrayBuffer:[' + bytes.join(',') + ']';
        }

        if (val instanceof ArrayBuffer) {
          const bytes = new Uint8Array(val);
          return 'ArrayBuffer:[' + bytes.join(',') + ']';
        }

        if (Array.isArray(val)) {
          return _serializeArray(val);
        }

        return _serializeObject(val as Record<string, unknown>);
      } finally {
        seen.delete(val as object);
      }
    }

    return 'Unknown:' + String(val);
  }

  function _serializeArray(arr: unknown[]): string {
    if (excludeValues) {
      return 'Array:[' + arr.map((_, i) => 'Number:' + i).join(',') + ']';
    }
    const items = arr.map((item, i) => {
      if (!(i in arr)) return 'Undefined:'; // sparse
      return _serialize(item);
    });
    if (unorderedArrays) {
      items.sort();
    }
    return 'Array:[' + items.join(',') + ']';
  }

  function _serializeObject(obj: Record<string, unknown>): string {
    let keys = Object.keys(obj);
    if (excludeKeys) {
      keys = keys.filter((k) => !excludeKeys(k));
    }
    if (unorderedObjects) {
      keys.sort();
    }

    const typeName =
      respectType && obj.constructor && obj.constructor.name !== 'Object'
        ? obj.constructor.name + ':'
        : '';

    const entries = keys.map((k) => {
      if (excludeValues) return 'String:' + k;
      return 'String:' + k + ':' + _serialize(obj[k]);
    });

    return typeName + 'Object:{' + entries.join(',') + '}';
  }

  return _serialize(value);
}
