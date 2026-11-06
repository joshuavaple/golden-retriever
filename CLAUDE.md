# golden-retriever

Static web tool for hand-authoring MLflow 3 evaluation ("golden") datasets. Scope, record format and milestones are in `HANDOFF_golden_dataset_tool.md`; parked ideas are in `TODO.md`.

## Layout

- `spec/mlflow_eval_record.schema.json`: JSON Schema for one record. Single source of truth for validation.
- `frontend/`: Vite + Preact + TypeScript SPA (no backend).
- `backend/`: Python (FastAPI + LangChain, Azure OpenAI) service for AI question and answer suggestions. Separate process from the frontend; see `backend/README.md`. The prompts live in `backend/config/question_prompts.yaml` and `answer_prompts.yaml`.

## Commands (run in `frontend/`)

- `npm run dev`: dev server
- `npm test`: Vitest
- `npm run build`: `tsc --noEmit` + Vite build
- Install with `npm install --legacy-peer-deps`. Plain `npm install` crashes with an npm peer-dependency error (`reading 'edgesOut'`).

## Commands (run in `backend/`)

- `uv sync`, then `uv run uvicorn app.main:app --reload --port 8000`: dev server (credentials in `backend/.env`, see `.env.example`)
- `uv run pytest`: tests (fake model, no network)

## Conventions

- Don't re-encode schema rules by hand. The frontend imports the schema via the `@spec` alias and validates the serialized record with Ajv.
- Form state keeps blanks; `src/serialize.ts` drops them. Validation runs only on the serialized record.
- Keys the form doesn't manage (e.g. custom `expectations` keys) must survive an edit round trip.
- Don't invent MLflow or Databricks behavior. Unresolved points are listed in section 3 of the handoff; say how you checked if you resolve one.
- Ask before adding dependencies.
- The owner is a senior ML/MLOps engineer: keep replies concise and explain design choices briefly.

## Gotchas

- Preact 11 does not add `px` to numeric inline styles: `style={{ width: 612 }}` is silently ignored. Always pass strings with units (`` `${n}px` ``), including custom properties.
- The PDF viewer (`src/components/PdfViewer.tsx`, `src/pdf.ts`) depends on `TextLayerBuilder` from `pdfjs-dist/web/pdf_viewer.mjs` (not the bare `TextLayer`) for drag selection to match a native reader. `pdf_viewer.mjs` reads `globalThis.pdfjsLib`, so `src/pdf.ts` sets that before the dynamic import. The canvas renders at `devicePixelRatio` and is sized in CSS px; the text layer needs `--total-scale-factor` on the page element.
