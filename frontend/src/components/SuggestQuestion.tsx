import { useState } from 'preact/hooks';
import type { Chunk } from '../suggest';
import { suggestQuestion } from '../suggest';

type Props = {
  chunks: Chunk[];
  /** Suggestions already made for this record; sent so a re-click asks something different. */
  previous: string[];
  onSuggest: (question: string) => void;
};

export function SuggestQuestion({ chunks, previous, onSuggest }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const empty = chunks.length === 0;

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      onSuggest(await suggestQuestion(chunks, previous.slice(-5)));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div class="suggest">
      <button type="button" onClick={run} disabled={empty || busy} title={empty ? 'Add passages from the PDF first' : undefined}>
        {busy ? 'Thinking…' : previous.length ? '↻ Regenerate question' : '✨ Suggest question'}
      </button>
      {error && <p class="errors" role="alert">{error}</p>}
    </div>
  );
}
