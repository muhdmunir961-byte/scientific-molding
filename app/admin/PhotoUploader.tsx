'use client';

/**
 * Photo uploader — drop, click or paste, with a per-file status list.
 *
 * ════════════════════════════════════════════════════════════════════════
 *  WHY THIS REPLACES THE BARE `<input type="file">`
 *
 *  The old control was one button that opened the OS picker. Three things
 *  followed from that, and all three are why checking an upload was hard:
 *
 *   1. **No paste.** Feedback screenshots arrive by taking a screenshot and
 *      copying it. Ctrl+V into the page is the shortest possible path, and the
 *      panel had no way to accept it.
 *   2. **No drop.** Dragging a folder of photos out of a file manager is the
 *      normal way to add a batch; the panel required the picker every time.
 *   3. **No per-file feedback.** One request for ten files reported
 *      "9 uploaded, 1 failed" and the operator had to work out which one. Here
 *      every file gets its own row with its own state and its own reason.
 *
 *  ── Why the selection is unlimited ──────────────────────────────────────
 *  `UPLOAD_BATCH_SIZE` is the size of one HTTP request, not a cap on what the
 *  operator may choose. The browser splits the selection into batches and sends
 *  them in order, so 3 files and 300 files both work and the progress bar is
 *  honest about where it is.
 * ════════════════════════════════════════════════════════════════════════
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  ACCEPTED_IMAGE_ATTR,
  MAX_IMAGE_BYTES,
  UPLOAD_BATCH_SIZE,
  batchFiles,
  formatBytes,
  rejectReason,
} from '@/lib/admin/upload-limits';

/** One file's journey through the uploader. */
export interface UploadFileState {
  /** Stable within this component; the file name is not unique. */
  id: string;
  name: string;
  size: number;
  state: 'queued' | 'uploading' | 'done' | 'failed';
  /** Why it failed, or a short success note. */
  detail?: string;
  /**
   * Which selection this row belongs to.
   *
   * The queue accumulates across selections so the operator can see what the
   * last three drops did, but the progress bar must describe ONE run — otherwise
   * the second drop of two files reports "7 of 7 processed" because it is
   * counting five files from the first drop that are already done.
   */
  run: number;
}

export interface PhotoUploaderProps {
  /** Called with one batch. Should resolve to the per-file failures, if any. */
  onUpload: (files: File[]) => Promise<{ ok: boolean; error?: string; errors?: string[] }>;
  /** Disabled while the caller is busy with something else. */
  disabled?: boolean;
  /** Button text. */
  label?: string;
  /** Shown under the drop zone. */
  hint?: string;
  /** Compact variant, for a row inside another card. */
  compact?: boolean;
}

/** A stable id for a file in this session. */
let nextId = 0;
function fileId(): string {
  nextId += 1;
  return `f${nextId}`;
}

/**
 * Which uploader owns a paste.
 *
 * ── Why this is module scope ────────────────────────────────────────────
 * The paste listener has to be on `document`, because an operator who has just
 * taken a screenshot has focus wherever they last clicked. But a module page
 * renders FOUR uploaders (one per category) and the testimonials page renders
 * one per entry, so four or forty document listeners would each receive the same
 * paste and upload the screenshot into every category at once.
 *
 * So there is one shared answer to "who gets this paste". Hovering, focusing or
 * clicking a drop zone makes it the owner; with no owner, the first uploader on
 * the page takes it, which is the convenient default for the single-uploader
 * case.
 */
let activeUploaderId: string | null = null;
let firstUploaderId: string | null = null;
let uploaderSeq = 0;

/**
 * Pull image files out of a clipboard payload.
 *
 * A pasted screenshot has no filename, so one is synthesised from the type —
 * otherwise the status row reads "undefined". `pasted-<n>` is enough to tell two
 * pastes apart in the list.
 * @param {DataTransfer|null} data
 * @returns {File[]}
 */
function filesFromClipboard(data: DataTransfer | null): File[] {
  if (!data) return [];
  const files: File[] = [];

  for (const item of Array.from(data.items ?? [])) {
    if (item.kind !== 'file') continue;
    const file = item.getAsFile();
    if (file && file.type.startsWith('image/')) files.push(file);
  }

  // Some browsers expose files only through `files`, not `items`.
  if (files.length === 0) {
    for (const file of Array.from(data.files ?? [])) {
      if (file.type.startsWith('image/')) files.push(file);
    }
  }

  return files.map((file, index) =>
    file.name && file.name !== 'image.png'
      ? file
      : new File([file], `pasted-${Date.now()}-${index + 1}.png`, {
          type: file.type || 'image/png',
        }),
  );
}


