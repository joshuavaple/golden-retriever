import Ajv, { type ErrorObject } from 'ajv';
import schema from '@spec/mlflow_eval_record.schema.json';

const ajv = new Ajv({ allErrors: true, strict: false });
const validateFn = ajv.compile(schema);

export type SchemaError = { path: string; message: string };

export function validateRecord(record: unknown): SchemaError[] {
  if (validateFn(record)) return [];
  return (validateFn.errors ?? []).map(toSchemaError);
}

function toSchemaError(e: ErrorObject): SchemaError {
  return { path: e.instancePath, message: e.message ?? 'invalid' };
}
