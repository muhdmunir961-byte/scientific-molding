'use client';

/**
 * Admin sign-in.
 *
 * ── Why the form is a client component but the check is not ─────────────
 * The password is verified server-side, always. The client component exists
 * only to submit the form without a full page reload and to show the error
 * inline. No secret is present in this file.
 *
 * ── Why `autoComplete="current-password"` ───────────────────────────────
 * It lets a password manager fill the field, which is what makes a long
 * generated password practical. `new-password` would prompt to *save* a new one
 * instead, which is wrong for a sign-in form.
 */

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !body.ok) {
        setError(body.error ?? 'Sign-in failed.');
        setBusy(false);
        return;
      }

      // `refresh()` re-runs the server components so the guard sees the new
      // cookie; without it the dashboard would render its signed-out state.
      router.replace('/admin');
      router.refresh();
    } catch {
      setError('Could not reach the server.');
      setBusy(false);
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <h1 className="admin-title">Admin</h1>
        <p className="admin-lede">
          Scientific Molding Training Series — content panel.
        </p>

        <form className="admin-card" onSubmit={onSubmit}>
          {error && (
            <div className="admin-notice admin-notice-error" role="alert">
              {error}
            </div>
          )}

          <div className="admin-field">
            <label className="admin-label" htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              className="admin-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              required
            />
          </div>

          <button className="admin-button" type="submit" disabled={busy}>
            {busy ? 'Checking…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
