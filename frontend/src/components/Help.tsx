import { HELP, type FieldHelp, type HelpKey } from '../help';

export function Help({ id }: { id: HelpKey }) {
  const h: FieldHelp = HELP[id];
  return (
    <p class="help">
      {h.text}
      {h.usedBy && <> Used by the {h.usedBy}.</>}
      {h.tip && <> {h.tip}</>}{' '}
      <a href={h.href} target="_blank" rel="noreferrer">{h.docs}</a>
    </p>
  );
}
