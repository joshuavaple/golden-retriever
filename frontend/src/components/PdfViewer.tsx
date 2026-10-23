import { useEffect, useRef, useState } from 'preact/hooks';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';
import { loadViewerLib, pdfjs } from '../pdf';
import { cleanSelection } from '../pdfSelection';

type PageProps = { doc: PDFDocumentProxy; num: number; scale: number };

function PdfPage({ doc, num, scale }: PageProps) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 612 * scale, h: 792 * scale });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { rootMargin: '600px 0px' });
    if (box.current) io.observe(box.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    let renderTask: { cancel(): void } | undefined;
    let textLayer: { cancel(): void; div: HTMLElement } | undefined;
    (async () => {
      const page = await doc.getPage(num);
      const viewport = page.getViewport({ scale });
      if (cancelled || !canvas.current || !box.current) return;
      setSize({ w: viewport.width, h: viewport.height });
      const dpr = window.devicePixelRatio || 1;
      const c = canvas.current;
      c.width = Math.floor(viewport.width * dpr);
      c.height = Math.floor(viewport.height * dpr);
      const task = page.render({ canvas: c, viewport, transform: dpr === 1 ? undefined : [dpr, 0, 0, dpr, 0, 0] });
      renderTask = task;
      // The viewer's TextLayerBuilder adds the end-of-content element and selecting
      // state that keep drag selection from jumping across gaps between lines.
      const { TextLayerBuilder } = await loadViewerLib();
      const builder = new TextLayerBuilder({ pdfPage: page });
      textLayer = builder;
      await Promise.all([task.promise, builder.render({ viewport } as Parameters<typeof builder.render>[0])]); // `images` is optional at runtime; the typings mark it required
      if (cancelled || !box.current) return;
      box.current.querySelector(':scope > .textLayer')?.remove();
      box.current.append(builder.div);
    })().catch(() => {
      /* cancelled renders reject; nothing to show */
    });
    return () => {
      cancelled = true;
      renderTask?.cancel();
      textLayer?.cancel();
      textLayer?.div.remove();
    };
  }, [visible, doc, num, scale]);

  return (
    <div ref={box} class="pdf-page" style={{ width: `${size.w}px`, height: `${size.h}px`, '--total-scale-factor': String(scale) }} data-page={num}>
      <canvas ref={canvas} style={{ width: `${size.w}px`, height: `${size.h}px` }} />
    </div>
  );
}

const PILL_WIDTH = 270; // approximate rendered width, used to keep the button on screen

type Props = { onAdd: (text: string, fileName: string) => void };

export function PdfViewer({ onAdd }: Props) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [scale, setScale] = useState(1.2);
  const [pill, setPill] = useState<{ x: number; y: number; text: string } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const open = async (file: File) => {
    setError('');
    try {
      const loaded = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      setDoc((prev) => {
        prev?.destroy();
        return loaded;
      });
      setFileName(file.name);
      setPill(null);
    } catch {
      setError(`Could not open ${file.name}. Choose a valid, unencrypted PDF.`);
    }
  };

  useEffect(() => {
    // Hide the button as soon as the selection goes away.
    const onChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) setPill(null);
    };
    document.addEventListener('selectionchange', onChange);
    return () => document.removeEventListener('selectionchange', onChange);
  }, []);

  // Show the button at the pointer once the user releases the mouse after selecting.
  const onMouseUp = (e: MouseEvent) => {
    const sel = window.getSelection();
    const root = scroller.current;
    if (!sel || sel.isCollapsed || !root || !root.contains(sel.anchorNode) || !root.contains(sel.focusNode)) return setPill(null);
    const text = cleanSelection(sel.toString());
    if (!text) return setPill(null);
    setPill({
      x: Math.min(e.clientX + 10, window.innerWidth - PILL_WIDTH),
      y: Math.min(e.clientY + 14, window.innerHeight - 48),
      text,
    });
  };

  const fitWidth = async () => {
    if (!doc || !scroller.current) return;
    const page = await doc.getPage(1);
    const available = scroller.current.clientWidth - 24; // scroller padding + scrollbar
    setScale(Math.max(0.4, Math.min(4, +(available / page.getViewport({ scale: 1 }).width).toFixed(2))));
  };

  return (
    <section class="pdf">
      <header class="bar">
        <h3>{fileName || 'PDF'}</h3>
        <span>
          {doc && (
            <>
              <button type="button" onClick={fitWidth}>Fit width</button>
              <button type="button" aria-label="Zoom out" onClick={() => setScale((s) => Math.max(0.6, +(s - 0.2).toFixed(1)))}>−</button>
              <button type="button" aria-label="Zoom in" onClick={() => setScale((s) => Math.min(3, +(s + 0.2).toFixed(1)))}>+</button>
            </>
          )}
          <label class="file-button">
            {doc ? 'Open another' : 'Open PDF'}
            <input type="file" accept="application/pdf" onChange={(e) => e.currentTarget.files?.[0] && open(e.currentTarget.files[0])} />
          </label>
        </span>
      </header>
      {error && <p class="errors" role="alert">{error}</p>}
      <div class="pdf-scroll" ref={scroller} onMouseUp={onMouseUp} onScroll={() => setPill(null)}>
        {doc ? (
          Array.from({ length: doc.numPages }, (_, i) => <PdfPage key={`${fileName}-${i}`} doc={doc} num={i + 1} scale={scale} />)
        ) : (
          <p class="help">Open a PDF to read it here, then select a passage to add it as retrieved context. The file stays in your browser.</p>
        )}
      </div>
      {pill && (
        <button
          type="button"
          class="pill"
          style={{ left: `${pill.x}px`, top: `${pill.y}px` }}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onAdd(pill.text, fileName);
            window.getSelection()?.removeAllRanges();
            setPill(null);
          }}
        >
          Add to expected_retrieved_context
        </button>
      )}
    </section>
  );
}
