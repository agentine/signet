import type { HashOptions } from './types.js';

const nativeFnRe = /^function\s+\w*\s*\(\s*\)\s*{\s+\[native code\]\s+}$/i;

function isNativeFunction(f: unknown): boolean {
  if (typeof f !== 'function') return false;
  return nativeFnRe.test(Function.prototype.toString.call(f));
}

interface ResolvedOptions {
  excludeKeys?: (key: string) => boolean;
  excludeValues: boolean;
  respectType: boolean;
  respectFunctionNames: boolean;
  respectFunctionProperties: boolean;
  unorderedArrays: boolean;
  unorderedSets: boolean;
  unorderedObjects: boolean;
  replacer?: (value: unknown) => unknown;
}

function resolveOptions(options: HashOptions): ResolvedOptions {
  return {
    excludeKeys: options.excludeKeys,
    excludeValues: options.excludeValues ? true : false,
    respectType: options.respectType === false ? false : true,
    respectFunctionNames: options.respectFunctionNames === false ? false : true,
    respectFunctionProperties: options.respectFunctionProperties === false ? false : true,
    unorderedArrays: options.unorderedArrays === true ? true : false,
    unorderedSets: options.unorderedSets === false ? false : true,
    unorderedObjects: options.unorderedObjects === false ? false : true,
    replacer: options.replacer,
  };
}

export function serialize(value: unknown, options: HashOptions = {}): string {
  const opts = resolveOptions(options);
  const buf: string[] = [];
  const write = (s: string) => { buf.push(s); };
  createDispatcher(opts, write, []).dispatch(value);
  return buf.join('');
}

interface Dispatcher {
  dispatch(value: unknown): void;
  _array(arr: unknown, unordered?: boolean): void;
  _object(obj: unknown): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: ((...args: any[]) => void) | undefined;
}

