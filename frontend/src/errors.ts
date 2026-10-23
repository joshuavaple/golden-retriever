import type { SchemaError } from './schema';
import type { SourceKind } from './model';

export type Section = 'inputs' | 'expectations' | 'tags' | 'source' | 'record';

const SOURCE_BRANCH: SourceKind[] = ['human', 'document', 'trace'];

/** Groups schema errors by form section as readable messages. */
export function groupErrors(errors: SchemaError[], sourceKind: SourceKind): Record<Section, string[]> {
  const out: Record<Section, string[]> = { inputs: [], expectations: [], tags: [], source: [], record: [] };
  for (const e of errors) {
    const top = e.path.split('/')[1];
    const section: Section = top === 'inputs' || top === 'expectations' || top === 'tags' || top === 'source' ? top : 'record';
    if (section === 'source') {
      // oneOf reports every branch; keep only the selected one.
      const m = e.schemaPath.match(/\/oneOf\/(\d)\//);
      if (!m || SOURCE_BRANCH[Number(m[1])] !== sourceKind) continue;
    }
    out[section].push(`${e.path || 'record'}: ${e.message}`);
  }
  return out;
}
