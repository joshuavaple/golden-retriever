import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
// pdf_viewer.mjs reads the core library from this global when it is evaluated.
(globalThis as { pdfjsLib?: unknown }).pdfjsLib = pdfjs;

export { pdfjs };

/** Loads PDF.js's viewer components; must run after the global above is set. */
export const loadViewerLib = () => import('pdfjs-dist/web/pdf_viewer.mjs');
