import type { FormState } from './model';

export type Chunk = { text: string; doc_uri?: string };

const NO_BACKEND = 'Could not reach the backend. Start it with `uv run uvicorn app.main:app` in backend/ (the rest of the tool works without it).';

/** The selected passages the AI reads: every non-blank retrieved-context item. */
export function chunksFromForm(form: FormState): Chunk[] {
  return form.expected_retrieved_context
    .filter((c) => c.content.trim())
    .map((c) => (c.doc_uri.trim() ? { text: c.content.trim(), doc_uri: c.doc_uri.trim() } : { text: c.content.trim() }));
}

/** Puts the suggestion in the `question` input, creating the row if the user removed it. */
export function applyQuestion(form: FormState, question: string): FormState {
  const i = form.inputs.findIndex((r) => r.key === 'question');
  const inputs = i >= 0 ? form.inputs.map((r, j) => (j === i ? { ...r, value: question } : r)) : [...form.inputs, { key: 'question', value: question }];
  return { ...form, inputs };
}

export async function suggestQuestion(chunks: Chunk[], previousQuestions: string[], signal?: AbortSignal): Promise<string> {
  let res: Response;
  try {
    res = await fetch('/api/suggest-question', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chunks, previous_questions: previousQuestions }),
      signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new Error(NO_BACKEND);
  }
  let body: { question?: string; detail?: unknown } | null = null;
  try {
    body = await res.json();
  } catch {
    // not JSON: the dev proxy answers like this when nothing is listening
  }
  if (!res.ok) {
    if (typeof body?.detail === 'string') throw new Error(body.detail);
    if (body === null) throw new Error(NO_BACKEND);
    throw new Error(`Suggestion request was rejected (HTTP ${res.status}).`);
  }
  if (!body?.question) throw new Error('The backend returned no question.');
  return body.question;
}
