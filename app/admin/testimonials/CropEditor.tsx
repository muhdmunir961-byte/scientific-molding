'use client';

/**
 * Screenshot crop editor — drag to select, or pick a preset.
 *
 * ════════════════════════════════════════════════════════════════════════
 *  WHY THE CROP IS FRACTIONS AND NOT A NEW FILE
 *
 *  The original upload is stored untouched and served untouched. The crop is
 *  stored as four fractions of the original, which means:
 *
 *    - re-cropping never degrades the image (no repeated re-encode);
 *    - the original is still there if the operator wants the whole thing back;
 *    - no native image library is needed in the deploy, which `next/image`
 *      would otherwise require for server-side cropping.
 *
 *  ── Why "auto" is a set of presets rather than content detection ──────
 *  Detecting the message bubble in an arbitrary screenshot needs computer
 *  vision. Guessing at it and being wrong is worse than offering the shapes a
 *  feedback capture actually comes in — a phone screenshot, a square, a wide
 *  email — and letting the operator drag from there. Every preset is a starting
 *  point, not a claim about the content.
 * ════════════════════════════════════════════════════════════════════════
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { TestimonialCrop } from '@/lib/testimonials';

/** Presets offered above the image. `null` means "the whole original". */
const PRESETS: { label: string; ratio: number | null; hint: string }[] = [
  { label: 'Original', ratio: null, hint: 'No crop — the whole screenshot' },
  { label: 'Phone', ratio: 9 / 16, hint: 'A tall phone screenshot' },
  { label: 'Square', ratio: 1, hint: 'Equal width and height' },
  { label: 'Wide', ratio: 16 / 9, hint: 'A desktop or email capture' },
];

/** Clamp a number into a range. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function CropEditor({
  src,
  crop,
  onChange,
  disabled,
}: {
  src: string;
  crop: TestimonialCrop | null;
  onChange: (next: TestimonialCrop | null) => void;
  disabled?: boolean;
}) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [dragging, setDragging] = useState<'move' | 'se' | null>(null);
  const startRef = useRef<{ x: number; y: number; crop: TestimonialCrop } | null>(null);

  const region = crop ?? { x: 0, y: 0, w: 1, h: 1 };

  /** Pointer position as fractions of the image box. */
  const pointFromEvent = useCallback((event: PointerEvent | React.PointerEvent) => {
    const box = boxRef.current;
    if (!box) return { x: 0, y: 0 };
    const rect = box.getBoundingClientRect();
    return {
      x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
      y: clamp((event.clientY - rect.top) / rect.height, 0, 1),
    };
  }, []);

  /*
   * Pointer events are listened for on `window` rather than on the handle.
   * A drag that leaves the handle — which it does immediately, because the
   * pointer moves faster than the handle — would otherwise stop updating.
   */
  useEffect(() => {
    if (!dragging) return;

    function onMove(event: PointerEvent) {
      const start = startRef.current;
      if (!start) return;
      const point = pointFromEvent(event);
      const dx = point.x - start.x;
      const dy = point.y - start.y;

      if (dragging === 'move') {
        onChange({
          ...start.crop,
          x: clamp(start.crop.x + dx, 0, 1 - start.crop.w),
          y: clamp(start.crop.y + dy, 0, 1 - start.crop.h),
        });
        return;
      }

      // Bottom-right handle: grow or shrink, never past the image edge.
      onChange({
        ...start.crop,
        w: clamp(start.crop.w + dx, 0.05, 1 - start.crop.x),
        h: clamp(start.crop.h + dy, 0.05, 1 - start.crop.y),
      });
    }

    function onUp() {
      setDragging(null);
      startRef.current = null;
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging, onChange, pointFromEvent]);

  function begin(mode: 'move' | 'se') {
    return (event: React.PointerEvent) => {
      if (disabled) return;
      event.preventDefault();
      startRef.current = { ...pointFromEvent(event), crop: region };
      setDragging(mode);
    };
  }

  /**
   * Apply a preset, accounting for the image's real proportions.
   *
   * The largest centred region of the requested ratio is used, so the preset
   * never asks for more image than exists. The operator drags from there.
   */
  function applyPreset(ratio: number | null) {
    if (ratio === null) {
      onChange(null);
      return;
    }

    const imageRatio = natural ? natural.w / natural.h : 9 / 16;
    let w = 1;
    let h = 1;

    if (ratio > imageRatio) {
      h = imageRatio / ratio;
    } else {
      w = ratio / imageRatio;
    }

    onChange({ x: (1 - w) / 2, y: (1 - h) / 2, w, h });
  }

  return (
    <div className="crop-editor">
      <div className="crop-presets" role="group" aria-label="Crop presets">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className="admin-button admin-button-secondary"
            disabled={disabled}
            title={preset.hint}
            onClick={() => applyPreset(preset.ratio)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="crop-stage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Screenshot to crop"
          className="crop-source"
          onLoad={(event) => {
            const img = event.currentTarget;
            setNatural({ w: img.naturalWidth, h: img.naturalHeight });
          }}
        />

        <div
          ref={boxRef}
          className="crop-box"
          style={{
            left: `${region.x * 100}%`,
            top: `${region.y * 100}%`,
            width: `${region.w * 100}%`,
            height: `${region.h * 100}%`,
          }}
          onPointerDown={begin('move')}
          role="presentation"
        >
          <span className="crop-handle" onPointerDown={begin('se')} aria-hidden="true" />
        </div>
      </div>

      <p className="admin-hint">
        Drag inside the box to move it, drag the corner to resize.
        {natural ? ` Original is ${natural.w}×${natural.h}px.` : ''}
      </p>
    </div>
  );
}