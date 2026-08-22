import Groq from 'groq-sdk'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { brainDump, task } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'

type AiSubtask = { title?: string }
type AiTask = { title?: string; category?: string; priority?: string; time?: string; dueDate?: string; subtasks?: AiSubtask[] }

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return NextResponse.json({ error: 'Please sign in to organize thoughts.' }, { status: 401 })
    const body = await request.json().catch(() => null)
    const content = typeof body?.content === 'string' ? body.content.trim().slice(0, 6000) : ''
    if (!content) return NextResponse.json({ error: 'Write a thought first.' }, { status: 400 })
    const apiKey = process.env.GROQ_API_KEY
    const model = 'openai/gpt-oss-120b'
    if (!apiKey) return NextResponse.json({ error: 'GROQ_API_KEY missing at runtime.' }, { status: 503 })
    const groq = new Groq({ apiKey })
    const completion = await groq.chat.completions.create({
      model, temperature: 0.2, response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Turn messy notes into practical tasks. Return only JSON: {"tasks":[{"title":"...","category":"relevant subject/tag","priority":"High|Medium|Low","time":"Today|Tomorrow|This week","dueDate":"YYYY-MM-DD or ISO timestamp","subtasks":[{"title":"..."}]}]}. Use subtasks only when one entry is clearly a large or vague task (such as finishing an assignment, preparing for an exam, or building a project); create 2 to 4 concrete next steps. Keep subtasks empty or omit them for small/simple entries. Do not create subtasks for separate entries. Use today when no date is mentioned. Infer urgency-based priority. Create at most 8 parent tasks, never invent details, and merge duplicates.' },
        { role: 'user', content },
      ],
    })
    const raw = completion.choices[0]?.message?.content
    if (!raw) return NextResponse.json({ error: 'No actionable tasks found. Try adding a little more detail.' }, { status: 422 })
    const parsed = JSON.parse(raw) as { tasks?: AiTask[] }
    const today = new Date(); today.setHours(12, 0, 0, 0)
    const organized = (parsed.tasks ?? []).filter((item) => typeof item.title === 'string' && item.title.trim()).slice(0, 8).map((item) => {
      const parsedDate = item.dueDate ? new Date(item.dueDate) : today
      const safeDate = Number.isNaN(parsedDate.getTime()) ? today : parsedDate
      const subtasks = Array.isArray(item.subtasks) ? item.subtasks.filter((sub) => typeof sub?.title === 'string' && sub.title.trim()).slice(0, 4).map((sub) => ({ title: sub.title!.trim().slice(0, 240) })) : []
      return { title: item.title!.trim().slice(0, 240), category: (item.category?.trim() || 'Today').slice(0, 40), priority: item.priority === 'High' || item.priority === 'Low' ? item.priority : 'Medium', time: item.time ?? 'Today', dueDate: safeDate, subtasks }
    })
    if (!organized.length) return NextResponse.json({ error: 'No actionable tasks found. Try adding a little more detail.' }, { status: 422 })
    const userId = session.user.id
    const created: typeof task.$inferSelect[] = []
    for (const item of organized) {
      const parentId = crypto.randomUUID()
      const [parent] = await db.insert(task).values({ id: parentId, userId, title: item.title, category: item.category, priority: item.priority, time: item.time, dueDate: item.dueDate, done: false, parentId: null }).returning()
      created.push(parent)
      if (item.subtasks.length) {
        const children = await db.insert(task).values(item.subtasks.map((sub) => ({ id: crypto.randomUUID(), userId, title: sub.title, category: item.category, priority: item.priority, time: item.time, dueDate: item.dueDate, done: false, parentId }))).returning()
        created.push(...children)
      }
    }
    const existing = await db.select({ id: brainDump.id }).from(brainDump).where(eq(brainDump.userId, userId)).limit(1)
    if (existing[0]) await db.update(brainDump).set({ content, updatedAt: new Date() }).where(eq(brainDump.id, existing[0].id))
    else await db.insert(brainDump).values({ id: crypto.randomUUID(), userId, content })
    return NextResponse.json({ summary: `Organized ${organized.length} task${organized.length === 1 ? '' : 's'}.`, tasks: created })
  } catch (error) {
    const status = typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number' ? error.status : 500
    console.error('[v0] Organize thoughts failed', { status, message: error instanceof Error ? error.message : 'Unknown Groq failure', model: 'openai/gpt-oss-120b' })
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? `Could not organize thoughts (${status}).` : 'We could not organize those thoughts. Please try again.' }, { status: status >= 400 && status < 600 ? status : 500 })
  }
}
