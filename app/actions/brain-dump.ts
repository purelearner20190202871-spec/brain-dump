'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { brainDump, subject, task } from '@/lib/db/schema'
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
  if (existing[0]) {
    await db.update(brainDump).set({ content, updatedAt: new Date() }).where(eq(brainDump.id, existing[0].id))
  } else {
    await db.insert(brainDump).values({ id: crypto.randomUUID(), userId, content })
  }
  return { ok: true }
}

export async function getPrivateSubjects() {
  const userId = await getUserId()
  return db.select().from(subject).where(eq(subject.userId, userId)).orderBy(subject.createdAt)
}

export async function createPrivateSubject(name: string) {
  const userId = await getUserId()
  const cleanName = name.trim().slice(0, 60)
  if (!cleanName) throw new Error('Subject name is required')
  const created = await db.insert(subject).values({ id: crypto.randomUUID(), userId, name: cleanName }).returning()
  return created[0]
}

export async function deletePrivateSubject(id: string) {
  const userId = await getUserId()
  await db.update(task).set({ subjectId: null, updatedAt: new Date() }).where(and(eq(task.userId, userId), eq(task.subjectId, id)))
  await db.delete(subject).where(and(eq(subject.id, id), eq(subject.userId, userId)))
  return { ok: true }
}

export async function getPrivateTasks() {
  const userId = await getUserId()
  return db.select().from(task).where(eq(task.userId, userId)).orderBy(task.createdAt)
}

export async function createPrivateTask(input: { title: string; category?: string; priority?: string; time?: string; subjectId?: string }) {
  const userId = await getUserId()
  const title = input.title.trim().slice(0, 240)
  if (!title) throw new Error('Task title is required')
  const created = await db.insert(task).values({ id: crypto.randomUUID(), userId, title, category: input.category ?? 'Today', priority: input.priority ?? 'Medium', time: input.time ?? 'Today', subjectId: input.subjectId ?? null }).returning()
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
