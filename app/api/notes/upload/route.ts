'use server'

import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { notes, subject } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'

const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const form = await request.formData()
  const file = form.get('file')
  const title = String(form.get('title') ?? '').trim().slice(0, 160)
  const subjectId = String(form.get('subjectId') ?? '')
  if (!(file instanceof File) || file.type !== 'application/pdf') return NextResponse.json({ error: 'Please choose a PDF file.' }, { status: 400 })
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'PDFs must be 10MB or smaller.' }, { status: 413 })
  if (!title || !subjectId) return NextResponse.json({ error: 'Title and subject are required.' }, { status: 400 })
  const ownedSubject = await db.select({ id: subject.id }).from(subject).where(and(eq(subject.id, subjectId), eq(subject.userId, session.user.id))).limit(1)
  if (!ownedSubject[0]) return NextResponse.json({ error: 'Subject not found.' }, { status: 404 })
  try {
    const id = crypto.randomUUID()
    const blob = await put(`notes/${session.user.id}/${id}-${file.name}`, file, { access: 'private', addRandomSuffix: false, contentType: 'application/pdf' })
    const created = await db.insert(notes).values({ id, userId: session.user.id, subjectId, customTitle: title, originalFilename: file.name, fileUrl: blob.pathname, fileSize: file.size }).returning()
    return NextResponse.json({ note: created[0] })
  } catch (error) {
    console.error('[v0] PDF upload failed', error)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }
}
