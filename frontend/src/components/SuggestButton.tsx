import { useState } from 'preact/hooks';

type Props = {
  idleLabel: string;
  repeatLabel: string;
  /** Why the button is disabled; undefined means it can be clicked. */
  disabledReason?: string;
  /** True once a suggestion was made for this record, so the label offers to regenerate. */
  repeated: boolean;
  /** Fetches a suggestion; the caller applies it to the form. */
  run: () => Promise<string>;
  onResult: (text: string) => void;
};

export function SuggestButton({ idleLabel, repeatLabel, disabledReason, repeated, run, onResult }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const click = async () => {
    setBusy(true);
    setError(null);
    try {
      onResult(await run());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div class="suggest">
      <button type="button" onClick={click} disabled={!!disabledReason || busy} title={disabledReason}>
        {busy ? 'Thinking…' : repeated ? repeatLabel : idleLabel}
      </button>
      {error && <p class="errors" role="alert">{error}</p>}
    </div>
  );
}
