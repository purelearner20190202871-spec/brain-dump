import Groq from 'groq-sdk'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { brainDump, task } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return NextResponse.json({ error: 'Please sign in to organize thoughts.' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const content = typeof body?.content === 'string' ? body.content.trim().slice(0, 6000) : ''
    if (!content) return NextResponse.json({ error: 'Write a thought first.' }, { status: 400 })
    const apiKey = process.env.GROQ_API_KEY
    const model = 'openai/gpt-oss-120b'
    console.info('[v0] Organize route called', { hasGroqApiKey: Boolean(apiKey), model, endpoint: 'https://api.groq.com/openai/v1/chat/completions' })
    if (!apiKey) {
      console.error('[v0] GROQ_API_KEY is missing at runtime')
      return NextResponse.json({ error: 'GROQ_API_KEY missing at runtime.' }, { status: 503 })
    }

    const groq = new Groq({ apiKey })
    const completion = await groq.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Turn messy personal notes into concise practical tasks. Return only JSON in this shape: {"tasks":[{"title":"...","category":"Personal|Work|Errands|Study|Today","priority":"High|Medium|Low","time":"Today|Tomorrow|This week"}]}. Create at most 8 tasks, never invent details, and merge duplicates.' },
        { role: 'user', content },
      ],
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) return NextResponse.json({ error: 'No actionable tasks found. Try adding a little more detail.' }, { status: 422 })
    const parsed = JSON.parse(raw) as { tasks?: Array<{ title?: string; category?: string; priority?: string; time?: string }> }
    const organized = (parsed.tasks ?? []).filter((item) => typeof item.title === 'string' && item.title.trim()).slice(0, 8)
    if (!organized.length) return NextResponse.json({ error: 'No actionable tasks found. Try adding a little more detail.' }, { status: 422 })

    const userId = session.user.id
    const created = await db.insert(task).values(organized.map((item) => ({
      id: crypto.randomUUID(), userId, title: item.title!.trim().slice(0, 240), category: item.category ?? 'Today', priority: item.priority ?? 'Medium', time: item.time ?? 'Today', done: false,
    }))).returning()
    const existing = await db.select({ id: brainDump.id }).from(brainDump).where(eq(brainDump.userId, userId)).limit(1)
    if (existing[0]) await db.update(brainDump).set({ content, updatedAt: new Date() }).where(eq(brainDump.id, existing[0].id))
    else await db.insert(brainDump).values({ id: crypto.randomUUID(), userId, content })

    return NextResponse.json({ summary: `Organized ${created.length} task${created.length === 1 ? '' : 's'}.`, tasks: created })
  } catch (error) {
    const status = typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number' ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unknown Groq failure'
    const category = status === 401 || status === 403 ? 'Groq authentication failed' : status === 404 ? 'Groq model or endpoint not found' : status === 400 ? 'Groq invalid request' : status === 429 ? 'Groq rate limit reached' : 'Groq server/API error'
    console.error('[v0] Organize thoughts failed', { category, status, message, model, endpoint: 'https://api.groq.com/openai/v1/chat/completions' })
    const safeError = process.env.NODE_ENV === 'development' ? `${category} (${status}). Check server logs for details.` : 'We could not organize those thoughts. Please try again.'
    return NextResponse.json({ error: safeError }, { status: status >= 400 && status < 600 ? status : 500 })
  }
}
