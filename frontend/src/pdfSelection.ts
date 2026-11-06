import type { FormState } from './model';

/** Turns raw selected PDF text into a single readable passage. */
export function cleanSelection(raw: string): string {
  return raw
    .replace(/(\p{L})-\s*\n\s*(?=\p{Ll})/gu, '$1') // re-join words hyphenated across lines
    .replace(/\s*\n\s*/g, ' ')
    .replace(/[ \t ]+/g, ' ')
    .trim();
}

/**
 * Adds a selected passage to expected_retrieved_context. Appends to the item at
 * `activeIndex` when there is one, otherwise creates a new item for `fileName`.
 */
export function addToRetrievedContext(form: FormState, activeIndex: number | null, text: string, fileName: string): FormState {
  const items = form.expected_retrieved_context;
  if (activeIndex !== null && activeIndex >= 0 && activeIndex < items.length) {
    const next = items.map((c, i) => {
      if (i !== activeIndex) return c;
      const content = c.content.trim() ? `${c.content.replace(/\s+$/, '')}\n\n${text}` : text;
      return { doc_uri: c.doc_uri.trim() ? c.doc_uri : fileName, content };
    });
    return { ...form, expected_retrieved_context: next };
  }
  return { ...form, expected_retrieved_context: [...items, { doc_uri: fileName, content: text }] };
}
