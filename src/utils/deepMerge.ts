type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Deep-merge `source` into `target`. Arrays are NOT merged — source arrays
 * replace target arrays. Returns a new object (immutable).
 */
export function deepMerge<T extends PlainObject>(target: T, source: Partial<T>): T {
  const result: PlainObject = { ...target };

  for (const key of Object.keys(source) as Array<keyof T>) {
    const sourceVal = source[key];
    const targetVal = result[key as string];

    if (isPlainObject(sourceVal) && isPlainObject(targetVal)) {
      result[key as string] = deepMerge(targetVal, sourceVal as PlainObject);
    } else if (sourceVal !== undefined) {
      result[key as string] = sourceVal;
    }
  }

  return result as T;
}
