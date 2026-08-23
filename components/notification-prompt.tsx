'use client'

import { useEffect, useMemo, useState } from 'react'

type ReminderTask = { done: boolean; dueDate?: Date | string | null }

function localDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function NotificationPrompt({ tasks }: { tasks: ReminderTask[] }) {
  const [visible, setVisible] = useState(false)
  const today = useMemo(() => localDateKey(new Date()), [])
  const dueToday = tasks.filter((task) => !task.done && task.dueDate && localDateKey(new Date(task.dueDate)) === today).length

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'default') return
    const timer = window.setTimeout(() => setVisible(true), 3500)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !dueToday) return
    const timer = window.setInterval(() => {
      const now = new Date()
      if (now.getHours() === 9 && now.getMinutes() < 1 && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then((registration) => registration.active?.postMessage({ type: 'DAILY_TASK_REMINDER', count: dueToday }))
      }
    }, 60_000)
    return () => window.clearInterval(timer)
  }, [dueToday])

  if (!visible) return null
  const enable = async () => {
    const permission = await Notification.requestPermission()
    setVisible(false)
    if (permission === 'granted') navigator.serviceWorker.ready.then((registration) => registration.active?.postMessage({ type: 'DAILY_TASK_REMINDER', count: dueToday }))
  }

  return <div className="fixed bottom-20 left-4 right-4 z-40 flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-lg lg:bottom-5 lg:left-auto lg:right-5 lg:max-w-sm"><p className="text-pretty text-foreground">Enable daily reminders for tasks due today?</p><div className="flex shrink-0 gap-2"><button onClick={() => setVisible(false)} className="rounded-lg px-2 py-1 text-muted-foreground hover:bg-muted">Not now</button><button onClick={() => void enable()} className="rounded-lg bg-primary px-3 py-1 text-primary-foreground">Enable</button></div></div>
}
