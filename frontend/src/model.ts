export type KeyValue = { key: string; value: string };
export type ContextItem = { doc_uri: string; content: string };
export type SourceKind = 'none' | 'human' | 'document' | 'trace';

export type FormState = {
  inputs: KeyValue[];
  expected_facts: string[];
  expected_response: string;
  guidelines: string[];
  expected_retrieved_context: ContextItem[];
  tags: KeyValue[];
  source: {
    kind: SourceKind;
    user_name: string;
    doc_uri: string;
    content: string;
    trace_id: string;
  };
};

export function emptyForm(): FormState {
  return {
    inputs: [{ key: 'question', value: '' }],
    expected_facts: [],
    expected_response: '',
    guidelines: [],
    expected_retrieved_context: [],
    tags: [],
    source: { kind: 'none', user_name: '', doc_uri: '', content: '', trace_id: '' },
  };
}
