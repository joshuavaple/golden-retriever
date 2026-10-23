import type { EvalRecord } from './serialize';

export function factsAndResponseWarning(record: EvalRecord): string | null {
  const e = record.expectations as Record<string, unknown> | undefined;
  if (e && 'expected_facts' in e && 'expected_response' in e) {
    return 'expected_facts and expected_response are both set. The older Agent Evaluation schema allowed only one; unverified for MLflow 3.';
  }
  return null;
}

export function duplicateInputsWarning(record: EvalRecord, dataset: EvalRecord[]): string | null {
  const key = JSON.stringify(record.inputs);
  return dataset.some((r) => JSON.stringify(r.inputs) === key)
    ? 'A record with identical inputs already exists; MLflow may merge them.'
    : null;
}
