import { BrainDumpDashboard } from '@/components/brain-dump-dashboard'
import { auth } from '@/lib/auth'
import { getPrivateDump, getPrivateNotes, getPrivateSubjects, getPrivateSyllabusTopics, getPrivateTasks, getTodayFocusMinutes } from '@/app/actions/brain-dump'
import { getTimetableData } from '@/app/actions/timetable'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  const [dump, tasks, subjects, notes, focusMinutes, syllabusTopics, timetable] = await Promise.all([getPrivateDump(), getPrivateTasks(), getPrivateSubjects(), getPrivateNotes(), getTodayFocusMinutes(), getPrivateSyllabusTopics(), getTimetableData()])
  const today = new Date()
  const dateLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(today)
  const todayDay = today.getDay() || 7
  const initialTodayTimetableEntries = timetable.entries.filter((entry: any) => entry.dayOfWeek === todayDay && (!timetable.labGroup || !entry.groupLabel || entry.groupLabel === timetable.labGroup)).sort((a: any, b: any) => a.startTime.localeCompare(b.startTime))
  return <BrainDumpDashboard initialDump={dump} initialTasks={tasks} initialSubjects={subjects} initialNotes={notes} initialFocusMinutes={focusMinutes} initialSyllabusTopics={syllabusTopics} initialTimetableEntries={timetable.entries} initialTodayTimetableEntries={initialTodayTimetableEntries} initialLabGroup={timetable.labGroup} studentProfile={{ collegeId: timetable.collegeId, branch: timetable.branch, semester: timetable.semester }} userName={session.user.name} dateLabel={dateLabel} />
}
