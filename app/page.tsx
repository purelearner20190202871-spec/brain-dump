import { BrainDumpDashboard } from '@/components/brain-dump-dashboard'
import { auth } from '@/lib/auth'
import { getPrivateDump, getPrivateNotes, getPrivateSubjects, getPrivateTasks, getTodayFocusMinutes } from '@/app/actions/brain-dump'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  const [dump, tasks, subjects, notes, focusMinutes] = await Promise.all([getPrivateDump(), getPrivateTasks(), getPrivateSubjects(), getPrivateNotes(), getTodayFocusMinutes()])
  const today = new Date()
  const dateLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(today)
  return <BrainDumpDashboard initialDump={dump} initialTasks={tasks} initialSubjects={subjects} initialNotes={notes} initialFocusMinutes={focusMinutes} userName={session.user.name} dateLabel={dateLabel} />
}
