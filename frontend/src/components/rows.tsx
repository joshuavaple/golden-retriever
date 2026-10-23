import type { KeyValue } from '../model';

type KVProps = { label: string; rows: KeyValue[]; onChange: (rows: KeyValue[]) => void; keyPlaceholder?: string };

export function KeyValueRows({ label, rows, onChange, keyPlaceholder = 'key' }: KVProps) {
  const set = (i: number, patch: Partial<KeyValue>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div class="rows">
      {rows.map((r, i) => (
        <div class="row" key={i}>
          <input aria-label={`${label} key ${i + 1}`} placeholder={keyPlaceholder} value={r.key} onInput={(e) => set(i, { key: e.currentTarget.value })} />
          <textarea aria-label={`${label} value ${i + 1}`} placeholder="value" rows={1} value={r.value} onInput={(e) => set(i, { value: e.currentTarget.value })} />
          <button type="button" aria-label={`Remove ${label} row ${i + 1}`} onClick={() => onChange(rows.filter((_, j) => j !== i))}>×</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...rows, { key: '', value: '' }])}>+ Add {label}</button>
    </div>
  );
}

type ListProps = { label: string; items: string[]; onChange: (items: string[]) => void };

export function StringListRows({ label, items, onChange }: ListProps) {
  return (
    <div class="rows">
      {items.map((v, i) => (
        <div class="row" key={i}>
          <input aria-label={`${label} ${i + 1}`} value={v} onInput={(e) => onChange(items.map((x, j) => (j === i ? e.currentTarget.value : x)))} />
          <button type="button" aria-label={`Remove ${label} ${i + 1}`} onClick={() => onChange(items.filter((_, j) => j !== i))}>×</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, ''])}>+ Add {label}</button>
    </div>
  );
}
