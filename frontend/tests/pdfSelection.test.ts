import { describe, expect, it } from 'vitest';
import { addToRetrievedContext, cleanSelection } from '../src/pdfSelection';
import { emptyForm } from '../src/model';

describe('cleanSelection', () => {
  it('joins wrapped lines and collapses whitespace', () => {
    expect(cleanSelection('Annual plans have a\n 30-day   refund\nwindow.  ')).toBe('Annual plans have a 30-day refund window.');
  });

  it('re-joins words hyphenated at a line break and keeps hyphens within a line', () => {
    expect(cleanSelection('non-\nrefundable')).toBe('nonrefundable');
    expect(cleanSelection('a long-term plan')).toBe('a long-term plan');
  });
});

describe('addToRetrievedContext', () => {
  it('creates a new item for the file when none is active', () => {
    const f = addToRetrievedContext(emptyForm(), null, 'passage', 'manual.pdf');
    expect(f.expected_retrieved_context).toEqual([{ doc_uri: 'manual.pdf', content: 'passage' }]);
  });

  it('appends to the active item and keeps its doc_uri', () => {
    const base = { ...emptyForm(), expected_retrieved_context: [{ doc_uri: 'a.md', content: 'first' }, { doc_uri: 'b.md', content: '' }] };
    const f = addToRetrievedContext(base, 0, 'second', 'manual.pdf');
    expect(f.expected_retrieved_context[0]).toEqual({ doc_uri: 'a.md', content: 'first\n\nsecond' });
    expect(f.expected_retrieved_context[1]).toEqual(base.expected_retrieved_context[1]);
  });

  it('fills a blank doc_uri and sets empty content on the active item', () => {
    const base = { ...emptyForm(), expected_retrieved_context: [{ doc_uri: '', content: '' }] };
    const f = addToRetrievedContext(base, 0, 'text', 'manual.pdf');
    expect(f.expected_retrieved_context).toEqual([{ doc_uri: 'manual.pdf', content: 'text' }]);
  });

  it('creates a new item when the active index is stale', () => {
    const f = addToRetrievedContext(emptyForm(), 3, 'text', 'manual.pdf');
    expect(f.expected_retrieved_context).toHaveLength(1);
  });
});
