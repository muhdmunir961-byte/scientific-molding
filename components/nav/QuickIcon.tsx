'use client';

/**
 * §6 — Shared quick-action icons.
 *
 * The mobile panel and the sticky bar render the same three actions, so the
 * glyph for each lives here rather than being chosen twice. `aria-hidden` on
 * every icon: each one sits next to a visible text label, and an exposed icon
 * would announce a graphic name before it.
 *
 * `MessageCircle` stands in for WhatsApp. Lucide ships no brand logos (verified
 * against the installed package), and a custom-drawn WhatsApp mark would be a
 * third-party trademark reproduced without licence.
 */

import { Mail, MessageCircle, Phone } from 'lucide-react';

import type { QuickActionKind } from './nav-content';

export default function QuickIcon({
  kind,
  size = 18,
  color,
}: {
  kind: QuickActionKind;
  size?: number;
  color?: string;
}) {
  const shared = { size, strokeWidth: 2.25, 'aria-hidden': true } as const;

  switch (kind) {
    case 'call':
      return <Phone {...shared} {...(color ? { color } : {})} />;
    case 'whatsapp':
      return <MessageCircle {...shared} {...(color ? { color } : {})} />;
    case 'email':
      return <Mail {...shared} {...(color ? { color } : {})} />;
  }
}
