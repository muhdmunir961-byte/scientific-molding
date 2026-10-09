'use client';

/**
 * Deploy button.
 *
 * Sits in the admin masthead so it is reachable from every panel page: the
 * moment an operator needs it is the moment they have just saved and are
 * wondering why the site has not changed.
 *
 * ── Why the wording says "queued" and not "deployed" ────────────────────
 * The API returns as soon as Coolify accepts the request; the build then runs
 * for one to three minutes. Saying "deployed" would be a lie the operator
 * discovers by refreshing and seeing no change — which is precisely the
 * confusion this feature exists to remove.
 */

import { useState } from 'react';

export default function DeployButton({ enabled }: { enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: 'ok' | 'error'; text: string } | null>(
    null,
  );

  async function deploy() {
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch('/api/admin/deploy', { method: 'POST' });
      const body = (await response.json()) as {
        ok?: boolean;
        error?: string;
        data?: { detail?: string };
      };

      if (!response.ok || !body.ok) {
        setResult({ tone: 'error', text: body.error ?? 'Deploy failed.' });
        return;
      }

      setResult({
        tone: 'ok',
        text: 'Deploy queued. The build takes one to three minutes — refresh the site after that.',
      });
    } catch {
      setResult({ tone: 'error', text: 'Could not reach the server.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-deploy">
      <button
        type="button"
        className="admin-button admin-button-secondary"
        onClick={deploy}
        disabled={busy || !enabled}
        title={
          enabled
            ? 'Ask Coolify to rebuild the site from the latest commit'
            : 'Set COOLIFY_WEBHOOK_URL to enable this'
        }
      >
        {busy ? 'Requesting…' : 'Deploy'}
      </button>

      {result && (
        <p
          className={
            result.tone === 'error' ? 'admin-deploy-error' : 'admin-deploy-ok'
          }
          role="status"
        >
          {result.text}
        </p>
      )}
    </div>
  );
}