function createDispatcher(
  opts: ResolvedOptions,
  write: (s: string) => void,
  context: object[],
): Dispatcher {
  const self: Dispatcher = {
    dispatch(value: unknown): void {
      if (opts.replacer) {
        value = opts.replacer(value);
      }
      let type: string = typeof value;
      if (value === null) {
        type = 'null';
      }
      const handler = self['_' + type];
      if (handler) {
        handler(value);
      }
    },

    _object(object: unknown): void {
      const obj = object as Record<string, unknown>;
      const pattern = /\[object (.*)\]/i;
      const objString = Object.prototype.toString.call(obj);
      const match = pattern.exec(objString);
      let objType: string;
      if (!match) {
        objType = 'unknown:[' + objString + ']';
      } else {
        objType = match[1];
      }
      objType = objType.toLowerCase();

      const objectNumber = context.indexOf(obj);
      if (objectNumber >= 0) {
        self.dispatch('[CIRCULAR:' + objectNumber + ']');
        return;
      }
      context.push(obj);

      if (typeof Buffer !== 'undefined' && Buffer.isBuffer && Buffer.isBuffer(obj)) {
        write('buffer:');
        write((obj as Buffer).toString());
        return;
      }

      if (objType !== 'object' && objType !== 'function' && objType !== 'asyncfunction') {
        const handler = self['_' + objType];
        if (handler) {
          handler(obj);
        } else {
          throw new Error('Unknown object type "' + objType + '"');
        }
      } else {
        let keys = Object.keys(obj);
        if (opts.unorderedObjects) {
          keys = keys.sort();
        }
        if (opts.respectType && !isNativeFunction(obj)) {
          keys = ['prototype', '__proto__', 'constructor', ...keys];
        }
        if (opts.excludeKeys) {
          const excludeKeys = opts.excludeKeys;
          keys = keys.filter((key) => !excludeKeys(key));
        }

        write('object:' + keys.length + ':');
        for (const key of keys) {
          self.dispatch(key);
          write(':');
          if (!opts.excludeValues) {
            self.dispatch((obj as Record<string, unknown>)[key]);
          }
          write(',');
        }
      }
    },

    _array(arr: unknown, unordered?: boolean): void {
      const a = arr as unknown[];
      if (unordered === undefined) {
        unordered = opts.unorderedArrays;
      }

      write('array:' + a.length + ':');
      if (!unordered || a.length <= 1) {
        a.forEach((entry) => {
          self.dispatch(entry);
        });
        return;
      }

      // Unordered: serialize each element independently, sort, re-serialize as string array
      const contextAdditions: object[] = [];
      const entries = a.map((entry) => {
        const localBuf: string[] = [];
        const localWrite = (s: string) => { localBuf.push(s); };
        const localContext = context.slice();
        const localDispatcher = createDispatcher(opts, localWrite, localContext);
        localDispatcher.dispatch(entry);
        const added = localContext.slice(context.length);
        contextAdditions.push(...added);
        return localBuf.join('');
      });
      context.push(...contextAdditions);
      entries.sort();
      self._array(entries, false);
    },

    _date(date: unknown): void {
      write('date:' + (date as Date).toJSON());
    },

    _symbol(sym: unknown): void {
      write('symbol:' + (sym as symbol).toString());
    },

    _error(err: unknown): void {
      write('error:' + (err as Error).toString());
    },

    _boolean(bool: unknown): void {
      write('bool:' + String(bool));
    },

    _string(string: unknown): void {
      const s = String(string);
      write('string:' + s.length + ':');
      write(s);
    },

    _function(fn: unknown): void {
      const f = fn as Function;
      write('fn:');
      if (isNativeFunction(f)) {
        self.dispatch('[native]');
      } else {
        self.dispatch(f.toString());
      }
      if (opts.respectFunctionNames) {
        self.dispatch('function-name:' + String(f.name));
      }
      if (opts.respectFunctionProperties) {
        self._object(f);
      }
    },

    _number(number: unknown): void {
      write('number:' + String(number));
    },

    _null(): void {
      write('Null');
    },

    _undefined(): void {
      write('Undefined');
    },

    _regexp(regex: unknown): void {
      write('regex:' + (regex as RegExp).toString());
    },

    _uint8array(arr: unknown): void {
      write('uint8array:');
      self.dispatch(Array.prototype.slice.call(arr as Uint8Array));
    },

    _uint8clampedarray(arr: unknown): void {
      write('uint8clampedarray:');
      self.dispatch(Array.prototype.slice.call(arr as Uint8ClampedArray));
    },

    _int8array(arr: unknown): void {
      write('int8array:');
      self.dispatch(Array.prototype.slice.call(arr as Int8Array));
    },

    _uint16array(arr: unknown): void {
      write('uint16array:');
      self.dispatch(Array.prototype.slice.call(arr as Uint16Array));
    },

    _int16array(arr: unknown): void {
      write('int16array:');
      self.dispatch(Array.prototype.slice.call(arr as Int16Array));
    },

    _uint32array(arr: unknown): void {
      write('uint32array:');
      self.dispatch(Array.prototype.slice.call(arr as Uint32Array));
    },

    _int32array(arr: unknown): void {
      write('int32array:');
      self.dispatch(Array.prototype.slice.call(arr as Int32Array));
    },

    _float32array(arr: unknown): void {
      write('float32array:');
      self.dispatch(Array.prototype.slice.call(arr as Float32Array));
    },

    _float64array(arr: unknown): void {
      write('float64array:');
      self.dispatch(Array.prototype.slice.call(arr as Float64Array));
    },

    _arraybuffer(arr: unknown): void {
      write('arraybuffer:');
      self.dispatch(new Uint8Array(arr as ArrayBuffer));
    },

    _url(url: unknown): void {
      write('url:' + (url as URL).toString());
    },

    _map(map: unknown): void {
      write('map:');
      const arr = Array.from(map as Map<unknown, unknown>);
      self._array(arr, opts.unorderedSets);
    },

    _set(set: unknown): void {
      write('set:');
      const arr = Array.from(set as Set<unknown>);
      self._array(arr, opts.unorderedSets);
    },

    _bigint(number: unknown): void {
      write('bigint:' + String(number));
    },

    _xml(xml: unknown): void {
      write('xml:' + String(xml));
    },

    _domwindow(): void { write('domwindow'); },
    _process(): void { write('process'); },
    _timer(): void { write('timer'); },
    _pipe(): void { write('pipe'); },
    _tcp(): void { write('tcp'); },
    _udp(): void { write('udp'); },
    _tty(): void { write('tty'); },
    _statwatcher(): void { write('statwatcher'); },
    _securecontext(): void { write('securecontext'); },
    _connection(): void { write('connection'); },
    _zlib(): void { write('zlib'); },
    _context(): void { write('context'); },
    _nodescript(): void { write('nodescript'); },
    _httpparser(): void { write('httpparser'); },
    _dataview(): void { write('dataview'); },
    _signal(): void { write('signal'); },
    _fsevent(): void { write('fsevent'); },
    _tlswrap(): void { write('tlswrap'); },
  };

  return self;
}
