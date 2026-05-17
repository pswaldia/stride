import { NextRequest, NextResponse } from 'next/server'
import { runBackfill } from '@/lib/strava/backfill'

// Optional protection — set ADMIN_SECRET in .env.local to require a token.
// If unset (local dev), the route is open.
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return true    // no secret configured → allow (local dev)
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

// ─── POST /api/admin/backfill ─────────────────────────────────────────────────
// Streams progress as newline-delimited JSON.
//
// Locally (no ADMIN_SECRET set):
//   curl -X POST http://localhost:3000/api/admin/backfill --no-buffer
//
// In production (ADMIN_SECRET set):
//   curl -X POST https://your-app.vercel.app/api/admin/backfill \
//        -H "Authorization: Bearer <ADMIN_SECRET>" --no-buffer
//
// Each line is one of:
//   {"type":"progress","page":1,"fetched":100,"inserted":12,"skipped":88,"errors":0}
//   {"type":"done","inserted":42,"skipped":318,"errors":0,"pages":5}
//   {"type":"error","message":"..."}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(obj: Record<string, unknown>) {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'))
      }

      try {
        const result = await runBackfill((progress) => {
          send({ type: 'progress', ...progress })
        })

        send({ type: 'done', ...result })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        send({ type: 'error', message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',  // disable Nginx buffering on Vercel
    },
  })
}
