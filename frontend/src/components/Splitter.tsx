import { useRef } from 'preact/hooks';

type Props = {
  /** Current width in px of the pane this handle resizes. */
  getWidth: () => number;
  /** Widest the pane may become, in px. */
  getMax: () => number;
  onResize: (width: number | null) => void;
};

const MIN = 320;
const STEP = 40;

/** Vertical drag handle on a pane's right edge. Double-click resets to the default width. */
export function Splitter({ getWidth, getMax, onResize }: Props) {
  const drag = useRef<{ x: number; width: number } | null>(null);
  const clamp = (w: number) => Math.round(Math.max(MIN, Math.min(getMax(), w)));

  return (
    <div
      class="splitter"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize PDF panel"
      tabIndex={0}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        e.currentTarget.classList.add('dragging');
        document.body.classList.add('resizing');
        drag.current = { x: e.clientX, width: getWidth() };
      }}
      onPointerMove={(e) => {
        if (drag.current) onResize(clamp(drag.current.width + e.clientX - drag.current.x));
      }}
      onPointerUp={(e) => {
        drag.current = null;
        e.currentTarget.classList.remove('dragging');
        document.body.classList.remove('resizing');
      }}
      onDblClick={() => onResize(null)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') onResize(clamp(getWidth() - STEP));
        else if (e.key === 'ArrowRight') onResize(clamp(getWidth() + STEP));
        else return;
        e.preventDefault();
      }}
    />
  );
}