export default function PhotoUploader({
  onUpload,
  disabled = false,
  label = 'Add photos',
  hint,
  compact = false,
}: PhotoUploaderProps) {
  const [queue, setQueue] = useState<UploadFileState[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, run: 0 });
  const runCount = useRef(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  /** This uploader's identity in the shared paste arbitration. */
  const instanceId = useRef<string>('');
  if (instanceId.current === '') {
    uploaderSeq += 1;
    instanceId.current = `uploader-${uploaderSeq}`;
  }

  /** Patch one file's state by id. */
  const patch = useCallback((id: string, next: Partial<UploadFileState>) => {
    setQueue((current) => current.map((f) => (f.id === id ? { ...f, ...next } : f)));
  }, []);

  /**
   * Run a selection through the uploader.
   *
   * Local rejections (wrong type, too large, empty) never reach the network: the
   * row is marked failed with the reason immediately, so a 40 MB TIFF does not
   * cost a round trip. What survives is batched, and each batch is committed
   * before the next starts.
   */
  const run = useCallback(
    async (picked: File[]) => {
      if (picked.length === 0) return;

      const rows: UploadFileState[] = [];
      const accepted: { file: File; id: string }[] = [];

      runCount.current += 1;
      const thisRun = runCount.current;

      for (const file of picked) {
        const id = fileId();
        const reason = rejectReason(file);
        rows.push({
          id,
          name: file.name,
          size: file.size,
          state: reason ? 'failed' : 'queued',
          detail: reason ?? undefined,
          run: thisRun,
        });
        if (!reason) accepted.push({ file, id });
      }

      setQueue((current) => [...current, ...rows]);
      setProgress({ done: 0, total: accepted.length, run: thisRun });

      if (accepted.length === 0) return;

      setBusy(true);
      let completed = 0;
      let cursor = 0;

      for (const batch of batchFiles(accepted.map((entry) => entry.file))) {
        const slice = accepted.slice(cursor, cursor + batch.length);
        cursor += batch.length;

        for (const entry of slice) patch(entry.id, { state: 'uploading' });

        const result = await onUpload(batch);

        if (!result.ok) {
          /*
           * A failed batch fails every file in it with the same reason. That is
           * the honest report: the request carrying them did not land, so none
           * of them are on the site.
           */
          for (const entry of slice) {
            patch(entry.id, { state: 'failed', detail: result.error ?? 'Upload failed.' });
          }
          completed += slice.length;
          setProgress({ done: completed, total: accepted.length, run: thisRun });
          continue;
        }

        /*
         * The route reports failures per file name. Matching on name is enough
         * because a batch is at most `UPLOAD_BATCH_SIZE` files picked at once,
         * and a duplicate name in one selection is the same file.
         */
        const failures = result.errors ?? [];
        for (const entry of slice) {
          const failure = failures.find((message) =>
            message.startsWith(`${entry.file.name}:`),
          );
          patch(entry.id, {
            state: failure ? 'failed' : 'done',
            detail: failure ? failure.slice(entry.file.name.length + 1).trim() : undefined,
          });
        }

        completed += slice.length;
        setProgress({ done: completed, total: accepted.length, run: thisRun });
      }

      setBusy(false);
    },
    [onUpload, patch],
  );


  /* ── Paste ─────────────────────────────────────────────────────────────
   * Bound to the document rather than to a focused element: an operator who has
   * just taken a screenshot has focus wherever they last clicked, and a paste
   * that silently did nothing because the drop zone was not focused would read
   * as the feature being broken. Text pastes are ignored, so this cannot
   * interfere with typing in the caption fields.
   *
   * Only the owning uploader acts on the paste — see `activeUploaderId` above.
   * Without that check every uploader on the page would store the same file.
   */
  useEffect(() => {
    const me = instanceId.current;
    if (firstUploaderId === null) firstUploaderId = me;

    function onPaste(event: ClipboardEvent) {
      if (disabled || busy) return;

      /*
       * The owner is this uploader, or — when nothing has been hovered or
       * focused — this is the first uploader on the page.
       */
      const owner = activeUploaderId ?? firstUploaderId;
      if (owner !== me) return;

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;

      const files = filesFromClipboard(event.clipboardData);
      if (files.length === 0) return;

      event.preventDefault();
      void run(files);
    }

    document.addEventListener('paste', onPaste);
    return () => {
      document.removeEventListener('paste', onPaste);
      if (activeUploaderId === me) activeUploaderId = null;
      if (firstUploaderId === me) firstUploaderId = null;
    };
  }, [busy, disabled, run]);

  const active = disabled || busy;
  /*
   * Counters describe the CURRENT run only. The queue keeps every row so the
   * operator can scroll back through what the last few drops did, but a progress
   * line that included earlier runs would read "7 of 7" after a drop of two.
   */
  const thisRun = queue.filter((f) => f.run === progress.run);
  const failed = thisRun.filter((f) => f.state === 'failed').length;
  const done = thisRun.filter((f) => f.state === 'done').length;

  return (
    <div className={`photo-uploader${compact ? ' photo-uploader-compact' : ''}`}>
      <div
        className={`photo-drop${dragging ? ' is-dragging' : ''}${active ? ' is-disabled' : ''}`}
        /*
         * A div with a button role rather than a `<label>`: the drop target has
         * to react to dragover/drop, and a label wrapping a file input cannot
         * carry both behaviours without the click also opening the picker twice.
         */
        role="button"
        tabIndex={active ? -1 : 0}
        aria-disabled={active}
        onClick={() => {
          if (active) return;
          /*
           * Clicking a drop zone makes it the paste target, so the next Ctrl+V
           * lands here rather than in the first category on the page.
           */
          activeUploaderId = instanceId.current;
          inputRef.current?.click();
        }}
        onFocus={() => {
          activeUploaderId = instanceId.current;
        }}
        onMouseEnter={() => {
          activeUploaderId = instanceId.current;
        }}
        onKeyDown={(event) => {
          if (active) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          if (active) return;
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (active) return;
          void run(Array.from(event.dataTransfer.files ?? []));
        }}
      >
        <span className="photo-drop-icon" aria-hidden="true">
          ⬆
        </span>
        <span className="photo-drop-title">{busy ? 'Uploading…' : label}</span>
        <span className="photo-drop-sub">
          Drag files here, click to choose, or press <kbd>Ctrl</kbd>+<kbd>V</kbd> to
          paste a screenshot. Any number of files. Paste goes to the zone you last
          pointed at.
        </span>

        <input
          ref={inputRef}
          className="admin-omit"
          type="file"
          multiple
          accept={ACCEPTED_IMAGE_ATTR}
          disabled={active}
          onChange={(event) => {
            void run(Array.from(event.currentTarget.files ?? []));
            // Cleared so choosing the same file again still fires a change.
            event.currentTarget.value = '';
          }}
        />
      </div>

      {hint && <p className="admin-hint photo-uploader-hint">{hint}</p>}

      {progress.total > 0 && (
        <div className="photo-progress" role="status" aria-live="polite">
          <div className="photo-progress-track">
            <div
              className="photo-progress-fill"
              style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
            />
          </div>
          <p className="photo-progress-text">
            {progress.done} of {progress.total} processed
            {failed > 0 ? ` · ${failed} failed` : ''}
            {done > 0 ? ` · ${done} stored` : ''}
          </p>
        </div>
      )}

      {queue.length > 0 && (
        <>
          <ul className="photo-queue" aria-label="Upload results">
            {queue.map((file) => (
              <li key={file.id} className={`photo-queue-item is-${file.state}`}>
                <span className="photo-queue-mark" aria-hidden="true">
                  {file.state === 'done'
                    ? '✓'
                    : file.state === 'failed'
                      ? '✕'
                      : file.state === 'uploading'
                        ? '…'
                        : '·'}
                </span>
                <span className="photo-queue-name" title={file.name}>
                  {file.name}
                </span>
                <span className="photo-queue-size">{formatBytes(file.size)}</span>
                <span className="photo-queue-state">
                  {file.state === 'queued' ? 'waiting' : file.state}
                  {file.detail ? ` — ${file.detail}` : ''}
                </span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="admin-button admin-button-secondary admin-button-small"
            disabled={busy}
            onClick={() => {
              setQueue([]);
              setProgress({ done: 0, total: 0, run: 0 });
            }}
          >
            Clear list
          </button>
        </>
      )}

      <p className="photo-uploader-limits">
        JPEG, PNG, WebP or AVIF · up to {formatBytes(MAX_IMAGE_BYTES)} per file · sent in
        batches of {UPLOAD_BATCH_SIZE}
      </p>
    </div>
  );
}
