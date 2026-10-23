import type { ContextItem } from '../model';

type Props = { items: ContextItem[]; onChange: (items: ContextItem[]) => void };

export function ContextItems({ items, onChange }: Props) {
  const set = (i: number, patch: Partial<ContextItem>) => onChange(items.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  return (
    <div class="rows">
      {items.map((c, i) => (
        <div class="card" key={i}>
          <input aria-label={`doc_uri ${i + 1}`} placeholder="doc_uri (e.g. s3://bucket/doc.md)" value={c.doc_uri} onInput={(e) => set(i, { doc_uri: e.currentTarget.value })} />
          <textarea class="mono" aria-label={`content ${i + 1}`} placeholder="content (Markdown)" rows={5} value={c.content} onInput={(e) => set(i, { content: e.currentTarget.value })} />
          <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))}>Remove item</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { doc_uri: '', content: '' }])}>+ Add retrieved context</button>
    </div>
  );
}
