export interface HashOptions {
  algorithm?: 'sha1' | 'sha256' | 'sha512' | 'md5' | 'passthrough';
  encoding?: 'hex' | 'base64' | 'buffer' | 'binary';
  excludeKeys?: (key: string) => boolean;
  excludeValues?: boolean;
  ignoreUnknown?: boolean;
  respectType?: boolean;
  respectFunctionNames?: boolean;
  respectFunctionProperties?: boolean;
  unorderedArrays?: boolean;
  unorderedSets?: boolean;
  unorderedObjects?: boolean;
  replacer?: (value: unknown) => unknown;
}

export type Algorithm = NonNullable<HashOptions['algorithm']>;
export type Encoding = NonNullable<HashOptions['encoding']>;
