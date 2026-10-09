import { notFound } from 'next/navigation';

import { requirePage } from '@/lib/admin/page-guard';
import { findModule } from '@/lib/modules';

import ModulePhotoManager from './ModulePhotoManager';

export const dynamic = 'force-dynamic';

/**
 * Per-module photo manager.
 *
 * ── Why an unknown slug 404s here and redirects elsewhere ───────────────
 * This page is reached from a link that carries a real slug, so a slug that does
 * not resolve means the URL was typed or a module was renamed — a genuine 404.
 * The brief also asks for an empty slug to fall back to the Overview, which this
 * does: an empty slug is not a lookup failure, it is a missing choice, so it
 * goes to the Overview rather than to an error page.
 *
 * @param {{ params: Promise<{ slug: string }> }} props
 */
export default async function ModulePhotosPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requirePage();

  const { slug } = await params;

  // No slug at all — send the operator somewhere useful rather than erroring.
  if (!slug || !slug.trim()) {
    const { redirect } = await import('next/navigation');
    redirect('/admin');
  }

  const module = findModule(slug);
  if (!module) notFound();

  return <ModulePhotoManager module={module} />;
}
