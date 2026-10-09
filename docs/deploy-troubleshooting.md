# Deploy troubleshooting — Coolify not rebuilding

## The symptom

The admin panel saves correctly and commits reach GitHub, but the live site
never changes. Editing text and replacing images both appear to do nothing.

## The diagnosis, and how it was proven

The panel is not at fault. **Coolify is not rebuilding.**

| Link in the chain | Status |
|---|---|
| Panel uploads / saves | working |
| Panel commits to GitHub | working — commits `2ac38f7`, `c7d3130` are on `main` |
| GitHub notifies Coolify | **not happening** |
| Coolify rebuilds and restarts | **not happening** |
| Live site updates | never |

Evidence, in order of how decisive it is:

1. **The live build predates the fix.** The served stylesheet is still
   `35p844e57sdc4.css`, the hash from before the text-editing commit
   (`9dde072`).
2. **The new CSS is absent.** Fetching the live stylesheet and grepping for
   `admin-array`, `admin-object`, `admin-badge` returns `0` for each. Those
   classes exist only in the current code, so the live container is running an
   older build.
3. **`withOverrides` is absent** from the served HTML — the override mechanism
   the text editing depends on was never deployed.
4. **A probe push produced no change.** An empty commit (`32c9b9f`) was pushed
   to `main` and the CSS hash was polled at +3 and +7 minutes. Unchanged both
   times. A working auto-deploy rebuilds within roughly two minutes.

## Why this looks like "the panel cannot update"

Every step that reports success genuinely succeeds. The failure is silent
because nothing in the panel can see whether the deploy happened — GitHub
returned 201, so the panel says "committed". The panel is telling the truth
about the step it performed, and the step after it is missing.

## Fixing it — check these, in order

### 1. Auto Deploy must be enabled

```
Coolify → [application] → Configuration
```

Find **Auto Deploy** and make sure it is ON. Depending on the Coolify version it
sits under **General** or **Advanced**.

### 2. The webhook must exist on the GitHub side

```
Coolify → [application] → Webhooks
```

Copy the **GitHub** webhook URL. It must also be registered at:

```
GitHub → repository → Settings → Webhooks → Add webhook
  Payload URL:  <the Coolify URL>
  Content type: application/json
  Events:       Just the push event
```

Then check **Recent Deliveries** on that webhook. A `200` means GitHub is
reaching Coolify and the problem is on the Coolify side. A `Failed` or a missing
delivery means the webhook is the problem.

### 3. Deploy manually to unblock

```
Coolify → [application] → Deployments → Deploy
```

Use **Deploy** or **Redeploy**, not **Restart**. Restart reuses the existing
image; only a deploy rebuilds from the new commit.

Confirm it worked:

```bash
curl -s https://scientificmoldings.com \
  | grep -oE '/_next/static/chunks/[a-z0-9_-]+\.css' | head -1
```

If the hash is no longer `35p844e57sdc4.css`, the deploy landed. The panel's
edits will then be visible on the site.

## If auto-deploy cannot be enabled

The panel can trigger the deploy itself after each save, using a Coolify deploy
webhook. That needs one environment variable:

```
COOLIFY_WEBHOOK_URL=https://<coolify-host>/api/v1/deploy?uuid=<app-uuid>&force=false
```

Trade-off: the panel then depends on Coolify being reachable from the container,
and a deploy is triggered per save rather than per push. It also fires whether or
not GitHub's webhook works, which can mean two deploys for one commit if both
paths are live. Fixing the webhook is the cleaner option.

## Checking the deploy without the dashboard

The CSS hash is a reliable deploy fingerprint: it is content-derived, so it
changes whenever the built stylesheet changes.

```bash
curl -s https://scientificmoldings.com \
  | grep -oE '/_next/static/chunks/[a-z0-9_-]+\.css' | head -1
```

To check whether a specific feature is live, grep the served HTML or stylesheet
for a class only that feature introduces:

```bash
# Is the text-editing feature deployed?
curl -s https://scientificmoldings.com/_next/static/chunks/<hash>.css \
  | grep -c 'admin-array'
```

A `0` means the container predates that feature, regardless of what `main`
contains.
