import { describe, expect, it } from 'vitest';
import { ENABLE_ALL_SOURCE_TYPES, sourceKinds } from '../src/config';

describe('sourceKinds', () => {
  it('offers only human while the other source types are hidden', () => {
    expect(sourceKinds(false)).toEqual(['human']);
  });

  it('offers every type once enabled', () => {
    expect(sourceKinds(true)).toEqual(['none', 'human', 'document', 'trace']);
  });

  it('ships with the other types hidden', () => {
    expect(ENABLE_ALL_SOURCE_TYPES).toBe(false);
  });
});
