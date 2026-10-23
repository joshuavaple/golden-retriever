import { describe, expect, it } from 'vitest';
import { validateRecord } from '../src/schema';
import { serialize } from '../src/serialize';
import { emptyForm, type FormState } from '../src/model';
import { duplicateInputsWarning, factsAndResponseWarning } from '../src/warnings';

const minimal = { inputs: { question: 'How long do I have to request a refund on an annual plan?' } };
const full = {
  inputs: { question: 'How long do I have to request a refund on an annual plan?' },
  expectations: {
    expected_facts: ['Annual plans have a 30-day refund window'],
    guidelines: ['The response must cite the refund policy'],
    expected_retrieved_context: [
      {
        doc_uri: 's3://example-bucket/docs/refund-policy.md',
        content: '| Plan | Refund window |\n|---|---|\n| Annual | 30 days |\n| Monthly | none |',
      },
    ],
  },
  tags: { topic: 'billing' },
  source: { human: { user_name: 'jane.doe@example.com' } },
};

describe('schema', () => {
  it('accepts the minimal and full examples', () => {
    expect(validateRecord(minimal)).toEqual([]);
    expect(validateRecord(full)).toEqual([]);
  });

  it.each([
    ['empty inputs', { inputs: {} }],
    ['empty expectations', { inputs: { q: 'x' }, expectations: {} }],
    ['blank fact', { inputs: { q: 'x' }, expectations: { expected_facts: [''] } }],
    ['context without doc_uri', { inputs: { q: 'x' }, expectations: { expected_retrieved_context: [{ content: 'c' }] } }],
    ['two source types', { inputs: { q: 'x' }, source: { human: { user_name: 'a' }, trace: { trace_id: 't' } } }],
    ['MLflow-assigned field', { inputs: { q: 'x' }, create_time: 1 }],
  ])('rejects %s', (_name, record) => {
    expect(validateRecord(record).length).toBeGreaterThan(0);
  });
});

describe('serialize', () => {
  const filled = (): FormState => {
    const f = emptyForm();
    f.inputs[0].value = minimal.inputs.question;
    return f;
  };

  it('produces the minimal example and drops every blank optional field', () => {
    const f = filled();
    f.expected_facts = ['', '  '];
    f.guidelines = [''];
    f.expected_response = '  ';
    f.expected_retrieved_context = [{ doc_uri: '', content: '' }];
    f.tags = [{ key: '', value: '' }, { key: 'k', value: '' }];
    f.inputs.push({ key: '', value: '' });
    expect(serialize(f)).toEqual(minimal);
  });

  it('produces the full example', () => {
    const f = filled();
    f.expected_facts = full.expectations.expected_facts;
    f.guidelines = full.expectations.guidelines;
    f.expected_retrieved_context = full.expectations.expected_retrieved_context;
    f.tags = [{ key: 'topic', value: 'billing' }];
    f.source.kind = 'human';
    f.source.user_name = 'jane.doe@example.com';
    expect(serialize(f)).toEqual(full);
    expect(validateRecord(serialize(f))).toEqual([]);
  });

  it('omits blank context content but keeps the doc_uri', () => {
    const f = filled();
    f.expected_retrieved_context = [{ doc_uri: 'a.md', content: '' }];
    expect(serialize(f).expectations).toEqual({ expected_retrieved_context: [{ doc_uri: 'a.md' }] });
  });

  it('yields an invalid record for a selected source with blank fields', () => {
    const f = filled();
    f.source.kind = 'trace';
    expect(validateRecord(serialize(f)).length).toBeGreaterThan(0);
  });
});

describe('warnings', () => {
  it('warns when facts and response are both set', () => {
    expect(factsAndResponseWarning({ inputs: {}, expectations: { expected_facts: ['a'], expected_response: 'b' } })).not.toBeNull();
    expect(factsAndResponseWarning(minimal)).toBeNull();
  });

  it('warns on duplicate inputs', () => {
    expect(duplicateInputsWarning(minimal, [full])).not.toBeNull();
    expect(duplicateInputsWarning(minimal, [])).toBeNull();
  });
});
