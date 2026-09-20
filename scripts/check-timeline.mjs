#!/usr/bin/env node
/**
 * Verify the animation timeline adds up.
 *
 * Reads TIMING straight out of the component and asserts the phases line up:
 * the overlay must still be animating when the content starts rising, or the
 * two phases read as a handover instead of one continuous gesture.
 *
 * Run: node scripts/check-timeline.mjs
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const component = readFileSync(join(here, '..', 'components', 'EntranceLoader.tsx'), 'utf8');
const css = readFileSync(join(here, '..', 'app', 'globals.css'), 'utf8');

let failures = 0;

/** @param {boolean} ok @param {string} label @param {string} detail */
function report(ok, label, detail = '') {
  const mark = ok ? '\u001b[32m✓\u001b[0m' : '\u001b[31m✗\u001b[0m';
  console.log(`  ${mark} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
}

/** Pull a numeric constant out of the component's TIMING object. */
function timing(name) {
  const match = component.match(new RegExp(`${name}:\\s*(\\d+)`));
  return match ? Number(match[1]) : NaN;
}

const holdMs = timing('holdMs');
const burnMs = timing('burnMs');

// The CSS owns the content reveal, so read its delay and duration from there.
// The easing is a cubic-bezier with spaces inside it, so the wildcard between
// duration and delay has to be non-greedy rather than \S+.
const animation = css.match(
  /animation:\s*content-reveal\s+(\d+)ms\s+.*?(\d+)ms\s+backwards/,
);
const revealMs = animation?.[1] !== undefined ? Number(animation[1]) : NaN;
const revealDelayMs = animation?.[2] !== undefined ? Number(animation[2]) : NaN;

const overlayEndsMs = holdMs + burnMs;
const revealStartsMs = revealDelayMs;
const revealEndsMs = revealDelayMs + revealMs;

console.log('\n\u001b[1mEntrance timeline\u001b[0m\n');
report(Number.isFinite(holdMs), 'holdMs parsed', `${holdMs}ms`);
report(Number.isFinite(burnMs), 'burnMs parsed', `${burnMs}ms`);
report(Number.isFinite(revealMs), 'reveal duration parsed', `${revealMs}ms`);
report(Number.isFinite(revealDelayMs), 'reveal delay parsed', `${revealDelayMs}ms`);

console.log('');
report(holdMs === 1500, 'hold is 1500ms as specified', `${holdMs}ms`);
report(burnMs > 0 && burnMs <= 1000, 'burn is snappy', `${burnMs}ms`);

/*
 * The overlap test is the one that actually matters. If the content reveal
 * began after the overlay had already unmounted, the visitor would see the
 * page sit still and then jump — two separate events.
 */
report(
  revealStartsMs < overlayEndsMs,
  'content starts rising while the overlay is still burning',
  `rise at ${revealStartsMs}ms, overlay gone at ${overlayEndsMs}ms`,
);

report(
  revealEndsMs > overlayEndsMs,
  'content is still settling after the overlay clears',
  `settled at ${revealEndsMs}ms`,
);

console.log('');
console.log(`  overlay  0 → ${overlayEndsMs}ms   (glow ${holdMs}ms, burn ${burnMs}ms)`);
console.log(`  content  ${revealStartsMs} → ${revealEndsMs}ms   (rise ${revealMs}ms)`);
console.log(`  overlap  ${overlayEndsMs - revealStartsMs}ms\n`);

if (failures === 0) {
  console.log('  \u001b[32mTIMELINE OK\u001b[0m\n');
  process.exit(0);
}

console.log(`  \u001b[31m${failures} TIMELINE PROBLEM(S)\u001b[0m\n`);
process.exit(1);
