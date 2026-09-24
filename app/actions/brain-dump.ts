'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { brainDump, focusSessions, notes, subject, syllabusTopics, task } from '@/lib/db/schema'
import { del } from '@vercel/blob'
import { and, eq, gte, sql } from 'drizzle-orm'
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

export async function getPrivateSyllabusTopics() {
  const userId = await getUserId()
  return db.select().from(syllabusTopics).where(eq(syllabusTopics.userId, userId)).orderBy(syllabusTopics.createdAt)
}

export async function createPrivateSyllabusTopic(subjectId: string, name: string) {
  const userId = await getUserId()
  const cleanName = name.trim().slice(0, 160)
  if (!cleanName) throw new Error('Topic name is required')
  const ownedSubject = await db.select({ id: subject.id }).from(subject).where(and(eq(subject.id, subjectId), eq(subject.userId, userId))).limit(1)
  if (!ownedSubject[0]) throw new Error('Subject not found')
  const created = await db.insert(syllabusTopics).values({ id: crypto.randomUUID(), userId, subjectId, name: cleanName }).returning()
  return created[0]
}

export async function togglePrivateSyllabusTopic(id: string, covered: boolean) {
  const userId = await getUserId()
  const updated = await db.update(syllabusTopics).set({ covered }).where(and(eq(syllabusTopics.id, id), eq(syllabusTopics.userId, userId))).returning()
  if (!updated[0]) throw new Error('Topic not found')
  return updated[0]
}

export async function deletePrivateSyllabusTopic(id: string) {
  const userId = await getUserId()
  await db.delete(syllabusTopics).where(and(eq(syllabusTopics.id, id), eq(syllabusTopics.userId, userId)))
  return { ok: true }
}

export async function getPrivateTasks() {
  const userId = await getUserId()
  return db.select().from(task).where(eq(task.userId, userId)).orderBy(task.createdAt)
}

export async function createPrivateTask(input: { title: string; category?: string; priority?: string; time?: string; dueDate?: Date | null; subjectId?: string }) {
  const userId = await getUserId()
  const title = input.title.trim().slice(0, 240)
  if (!title) throw new Error('Task title is required')
  const created = await db.insert(task).values({ id: crypto.randomUUID(), userId, title, category: input.category ?? 'Today', priority: input.priority ?? 'Medium', time: input.time ?? 'Today', dueDate: input.dueDate ?? null, subjectId: input.subjectId ?? null }).returning()
  return created[0]
}

export async function togglePrivateTask(id: string, done: boolean) {
  const userId = await getUserId()
  const updated = await db.update(task).set({ done, updatedAt: new Date() }).where(and(eq(task.id, id), eq(task.userId, userId))).returning()
  if (!updated[0]) throw new Error('Task not found')
  return updated[0]
}

export async function getPrivateNotes() {
  const userId = await getUserId()
  return db.select().from(notes).where(eq(notes.userId, userId)).orderBy(notes.uploadedAt)
}

export async function togglePrivateNote(id: string, isImportant: boolean) {
  const userId = await getUserId()
  const updated = await db.update(notes).set({ isImportant }).where(and(eq(notes.id, id), eq(notes.userId, userId))).returning()
  if (!updated[0]) throw new Error('Note not found')
  return updated[0]
}

export async function deletePrivateNote(id: string) {
  const userId = await getUserId()
  const found = await db.select().from(notes).where(and(eq(notes.id, id), eq(notes.userId, userId))).limit(1)
  if (!found[0]) throw new Error('Note not found')
  await del(found[0].fileUrl)
  await db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, userId)))
  return { ok: true }
}

export async function getTodayFocusMinutes() {
  const userId = await getUserId()
  const start = new Date(); start.setHours(0, 0, 0, 0)
  const result = await db.select({ total: sql<number>`coalesce(sum(${focusSessions.durationMinutes}), 0)` }).from(focusSessions).where(and(eq(focusSessions.userId, userId), gte(focusSessions.completedAt, start)))
  return Number(result[0]?.total ?? 0)
}

export async function completeFocusSession(input: { durationMinutes: number; taskId?: string | null }) {
  const userId = await getUserId()
  const durationMinutes = Math.max(1, Math.min(240, Math.floor(input.durationMinutes)))
  const created = await db.insert(focusSessions).values({ id: crypto.randomUUID(), userId, taskId: input.taskId ?? null, durationMinutes }).returning()
  return created[0]
}

export async function deletePrivateTask(id: string) {
  const userId = await getUserId()
  const deleted = await db.delete(task).where(and(eq(task.id, id), eq(task.userId, userId))).returning({ id: task.id })
  if (!deleted[0]) throw new Error('Task not found')
  return { ok: true }
}
