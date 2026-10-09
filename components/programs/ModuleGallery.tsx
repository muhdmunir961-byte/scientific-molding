/**
 * ModuleGallery — the photos uploaded for one training module.
 *
 * ════════════════════════════════════════════════════════════════════════
 *  WHY IT RENDERS NOTHING WHEN IT HAS NOTHING
 *
 *  Same rule as Bug 5's fix on the About grid: a frame with no photograph is a
 *  brand-gradient tile, and a row of those reads as a broken page rather than as
 *  photographs not yet taken. So the component returns null for a module with no
 *  photos, and hides individual categories that are empty.
 *
 *  That matters more here than in About: there are seven modules and 28
 *  categories between them, and on day one every one of them is empty. Rendering
 *  the containers would put 28 gradient tiles on the page.
 *
 *  ── Why the categories are separate sections ────────────────────────────
 *  The client asked for photos grouped by activity — Lecture, Practical,
 *  Discussion, Presentation — because that is how a training session is
 *  structured and how someone choosing a programme wants to see it. Flattening
 *  them into one list would lose the grouping the panel is built around.
 *
 *  ── Why a figure per photo, not an `ImageSlot` ──────────────────────────
 *  `ImageSlot` reserves a fixed aspect ratio from declared dimensions, which is
 *  right for the hero and the portrait — their layout depends on the ratio being
 *  stable before the file arrives. Gallery photos come from an operator's camera
 *  at unknown dimensions, so the frame adapts to each file instead.
 * ════════════════════════════════════════════════════════════════════════
 */

import { galleryFor } from '@/lib/gallery';
import { PHOTO_CATEGORIES } from '@/lib/modules';
import { imageAvailable } from '@/lib/gallery-availability';

export interface ModuleGalleryProps {
  /** Canonical module slug. */
  moduleSlug: string;
  /** Module title, for the gallery's accessible name. */
  moduleTitle: string;
}

export default function ModuleGallery({ moduleSlug, moduleTitle }: ModuleGalleryProps) {
  const gallery = galleryFor(moduleSlug);

  /*
   * Categories with at least one photo whose file resolves.
   *
   * `imageAvailable` is the server-side check from the Bug 5 fix — a manifest
   * entry can name a file that was never uploaded, and an entry is not the same
   * as an image.
   */
  const populated = PHOTO_CATEGORIES.map((category) => ({
    ...category,
    images: gallery[category.slug].filter((image) => imageAvailable(image.url)),
  })).filter((category) => category.images.length > 0);

  if (populated.length === 0) return null;

  return (
    <div className="module-gallery">
      {populated.map((category) => (
        <section className="module-gallery-category" key={category.slug}>
          <h3 className="module-gallery-category-title">{category.label}</h3>

          <ul className="module-gallery-list">
            {category.images.map((image) => (
              <li className="module-gallery-item" key={image.key}>
                <figure className="module-gallery-figure">
                  {/* A plain <img>: these come from an operator's camera at
                      unknown dimensions, and the frame adapts to each file
                      rather than reserving a ratio from declared numbers. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.alt || `${category.label} at ${moduleTitle}`}
                    loading="lazy"
                  />
                  {image.caption && (
                    <figcaption className="module-gallery-caption">
                      {image.caption}
                    </figcaption>
                  )}
                </figure>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
