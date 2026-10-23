# TODO

## Parked

- [ ] **Document metadata (page, heading path, etc.)**: MLflow has no dedicated field for it. `source.document` has only `doc_uri` and `content`, and the `expected_retrieved_context` item structure is undocumented (checked against the [Databricks eval datasets page](https://docs.databricks.com/aws/en/mlflow3/genai/eval-monitor/concepts/eval-datasets)). Options considered, none chosen:
  - Record-level `tags` (e.g. `doc_page`, `doc_heading_path`): safe and documented, but per record, so ambiguous when several passages are expected.
  - Extra keys on `expected_retrieved_context` items: best semantic fit, but may be rejected or ignored; verify on a real import first.
  - Fragment on `doc_uri` (`#page=12`): likely breaks `document_recall` matching.
  - Inside `content`: mixes metadata into compared text.
  - Revisit if the need becomes concrete.
