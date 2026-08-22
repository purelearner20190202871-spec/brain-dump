'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { brainDump, task } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getPrivateDump() {
  const userId = await getUserId()
  const rows = await db.select().from(brainDump).where(eq(brainDump.userId, userId)).limit(1)
  return rows[0]?.content ?? ''
}

export async function savePrivateDump(content: string) {
  const userId = await getUserId()
  const existing = await db.select({ id: brainDump.id }).from(brainDump).where(eq(brainDump.userId, userId)).limit(1)
  if (existing[0]) await db.update(brainDump).set({ content, updatedAt: new Date() }).where(eq(brainDump.id, existing[0].id))
  else await db.insert(brainDump).values({ id: crypto.randomUUID(), userId, content })
  return { ok: true }
}

export async function getPrivateTasks() {
  const userId = await getUserId()
  return db.select().from(task).where(eq(task.userId, userId)).orderBy(task.createdAt)
}

export async function createPrivateTask(input: { title: string; category?: string; priority?: string; time?: string; dueDate?: string }) {
  const userId = await getUserId()
  const title = input.title.trim().slice(0, 240)
  if (!title) throw new Error('Task title is required')
  const priority = input.priority === 'High' || input.priority === 'Low' ? input.priority : 'Medium'
  const dueDate = input.dueDate ? new Date(input.dueDate) : null
  if (dueDate && Number.isNaN(dueDate.getTime())) throw new Error('Invalid due date')
  const created = await db.insert(task).values({ id: crypto.randomUUID(), userId, title, category: input.category ?? 'Today', priority, time: input.time ?? 'Today', dueDate }).returning()
  return created[0]
}

export async function togglePrivateTask(id: string, done: boolean) {
  const userId = await getUserId()
  const updated = await db.update(task).set({ done, updatedAt: new Date() }).where(and(eq(task.id, id), eq(task.userId, userId))).returning()
  if (!updated[0]) throw new Error('Task not found')
  return updated[0]
}

export async function deletePrivateTask(id: string) {
  const userId = await getUserId()
  const deleted = await db.delete(task).where(and(eq(task.id, id), eq(task.userId, userId))).returning({ id: task.id })
  if (!deleted[0]) throw new Error('Task not found')
  return { ok: true }
}
