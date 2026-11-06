import type { SourceKind } from './model';

/**
 * The tool records every record as created by a person (`source.human`). The
 * `document` and `trace` types, and omitting source, are fully supported by the
 * model, serializer and error handling; flip this to offer them in the form.
 * See the `source` notes in HANDOFF_golden_dataset_tool.md for why they are hidden.
 */
export const ENABLE_ALL_SOURCE_TYPES = false;

export const sourceKinds = (all: boolean): SourceKind[] => (all ? ['none', 'human', 'document', 'trace'] : ['human']);
