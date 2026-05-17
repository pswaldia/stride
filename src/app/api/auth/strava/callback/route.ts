import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/strava/client'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return new NextResponse(renderPage({ error: `Strava denied access: ${error}` }), {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  if (!code) {
    return new NextResponse(renderPage({ error: 'No authorization code received from Strava.' }), {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  try {
    const tokens = await exchangeCodeForTokens(code)
    return new NextResponse(renderPage({ tokens }), {
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new NextResponse(renderPage({ error: message }), {
      headers: { 'Content-Type': 'text/html' },
    })
  }
}

// ─── Token shape returned by Strava ──────────────────────────────────────────
interface StravaTokenResponse {
  access_token: string
  refresh_token: string
  expires_at: number
  athlete?: { id: number; firstname?: string; lastname?: string }
}

// ─── HTML renderer ────────────────────────────────────────────────────────────
function renderPage(
  result: { tokens?: StravaTokenResponse; error?: string }
): string {
  if (result.error) {
    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Strava Auth — Error</title>
  <style>${styles}</style>
</head>
<body>
  <div class="card error">
    <h1>Authorization failed</h1>
    <p class="message">${escapeHtml(result.error)}</p>
    <a href="/api/auth/strava" class="btn">Try again</a>
  </div>
</body>
</html>`
  }

  const t = result.tokens!
  const athlete = t.athlete
    ? `${t.athlete.firstname ?? ''} ${t.athlete.lastname ?? ''}`.trim()
    : null

  const envBlock = [
    `STRAVA_ACCESS_TOKEN=${t.access_token}`,
    `STRAVA_REFRESH_TOKEN=${t.refresh_token}`,
    `STRAVA_TOKEN_EXPIRES_AT=${t.expires_at}`,
    t.athlete ? `STRAVA_OWNER_ID=${t.athlete.id}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Strava Auth — Success</title>
  <style>${styles}</style>
</head>
<body>
  <div class="card success">
    <div class="badge">Connected</div>
    <h1>Strava authorized${athlete ? ` · ${escapeHtml(athlete)}` : ''}</h1>
    <p class="message">Copy the values below into your <code>.env.local</code> file, then restart the dev server.</p>

    <div class="env-block">
      <div class="env-header">
        <span>.env.local</span>
        <button onclick="copyEnv()" id="copy-btn">Copy</button>
      </div>
      <pre id="env-content">${escapeHtml(envBlock)}</pre>
    </div>

    <p class="note">
      This page is only reachable during OAuth setup. Once you've pasted the tokens, you won't need to visit it again unless you re-authorize.
    </p>
  </div>

  <script>
    function copyEnv() {
      navigator.clipboard.writeText(${JSON.stringify(envBlock)}).then(() => {
        const btn = document.getElementById('copy-btn')
        btn.textContent = 'Copied!'
        setTimeout(() => { btn.textContent = 'Copy' }, 2000)
      })
    }
  </script>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const styles = /* css */ `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #FAF9F6;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    padding: 24px;
  }

  .card {
    background: #F0EDE6;
    border: 1px solid #DDD9D0;
    border-radius: 10px;
    padding: 32px;
    max-width: 520px;
    width: 100%;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    font-size: 11px;
    font-weight: 500;
    padding: 3px 10px;
    border-radius: 20px;
    margin-bottom: 14px;
  }

  .success .badge { background: #2E7D3215; color: #2E7D32; }
  .error .badge   { display: none; }

  h1 {
    font-family: 'Outfit', system-ui, sans-serif;
    font-size: 18px;
    font-weight: 500;
    color: #1A1A1A;
    margin-bottom: 8px;
  }

  .message {
    font-size: 13px;
    color: #6B6560;
    line-height: 1.6;
    margin-bottom: 20px;
  }

  code {
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 12px;
    background: #E8E4DB;
    padding: 1px 5px;
    border-radius: 4px;
    color: #1A1A1A;
  }

  .env-block {
    border: 1px solid #DDD9D0;
    border-radius: 7px;
    overflow: hidden;
    margin-bottom: 16px;
  }

  .env-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #E8E4DB;
    padding: 8px 14px;
    font-size: 11px;
    color: #6B6560;
  }

  .env-header button {
    background: #C0392B;
    color: #FAF9F6;
    border: none;
    border-radius: 5px;
    padding: 3px 10px;
    font-size: 11px;
    cursor: pointer;
  }

  .env-header button:hover { background: #E74C3C; }

  pre {
    padding: 14px;
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 12px;
    color: #1A1A1A;
    line-height: 1.8;
    white-space: pre-wrap;
    word-break: break-all;
    background: #FAF9F6;
  }

  .note {
    font-size: 11px;
    color: #A09890;
    line-height: 1.6;
    margin-top: 4px;
  }

  .btn {
    display: inline-block;
    margin-top: 16px;
    background: #C0392B;
    color: #FAF9F6;
    text-decoration: none;
    font-size: 13px;
    padding: 8px 18px;
    border-radius: 6px;
  }

  .btn:hover { background: #E74C3C; }
`
