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

/** Puts the suggestion in expected_response. */
export const applyAnswer = (form: FormState, answer: string): FormState => ({ ...form, expected_response: answer });

/** The question the answer is written for: the trimmed `question` input. */
export const questionFromForm = (form: FormState): string => (form.inputs.find((r) => r.key === 'question')?.value ?? '').trim();

async function post<T>(path: string, body: unknown, pick: (r: Partial<T>) => string | undefined, signal?: AbortSignal): Promise<string> {
  let res: Response;
  try {
    res = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new Error(NO_BACKEND);
  }
  let json: (Partial<T> & { detail?: unknown }) | null = null;
  try {
    json = await res.json();
  } catch {
    // not JSON: the dev proxy answers like this when nothing is listening
  }
  if (!res.ok) {
    if (typeof json?.detail === 'string') throw new Error(json.detail);
    if (json === null) throw new Error(NO_BACKEND);
    throw new Error(`Suggestion request was rejected (HTTP ${res.status}).`);
  }
  const text = json && pick(json);
  if (!text) throw new Error('The backend returned an empty suggestion.');
  return text;
}

export const suggestQuestion = (chunks: Chunk[], previousQuestions: string[], signal?: AbortSignal) =>
  post<{ question: string }>('/api/suggest-question', { chunks, previous_questions: previousQuestions }, (r) => r.question, signal);

export const suggestAnswer = (question: string, chunks: Chunk[], signal?: AbortSignal) =>
  post<{ answer: string }>('/api/suggest-answer', { question, chunks }, (r) => r.answer, signal);
