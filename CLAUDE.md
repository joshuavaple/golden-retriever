# golden-retriever

Static web tool for hand-authoring MLflow 3 evaluation ("golden") datasets. Scope, record format and milestones are in `HANDOFF_golden_dataset_tool.md`; parked ideas are in `TODO.md`.

## Layout

- `spec/mlflow_eval_record.schema.json`: JSON Schema for one record. Single source of truth for validation.
- `frontend/`: Vite + Preact + TypeScript SPA (no backend).
- `backend/`: empty, reserved for a possible local server.

## Commands (run in `frontend/`)

- `npm run dev`: dev server
- `npm test`: Vitest
- `npm run build`: `tsc --noEmit` + Vite build
- Install with `npm install --legacy-peer-deps`. Plain `npm install` crashes with an npm peer-dependency error (`reading 'edgesOut'`).

## Conventions

- Don't re-encode schema rules by hand. The frontend imports the schema via the `@spec` alias and validates the serialized record with Ajv.
- Form state keeps blanks; `src/serialize.ts` drops them. Validation runs only on the serialized record.
- Keys the form doesn't manage (e.g. custom `expectations` keys) must survive an edit round trip.
- Don't invent MLflow or Databricks behavior. Unresolved points are listed in section 3 of the handoff; say how you checked if you resolve one.
- Ask before adding dependencies.
- The owner is a senior ML/MLOps engineer: keep replies concise and explain design choices briefly.
