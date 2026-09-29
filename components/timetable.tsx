'use client'

import { useMemo, useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { loadStarterTimetable, saveLabGroup } from '@/app/actions/timetable'

type Entry = { id: string; dayOfWeek: number; startTime: string; endTime: string; title: string; kind: string; groupLabel: string | null }
type Subject = { id: string; name: string; color: string }

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
const schedule = [
  ['10:00', '12:00', 'Sports', 1, 'other'], ['12:00', '13:00', 'Oscillations, Waves and Optics', 1, 'lecture'], ['13:00', '14:00', 'Computer Programming', 1, 'lecture'], ['14:00', '15:00', 'Lunch', 1, 'break'], ['17:00', '18:00', 'Computer Programming Lab', 1, 'lab'],
  ['10:00', '12:00', 'Sports', 2, 'other'], ['12:00', '13:00', 'Mathematics-I', 2, 'lecture'], ['13:00', '14:00', 'Engineering Graphics and CAD', 2, 'lecture'], ['14:00', '15:00', 'Basics of Analog and Digital Electronics', 2, 'lecture'], ['16:00', '17:00', 'Computer Programming', 2, 'lecture'],
  ['11:00', '12:00', 'Oscillations, Waves and Optics Lab', 3, 'lab'], ['12:00', '13:00', 'Oscillations, Waves and Optics', 3, 'lecture'], ['16:00', '17:00', 'Engineering Graphics and CAD Lab', 3, 'lab'],
  ['13:00', '14:00', 'Basics of Analog and Digital Electronics Lab', 4, 'lab'], ['14:00', '15:00', 'Basics of Analog and Digital Electronics', 4, 'lecture'], ['15:00', '16:00', 'Computer Programming', 4, 'lecture'], ['16:00', '17:00', 'Engineering Graphics and CAD', 4, 'lecture'], ['17:00', '18:00', 'Mathematics-I', 4, 'lecture'],
  ['11:00', '12:00', 'Mathematics-I Tutorial', 5, 'tutorial'], ['12:00', '13:00', 'Oscillations, Waves and Optics', 5, 'lecture'], ['13:00', '14:00', 'Basics of Analog and Digital Electronics', 5, 'lecture'], ['14:00', '15:00', 'Mathematics-I', 5, 'lecture'], ['15:00', '16:00', 'Engineering Graphics and CAD', 5, 'lecture'],
] as const

const colors: Record<string, string> = { Mathematics: 'bg-amber-100 text-amber-950 border-amber-200', Computer: 'bg-sky-100 text-sky-950 border-sky-200', Oscillations: 'bg-violet-100 text-violet-950 border-violet-200', Engineering: 'bg-emerald-100 text-emerald-950 border-emerald-200', Basics: 'bg-rose-100 text-rose-950 border-rose-200', Sports: 'bg-cyan-100 text-cyan-950 border-cyan-200', Lunch: 'bg-muted text-muted-foreground border-border' }
const clock = (time: string) => Number(time.slice(0, 2))
const label = (time: string) => { const h = Number(time.slice(0, 2)); return `${h > 12 ? h - 12 : h || 12}:00 ${h >= 12 ? 'PM' : 'AM'}` }

export function Timetable({ initialEntries, initialGroup }: { initialEntries: Entry[]; initialGroup: string | null; subjects: Subject[] }) {
  const [group, setGroup] = useState<'G1' | 'G2' | null>((initialGroup as 'G1' | 'G2' | null) ?? 'G2')
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [loading, setLoading] = useState(false)
  const visible = useMemo(() => {
    if (entries.length) return entries.filter((entry) => group === null || !entry.groupLabel || entry.groupLabel === group)
    return schedule.map(([startTime, endTime, title, dayOfWeek, kind], index) => ({ id: `preview-${index}`, startTime, endTime, title, dayOfWeek, kind, groupLabel: null }))
  }, [entries, group])
  const starter = async () => { setLoading(true); const loaded = await loadStarterTimetable({}); setEntries(loaded as Entry[]); setLoading(false) }
  const changeGroup = async (value: 'G1' | 'G2' | null) => { setGroup(value); await saveLabGroup(value) }
  return <section className="relative overflow-hidden rounded-[2rem] border border-accent-violet/20 bg-gradient-to-br from-accent-violet/10 via-card to-accent-teal/10 p-4 shadow-[0_24px_70px_-35px_hsl(var(--accent-violet))] sm:p-6">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-accent-violet">Weekly rhythm</p><h2 className="text-3xl font-semibold tracking-tight">Timetable</h2><p className="mt-1 text-sm text-muted-foreground">Shivam Jha · NSUT · B.Tech GI · Semester 1 · 2026–27</p></div><div className="flex gap-2"><button onClick={starter} disabled={loading} className="inline-flex items-center gap-2 rounded-full border border-accent-violet/25 bg-background/70 px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 hover:bg-accent-violet/10"><Sparkles size={15}/>{loading ? 'Loading…' : 'Load starter'}</button><button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-violet to-accent-teal px-4 py-2.5 text-sm font-semibold text-white shadow-lg"><Plus size={16}/> Add class</button></div></div>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex gap-2"><span className="text-sm font-medium text-muted-foreground">Group</span>{([['G1','G1'],['G2','G2'],[null,'Both']] as const).map(([value,text]) => <button key={text} onClick={() => changeGroup(value)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${group === value ? 'bg-gradient-to-r from-accent-violet to-accent-teal text-white shadow' : 'border border-border bg-background/70 text-muted-foreground hover:border-accent-violet/40'}`}>{text}</button>)}</div><p className="text-xs text-muted-foreground">Showing G2 classes and common periods</p></div>
    <div className="overflow-x-auto rounded-2xl border border-border/70 bg-background/50"><div className="min-w-[900px] grid grid-cols-[92px_repeat(5,minmax(150px,1fr))]"><div className="border-b border-r border-border/70 p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time</div>{days.map((day) => <div key={day} className="border-b border-border/70 bg-accent-violet/5 p-3 text-sm font-semibold">{day}</div>)}{hours.map((time) => <div className="contents" key={time}><div className="border-r border-border/70 px-3 py-4 text-xs font-medium text-muted-foreground">{label(time)}</div>{days.map((_, dayIndex) => { const item = visible.find((entry) => entry.dayOfWeek === dayIndex + 1 && entry.startTime === time); return <div key={`${time}-${dayIndex}`} className="min-h-[70px] border-b border-border/60 p-1.5">{item && <div className={`h-full rounded-xl border p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${colors[Object.keys(colors).find((key) => item.title.startsWith(key)) ?? 'Lunch']}`}><p className="text-xs font-semibold leading-4">{item.title}</p><p className="mt-1 text-[10px] uppercase tracking-wider opacity-70">{item.kind}</p></div>}</div>})}</div>)}</div></div>
  </section>
}

export default Timetable
