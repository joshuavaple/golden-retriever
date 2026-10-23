import { useState } from 'preact/hooks';

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type Props = { title: string; json: unknown; filename: string };

export function Preview({ title, json, filename }: Props) {
  const [copied, setCopied] = useState(false);
  const text = JSON.stringify(json, null, 2);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <section>
      <header class="bar">
        <h3>{title}</h3>
        <span>
          <button type="button" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
          <button type="button" onClick={() => download(filename, text + '\n')}>Download</button>
        </span>
      </header>
      <pre aria-label={title}>{text}</pre>
    </section>
  );
}
