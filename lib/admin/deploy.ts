/**
 * Coolify deploy trigger.
 *
 * ════════════════════════════════════════════════════════════════════════
 *  WHY THE PANEL TRIGGERS A DEPLOY AT ALL
 *
 *  Saving in the panel commits to GitHub. Whether that reaches the live site
 *  depends entirely on Coolify's push webhook being wired — and when it is not,
 *  the failure is invisible: the commit lands, the panel reports success, and
 *  the site never changes. That is exactly the bug this project spent a session
 *  diagnosing from the outside by comparing CSS hashes.
 *
 *  With a deploy URL configured the panel can close the loop itself, so the
 *  operator sees the deploy happen rather than pressing save and hoping.
 *
 *  ── Why this does NOT replace the push webhook ──────────────────────────
 *  It is a manual control, not an automatic one. Auto-deploy on push is still
 *  the right primary mechanism: it covers edits made in an editor, a merge, a
 *  revert — anything that lands on `main` without the panel being involved.
 *  This button covers "I just saved and nothing happened".
 *
 *  Running both is safe: a deploy is idempotent, and a second one for the same
 *  commit simply rebuilds the same source.
 * ════════════════════════════════════════════════════════════════════════
 */

import { coolifyConfig, isCoolifyConfigured } from './config';

export interface DeployResult {
  ok: boolean;
  /** Coolify's response body, trimmed. Shown to the operator verbatim. */
  detail: string;
}

/**
 * Ask Coolify to deploy the application.
 *
 * @returns {Promise<DeployResult>}
 */
export async function triggerDeploy(): Promise<DeployResult> {
  if (!isCoolifyConfigured()) {
    return {
      ok: false,
      detail:
        'COOLIFY_WEBHOOK_URL is not set, so a deploy cannot be triggered from here. Deploy from the Coolify dashboard instead.',
    };
  }

  const { url, token } = coolifyConfig();

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      // A deploy is started, not awaited, so this only needs to cover the
      // dispatch. Coolify answers immediately; the build runs on its own.
      signal: AbortSignal.timeout(15_000),
    });

    const text = await response.text().catch(() => '');

    if (!response.ok) {
      return {
        ok: false,
        detail: `Coolify answered ${response.status}. ${text.slice(0, 300)}`,
      };
    }

    return {
      ok: true,
      detail: text.slice(0, 300) || 'Deploy queued.',
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return {
      ok: false,
      detail: `Could not reach Coolify: ${detail}`,
    };
  }
}
