import { describe, expect, it } from 'vitest';
import { validateRecord } from '../src/schema';
import { groupErrors } from '../src/errors';

describe('groupErrors', () => {
  it('groups errors by section', () => {
    const g = groupErrors(validateRecord({ inputs: {}, tags: {} }), 'none');
    expect(g.inputs.length).toBeGreaterThan(0);
    expect(g.tags.length).toBeGreaterThan(0);
    expect(g.expectations).toEqual([]);
  });

  it('keeps only the selected source branch', () => {
    const g = groupErrors(validateRecord({ inputs: { q: 'x' }, source: { human: { user_name: '' } } }), 'human');
    expect(g.source.length).toBeGreaterThan(0);
    expect(g.source.join(' ')).not.toMatch(/'document'|'trace'/);
  });
});
