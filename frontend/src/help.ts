/**
 * Field explainers. Wording is taken from the official docs; see `href` per entry.
 * Do not add claims here that the linked page does not make.
 */
const DATASETS = 'https://docs.databricks.com/aws/en/mlflow3/genai/eval-monitor/concepts/eval-datasets';
const GUIDELINES = 'https://docs.databricks.com/aws/en/mlflow3/genai/eval-monitor/concepts/judges/guidelines';
const CORRECTNESS = 'https://mlflow.org/docs/latest/genai/eval-monitor/scorers/llm-judge/response-quality/correctness/';

export type FieldHelp = { text: string; usedBy?: string; tip?: string; href: string; docs: string };

export const HELP = {
  inputs: {
    text: 'Inputs for your app (e.g., user question, context), stored as a JSON-serializable dict.',
    href: DATASETS,
    docs: 'Databricks docs',
  },
  expectations: {
    text: 'Ground truth labels, stored as a JSON-serializable dict. It has several reserved keys that are used by built-in LLM judges: guidelines, expected_facts, and expected_response.',
    href: DATASETS,
    docs: 'Databricks docs',
  },
  expected_facts: {
    text: 'List of facts that should appear.',
    usedBy: 'Correctness judge',
    tip: "The response doesn't need to match word-for-word, just contain the key facts. Use expected_facts rather than expected_response for more flexible evaluation.",
    href: CORRECTNESS,
    docs: 'MLflow docs',
  },
  expected_response: {
    text: 'Exact or similar expected output.',
    usedBy: 'Correctness judge',
    href: DATASETS,
    docs: 'Databricks docs',
  },
  guidelines: {
    text: 'Natural language rules to follow.',
    usedBy: 'Guidelines judge',
    tip: 'Be specific and measurable with clear pass/fail conditions, e.g. "The response must not include specific pricing amounts or percentages."',
    href: GUIDELINES,
    docs: 'Databricks docs',
  },
  expected_retrieved_context: {
    text: 'Documents that should be retrieved.',
    usedBy: 'document_recall scorer',
    href: DATASETS,
    docs: 'Databricks docs',
  },
  tags: {
    text: 'Key-value tags for the dataset record.',
    href: DATASETS,
    docs: 'Databricks docs',
  },
  source: {
    text: 'The source of the dataset record. Each record can have only one source type.',
    href: DATASETS,
    docs: 'Databricks docs',
  },
  source_human: { text: 'Record created manually by a person.', href: DATASETS, docs: 'Databricks docs' },
  source_document: { text: 'Record synthesized from a document.', href: DATASETS, docs: 'Databricks docs' },
  source_trace: { text: 'Record created from a production trace.', href: DATASETS, docs: 'Databricks docs' },
} satisfies Record<string, FieldHelp>;

export type HelpKey = keyof typeof HELP;
