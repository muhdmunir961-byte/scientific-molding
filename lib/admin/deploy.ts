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
    /*
     * POST, not GET.
     *
     * The Coolify instance running this site answers a GET with
     * 405 {"message":"This endpoint has changed to a POST request."} — the
     * endpoint was changed from GET to POST in Coolify v4. So the method here is
     * not a preference: a GET cannot work at all.
     */
    const response = await fetch(url, {
      method: 'POST',
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
      return { ok: false, detail: describeFailure(response.status, text) };
    }

    return { ok: true, detail: describeSuccess(text) };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return {
      ok: false,
      detail: `Could not reach Coolify: ${detail}`,
    };
  }
}

/**
 * Turn a Coolify failure into a sentence an operator can act on.
 *
 * The raw body is a JSON object like `{"message":"Unauthenticated."}` — showing
 * that verbatim tells the operator nothing about what to do. Each status the
 * endpoint actually returns gets a plain explanation; anything else falls back
 * to the message Coolify sent, stripped of punctuation noise.
 *
 * @param {number} status
 * @param {string} body
 * @returns {string}
 */
function describeFailure(status: number, body: string): string {
  const message = extractMessage(body);

  switch (status) {
    case 401:
    case 403:
      return 'Coolify rejected the request. COOLIFY_API_TOKEN is missing, expired, or lacks the deploy permission.';
    case 404:
      return 'Coolify could not find this application. Check the uuid in COOLIFY_WEBHOOK_URL.';
    case 405:
      return 'Coolify no longer accepts this request. The endpoint expects POST — if you see this, the panel is sending the wrong method.';
    case 429:
      return 'Coolify is rate-limiting deploys. Wait a moment and try again.';
    case 500:
    case 502:
    case 503:
      return `Coolify reported a server error (${status}). The deploy may not have started — check the Coolify dashboard.`;
    default:
      return message
        ? `Coolify answered ${status}: ${message}`
        : `Coolify answered ${status}.`;
  }
}

/**
 * Turn a success body into something readable, without dumping JSON.
 * @param {string} body
 * @returns {string}
 */
function describeSuccess(body: string): string {
  const message = extractMessage(body);
  return message
    ? `Deploy queued — ${message}`
    : 'Deploy queued. The build takes one to three minutes.';
}

/**
 * Pull a human string out of Coolify's JSON error envelope.
 *
 * Returns '' rather than the raw body when there is nothing readable, so a
 * caller never ends up showing `{"message":"..."}` to an operator.
 * @param {string} body
 * @returns {string}
 */
function extractMessage(body: string): string {
  const trimmed = body.trim();
  if (!trimmed.startsWith('{')) return trimmed.slice(0, 200);

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    for (const key of ['message', 'error', 'deployment_uuid']) {
      const value = parsed[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return '';
  } catch {
    return trimmed.slice(0, 200);
  }
}
