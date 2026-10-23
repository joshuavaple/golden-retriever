import type { FormState, KeyValue } from './model';

export type EvalRecord = Record<string, unknown>;

const nonBlank = (s: string) => s.trim() !== '';

function kvObject(rows: KeyValue[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { key, value } of rows) {
    if (nonBlank(key) && nonBlank(value)) out[key.trim()] = value;
  }
  return out;
}

/** Form state -> MLflow record. Blank optional fields are omitted entirely. */
export function serialize(form: FormState): EvalRecord {
  const record: EvalRecord = { inputs: kvObject(form.inputs) };

  const expectations: Record<string, unknown> = {};
  const facts = form.expected_facts.filter(nonBlank);
  if (facts.length) expectations.expected_facts = facts;
  if (nonBlank(form.expected_response)) expectations.expected_response = form.expected_response;
  const guidelines = form.guidelines.filter(nonBlank);
  if (guidelines.length) expectations.guidelines = guidelines;
  const contexts = form.expected_retrieved_context
    .filter((c) => nonBlank(c.doc_uri) || nonBlank(c.content))
    .map((c) => (nonBlank(c.content) ? { doc_uri: c.doc_uri, content: c.content } : { doc_uri: c.doc_uri }));
  if (contexts.length) expectations.expected_retrieved_context = contexts;
  if (Object.keys(expectations).length) record.expectations = expectations;

  const tags = kvObject(form.tags);
  if (Object.keys(tags).length) record.tags = tags;

  const s = form.source;
  if (s.kind === 'human') record.source = { human: { user_name: s.user_name } };
  else if (s.kind === 'trace') record.source = { trace: { trace_id: s.trace_id } };
  else if (s.kind === 'document') {
    record.source = { document: nonBlank(s.content) ? { doc_uri: s.doc_uri, content: s.content } : { doc_uri: s.doc_uri } };
  }

  return record;
}
