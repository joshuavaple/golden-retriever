import type { FormState, SourceKind } from '../model';

type Props = { source: FormState['source']; onChange: (s: FormState['source']) => void };

const KINDS: SourceKind[] = ['none', 'human', 'document', 'trace'];

export function SourceSelect({ source, onChange }: Props) {
  const set = (patch: Partial<FormState['source']>) => onChange({ ...source, ...patch });
  return (
    <div class="rows">
      <select aria-label="source type" value={source.kind} onChange={(e) => set({ kind: e.currentTarget.value as SourceKind })}>
        {KINDS.map((k) => <option value={k}>{k}</option>)}
      </select>
      {source.kind === 'human' && <input aria-label="user_name" placeholder="user_name" value={source.user_name} onInput={(e) => set({ user_name: e.currentTarget.value })} />}
      {source.kind === 'trace' && <input aria-label="trace_id" placeholder="trace_id" value={source.trace_id} onInput={(e) => set({ trace_id: e.currentTarget.value })} />}
      {source.kind === 'document' && (
        <>
          <input aria-label="source doc_uri" placeholder="doc_uri" value={source.doc_uri} onInput={(e) => set({ doc_uri: e.currentTarget.value })} />
          <textarea class="mono" aria-label="source content" placeholder="content (optional excerpt)" rows={3} value={source.content} onInput={(e) => set({ content: e.currentTarget.value })} />
        </>
      )}
    </div>
  );
}
