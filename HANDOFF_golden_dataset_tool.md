# Golden dataset authoring tool: handoff to Claude Code

Read this whole file before writing any code.

A small, general-purpose web tool for hand-authoring evaluation ("golden") datasets for GenAI apps, in the **Databricks MLflow 3 evaluation dataset format**. Schema source: https://docs.databricks.com/aws/en/mlflow3/genai/eval-monitor/concepts/eval-datasets

Companion file to place in the repo as `spec/mlflow_eval_record.schema.json`: the machine-readable schema for one record (JSON Schema draft-07). It is the single source of truth for validation; do not re-encode its rules by hand elsewhere.

---

## 1. Goal and scope

- **Goal:** let a person type in evaluation records field by field, review the resulting MLflow-compatible JSON in the UI, and come back later to edit records.
- **Out of scope:** running evals or scorers, calling MLflow or Databricks APIs, document viewers, LLM-assisted drafting, multi-user features, auth.

## 2. Record format

A dataset is a **JSON array of records**. A record has these fields:

| Field | Required | Type | Notes |
|---|---|---|---|
| `inputs` | yes | object | Inputs for the app under evaluation, arbitrary JSON keys, typically `question`. |
| `expectations` | no | object | Ground-truth labels. Reserved keys below. MLflow also allows custom keys. |
| `tags` | no | object | Key-value tags. Any JSON value is allowed. |
| `source` | no | one of three forms | Provenance, see below. |

Reserved keys in `expectations`:

| Key | Type | Read by | Meaning |
|---|---|---|---|
| `expected_facts` | list of strings | Correctness judge | Facts that must appear in a correct answer. List only facts strictly required. |
| `expected_response` | string | Correctness judge | Exact or similar expected output. |
| `guidelines` | list of strings | Guidelines judge | Natural-language rules the answer must follow. |
| `expected_retrieved_context` | list of `{doc_uri, content}` | `document_recall` scorer | Documents or passages that should be retrieved. `content` is entered as Markdown. |

`source` is exactly one of:
```json
{"human": {"user_name": "jane.doe@example.com"}}
{"document": {"doc_uri": "s3://bucket/docs/manual.pdf", "content": "optional excerpt"}}
{"trace": {"trace_id": "tr-abc123def456"}}
```

MLflow assigns `dataset_record_id`, `create_time`, `created_by`, `last_update_time` and `last_updated_by` itself. The tool never writes them.

**Blank means omitted.** Optional fields the user leaves blank must not appear in the output: no empty strings, empty lists, empty objects or empty list rows. The schema enforces this (`minLength`/`minItems`/`minProperties`).

Help text worth showing in the UI: `expected_facts` checks what the answer says; `expected_retrieved_context` checks what the retriever returned. Facts can be derived conclusions that appear in no single passage.

### Examples (synthetic)

Minimal record (only the required field):
```json
{"inputs": {"question": "How long do I have to request a refund on an annual plan?"}}
```

Full record:
```json
{
  "inputs": {"question": "How long do I have to request a refund on an annual plan?"},
  "expectations": {
    "expected_facts": ["Annual plans have a 30-day refund window"],
    "guidelines": ["The response must cite the refund policy"],
    "expected_retrieved_context": [
      {
        "doc_uri": "s3://example-bucket/docs/refund-policy.md",
        "content": "| Plan | Refund window |\n|---|---|\n| Annual | 30 days |\n| Monthly | none |"
      }
    ]
  },
  "tags": {"topic": "billing"},
  "source": {"human": {"user_name": "jane.doe@example.com"}}
}
```

## 3. Unverified (confirm, don't assume)

1. The `{doc_uri, content}` item structure of `expected_retrieved_context`. The Databricks page doesn't spell it out; it comes from the older Agent Evaluation schema, where `doc_uri` is required and `content` optional. The schema follows that.
2. Whether `expected_facts` and `expected_response` may coexist in one record. The older schema allowed only one. The tool warns but does not block.
3. Whether `source` and `tags` are accepted when records are passed as plain dicts (for example to `merge_records` or `mlflow.genai.evaluate`) as opposed to being set through the Databricks UI. Check against the docs on a first real import.

## 4. Milestones

### Milestone 1: author records manually
A simple form to enter one record at a time:
- **inputs:** key/value rows. A `question` row is pre-added. At least one key with a non-blank value is required.
- **expectations:** the four reserved fields. `expected_facts` and `guidelines` as add/remove rows, one item per row. `expected_response` as a textarea. `expected_retrieved_context` as repeatable items, each with a single-line `doc_uri` and a multi-line monospaced `content` textarea where the user writes Markdown (an optional rendered-Markdown preview toggle is nice to have).
- **tags:** key/value rows.
- **source:** a selector (none / human / document / trace) that reveals the matching fields.
- Optional fields can be left blank and are omitted from the output (see "Blank means omitted").
- Live validation against the schema file with inline errors. "Add record" stays disabled until the record is valid.
- **Preview panel:** shows the exact JSON output, both for the record being edited and for the whole dataset array, with Copy and Download buttons.
- Warn, don't block: `expected_facts` and `expected_response` both filled; a new record whose `inputs` duplicate an existing one (MLflow may merge records with identical inputs).

**Accept when:** the minimal and full examples above can be entered through the UI; the downloaded JSON validates against the schema; blank optional fields never appear in the output.

### Milestone 2: edit existing records
- A record list showing each record's first input value and which optional sections are filled. Selecting a record opens it in the same form, pre-populated.
- The user can edit any field, fill in sections that were left blank, or clear a value (cleared values disappear from the output). Saving updates the record in place. Delete with confirmation.
- The preview updates after every change. Keys the form doesn't manage, such as custom `expectations` keys, must be preserved unchanged on save.
- Persistence: autosave the dataset to browser storage, and keep Download JSON available at all times. Optional if cheap: Import JSON to reload a previously downloaded dataset, which allows editing across sessions and machines.

**Accept when:** after adding three records and reloading the page, all three are still there; editing one to fill a previously blank section updates the preview and the output validates; record order is stable.

## 5. Stack and layout

**Recommended (confirm with the owner before scaffolding):** a static single-page app with no backend, built with vanilla JS or Preact plus Vite, using Ajv to validate against `spec/mlflow_eval_record.schema.json`. If the owner would rather have the dataset written to a file on disk automatically, the alternative is a tiny local server; ask first.

```
spec/mlflow_eval_record.schema.json
src/
tests/
```

Tests to write and run: both examples pass the schema; negative cases fail (empty `inputs`, empty `expectations`, blank fact, retrieved context without `doc_uri`, two `source` types); the serializer drops blank fields; unknown keys survive an edit round trip; the duplicate-inputs warning fires.

## 6. Working agreement

- Plan first: propose the stack, layout and Milestone 1 breakdown, then wait for the owner's go-ahead before scaffolding.
- Work in small, runnable steps. Run the app and the tests, and report actual results.
- Ask before adding dependencies. Keep the schema file the single source of truth.
- Never invent behaviour of MLflow or Databricks; if something in section 3 gets resolved, say how you checked.
- The owner is a senior ML/MLOps engineer: explain design choices briefly (the why) and keep replies concise.