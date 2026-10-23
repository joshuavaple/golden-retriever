import { useMemo, useRef, useState } from 'preact/hooks';
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
import { Help } from './components/Help';
import { PdfViewer } from './components/PdfViewer';
import { Splitter } from './components/Splitter';
import { addToRetrievedContext } from './pdfSelection';

export function App() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [dataset, setDataset] = useState<EvalRecord[]>([]);
  // Last retrieved-context item the cursor was in; kept while focus is outside the form (e.g. in the PDF).
  // Width in px of the PDF pane once the user has dragged it; null keeps the default responsive width.
  const [pdfWidth, setPdfWidth] = useState<number | null>(null);
  const pdfPane = useRef<HTMLDivElement>(null);
  const [activeCtx, setActiveCtx] = useState<number | null>(null);
  const patch = (p: Partial<FormState>) => setForm((f) => ({ ...f, ...p }));

  const record = useMemo(() => serialize(form), [form]);
  const errors = useMemo(() => validateRecord(record), [record]);
  const grouped = groupErrors(errors, form.source.kind);
  const warnings = [factsAndResponseWarning(record), duplicateInputsWarning(record, dataset)].filter((w): w is string => w !== null);

  const addFromPdf = (text: string, fileName: string) => setForm((f) => addToRetrievedContext(f, activeCtx, text, fileName));

  const trackFocus = (e: FocusEvent) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('[data-ctx]');
    setActiveCtx(card ? Number(card.dataset.ctx) : null);
  };

  const add = () => {
    setDataset((d) => [...d, record]);
    setForm(emptyForm());
  };

  return (
    <div class="shell">
      <header>
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
      </header>
      <main>
        <div class="pane pane-pdf" ref={pdfPane} style={pdfWidth ? { flex: `0 0 ${pdfWidth}px` } : undefined}>
          <PdfViewer onAdd={addFromPdf} />
          <Splitter
            getWidth={() => pdfPane.current?.offsetWidth ?? 0}
            getMax={() => pdfPane.current?.parentElement?.clientWidth ?? 0}
            onResize={setPdfWidth}
          />
        </div>

        <div class="pane pane-form" onFocusIn={trackFocus}>
          <fieldset>
            <legend>inputs <small>(required; at least one key with a value)</small></legend>
            <Help id="inputs" />
            <KeyValueRows label="input" rows={form.inputs} onChange={(inputs) => patch({ inputs })} />
            <Errors items={grouped.inputs} />
          </fieldset>

          <fieldset>
            <legend>expectations</legend>
            <Help id="expectations" />
            <h4>expected_retrieved_context</h4>
            <Help id="expected_retrieved_context" />
            <ContextItems items={form.expected_retrieved_context} onChange={(expected_retrieved_context) => {
              if (expected_retrieved_context.length < form.expected_retrieved_context.length) setActiveCtx(null);
              patch({ expected_retrieved_context });
            }} />
            <h4>expected_facts</h4>
            <Help id="expected_facts" />
            <StringListRows label="fact" items={form.expected_facts} onChange={(expected_facts) => patch({ expected_facts })} />
            <h4>expected_response</h4>
            <Help id="expected_response" />
            <textarea aria-label="expected_response" rows={3} value={form.expected_response} onInput={(e) => patch({ expected_response: e.currentTarget.value })} />
            <h4>guidelines</h4>
            <Help id="guidelines" />
            <StringListRows label="guideline" items={form.guidelines} onChange={(guidelines) => patch({ guidelines })} />
            <Errors items={grouped.expectations} />
          </fieldset>

          <fieldset>
            <legend>tags</legend>
            <Help id="tags" />
            <KeyValueRows label="tag" rows={form.tags} onChange={(tags) => patch({ tags })} />
            <Errors items={grouped.tags} />
          </fieldset>

          <fieldset>
            <legend>source</legend>
            <Help id="source" />
            <SourceSelect source={form.source} onChange={(source) => patch({ source })} />
            <Errors items={grouped.source} />
          </fieldset>

          <Errors items={grouped.record} />
          <Warnings items={warnings} />
          <button type="button" class="primary" disabled={errors.length > 0} onClick={add}>Add record</button>
        </div>

        <div class="pane pane-preview">
          <Preview title="Current record" json={record} filename="record.json" />
          <Preview title={`Dataset (${dataset.length})`} json={dataset} filename="dataset.json" />
        </div>
      </main>
    </div>
  );
}
