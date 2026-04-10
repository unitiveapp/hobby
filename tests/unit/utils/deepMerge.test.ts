import { describe, it, expect } from 'vitest';
import { deepMerge } from '../../../src/utils/deepMerge';

describe('deepMerge', () => {
  it('merges flat objects', () => {
    const result = deepMerge({ a: 1, b: 2 }, { b: 3, c: 4 });
    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('deep-merges nested objects', () => {
    const result = deepMerge(
      { nested: { a: 1, b: 2 } },
      { nested: { b: 99 } }
    );
    expect(result.nested).toEqual({ a: 1, b: 99 });
  });

  it('source arrays replace target arrays (not concat)', () => {
    const result = deepMerge({ arr: [1, 2] }, { arr: [3] });
    expect(result.arr).toEqual([3]);
  });

  it('does not mutate target', () => {
    const target = { a: 1 };
    deepMerge(target, { a: 2 });
    expect(target.a).toBe(1);
  });

  it('skips undefined source values', () => {
    const result = deepMerge({ a: 1 }, { a: undefined });
    expect(result.a).toBe(1);
  });
});
