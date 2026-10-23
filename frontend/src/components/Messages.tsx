export const Errors = ({ items }: { items: string[] }) =>
  items.length ? <ul class="errors" role="alert">{items.map((m) => <li>{m}</li>)}</ul> : null;

export const Warnings = ({ items }: { items: string[] }) =>
  items.length ? <ul class="warnings">{items.map((m) => <li>{m}</li>)}</ul> : null;
