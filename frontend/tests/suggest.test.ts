import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyAnswer, applyQuestion, chunksFromForm, questionFromForm, suggestAnswer, suggestQuestion } from '../src/suggest';
import { emptyForm } from '../src/model';

afterEach(() => vi.unstubAllGlobals());

describe('chunksFromForm', () => {
  it('sends only non-blank retrieved contexts, with their doc_uri', () => {
    const f = { ...emptyForm(), expected_retrieved_context: [{ doc_uri: 'a.pdf', content: ' one ' }, { doc_uri: 'b.pdf', content: '  ' }, { doc_uri: '', content: 'two' }] };
    expect(chunksFromForm(f)).toEqual([{ text: 'one', doc_uri: 'a.pdf' }, { text: 'two' }]);
  });
});

describe('applyQuestion', () => {
  it('fills the row keyed "question"', () => {
    const f = applyQuestion(emptyForm(), 'Why?');
    expect(f.inputs).toEqual([{ key: 'question', value: 'Why?' }]);
  });

  it('replaces the previous suggestion in place', () => {
    const f = applyQuestion(applyQuestion(emptyForm(), 'one?'), 'two?');
    expect(f.inputs).toEqual([{ key: 'question', value: 'two?' }]);
  });

  it('keeps other input rows', () => {
    const base = { ...emptyForm(), inputs: [{ key: 'lang', value: 'en' }, { key: 'question', value: '' }] };
    expect(applyQuestion(base, 'Q?').inputs).toEqual([{ key: 'lang', value: 'en' }, { key: 'question', value: 'Q?' }]);
  });

  it('adds a question row when none exists', () => {
    const base = { ...emptyForm(), inputs: [{ key: 'lang', value: 'en' }] };
    expect(applyQuestion(base, 'Q?').inputs).toEqual([{ key: 'lang', value: 'en' }, { key: 'question', value: 'Q?' }]);
  });
});

describe('suggestQuestion', () => {
  const ok = (body: unknown, status = 200) => vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));

  it('posts chunks and previous questions and returns the question', async () => {
    const fetchMock = ok({ question: 'Q?' });
    vi.stubGlobal('fetch', fetchMock);
    await expect(suggestQuestion([{ text: 't' }], ['old?'])).resolves.toBe('Q?');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/suggest-question');
    expect(JSON.parse(init.body)).toEqual({ chunks: [{ text: 't' }], previous_questions: ['old?'] });
  });

  it('surfaces the backend detail message on errors', async () => {
    vi.stubGlobal('fetch', ok({ detail: 'Azure OpenAI is not configured' }, 503));
    await expect(suggestQuestion([{ text: 't' }], [])).rejects.toThrow('Azure OpenAI is not configured');
  });

  it('explains when the backend is not running', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(suggestQuestion([{ text: 't' }], [])).rejects.toThrow(/backend/i);
  });

  it('explains a proxy error when the backend is down in dev (non-JSON 5xx)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })));
    await expect(suggestQuestion([{ text: 't' }], [])).rejects.toThrow(/backend/i);
  });
});

describe('questionFromForm', () => {
  it('reads the trimmed value of the "question" input', () => {
    const f = { ...emptyForm(), inputs: [{ key: 'lang', value: 'en' }, { key: 'question', value: '  Why?  ' }] };
    expect(questionFromForm(f)).toBe('Why?');
  });

  it('is empty when there is no question row or it is blank', () => {
    expect(questionFromForm(emptyForm())).toBe('');
    expect(questionFromForm({ ...emptyForm(), inputs: [{ key: 'lang', value: 'en' }] })).toBe('');
  });
});

describe('applyAnswer', () => {
  it('replaces expected_response and leaves the rest alone', () => {
    const base = { ...emptyForm(), expected_response: 'old', expected_facts: ['f'] };
    const f = applyAnswer(base, 'new answer');
    expect(f.expected_response).toBe('new answer');
    expect(f.expected_facts).toEqual(['f']);
  });
});

describe('suggestAnswer', () => {
  it('posts the question and chunks and returns the answer', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ answer: 'A.' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(suggestAnswer('Q?', [{ text: 't' }])).resolves.toBe('A.');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/suggest-answer');
    expect(JSON.parse(init.body)).toEqual({ question: 'Q?', chunks: [{ text: 't' }] });
  });

  it('surfaces the backend detail message on errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: 'Model call failed: x' }), { status: 502 })));
    await expect(suggestAnswer('Q?', [{ text: 't' }])).rejects.toThrow('Model call failed: x');
  });

  it('explains when the backend is not running', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(suggestAnswer('Q?', [{ text: 't' }])).rejects.toThrow(/backend/i);
  });
});
