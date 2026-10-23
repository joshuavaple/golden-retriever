import { useMemo, useState } from 'preact/hooks';
import { emptyForm, type FormState } from './model';
import { serialize, type EvalRecord } from './serialize';
import { validateRecord } from './schema';
import { groupErrors } from './errors';
import { duplicateInputsWarning, factsAndResponseWarning } from './warnings';
import { KeyValueRows, StringListRows } from './components/rows';
import { ContextItems } from './components/ContextItems';
import { SourceSelect } from './components/SourceSelect';
import { Preview } from './components/Preview';
import { Errors, Warnings } from './components/Messages';

export function App() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [dataset, setDataset] = useState<EvalRecord[]>([]);
  const patch = (p: Partial<FormState>) => setForm((f) => ({ ...f, ...p }));

  const record = useMemo(() => serialize(form), [form]);
  const errors = useMemo(() => validateRecord(record), [record]);
  const grouped = groupErrors(errors, form.source.kind);
  const warnings = [factsAndResponseWarning(record), duplicateInputsWarning(record, dataset)].filter((w): w is string => w !== null);

  const add = () => {
    setDataset((d) => [...d, record]);
    setForm(emptyForm());
  };

  return (
    <main>
      <div class="pane">
        <h1>
          <svg class="paw" viewBox="0 0 32 32" aria-hidden="true">
            <ellipse cx="6.5" cy="14" rx="3" ry="4" />
            <ellipse cx="13" cy="8" rx="3" ry="4.2" />
            <ellipse cx="19" cy="8" rx="3" ry="4.2" />
            <ellipse cx="25.5" cy="14" rx="3" ry="4" />
            <path d="M16 15c-4.5 0-8 4-8 7.5 0 2.5 2 4 4 4 1.4 0 2.6-.8 4-.8s2.6.8 4 .8c2 0 4-1.5 4-4C24 19 20.5 15 16 15z" />
          </svg>
          golden-retriever
        </h1>
        <fieldset>
          <legend>inputs <small>(required; at least one key with a value)</small></legend>
          <KeyValueRows label="input" rows={form.inputs} onChange={(inputs) => patch({ inputs })} />
          <Errors items={grouped.inputs} />
        </fieldset>

        <fieldset>
          <legend>expectations</legend>
          <h4>expected_facts</h4>
          <p class="help">Checks what the answer says. List only facts strictly required; they can be derived conclusions that appear in no single passage.</p>
          <StringListRows label="fact" items={form.expected_facts} onChange={(expected_facts) => patch({ expected_facts })} />
          <h4>expected_response</h4>
          <textarea aria-label="expected_response" rows={3} value={form.expected_response} onInput={(e) => patch({ expected_response: e.currentTarget.value })} />
          <h4>guidelines</h4>
          <StringListRows label="guideline" items={form.guidelines} onChange={(guidelines) => patch({ guidelines })} />
          <h4>expected_retrieved_context</h4>
          <p class="help">Checks what the retriever returned, not what the answer says.</p>
          <ContextItems items={form.expected_retrieved_context} onChange={(expected_retrieved_context) => patch({ expected_retrieved_context })} />
          <Errors items={grouped.expectations} />
        </fieldset>

        <fieldset>
          <legend>tags</legend>
          <KeyValueRows label="tag" rows={form.tags} onChange={(tags) => patch({ tags })} />
          <Errors items={grouped.tags} />
        </fieldset>

        <fieldset>
          <legend>source</legend>
          <SourceSelect source={form.source} onChange={(source) => patch({ source })} />
          <Errors items={grouped.source} />
        </fieldset>

        <Errors items={grouped.record} />
        <Warnings items={warnings} />
        <button type="button" class="primary" disabled={errors.length > 0} onClick={add}>Add record</button>
      </div>

      <div class="pane">
        <Preview title="Current record" json={record} filename="record.json" />
        <Preview title={`Dataset (${dataset.length})`} json={dataset} filename="dataset.json" />
      </div>
    </main>
  );
}
