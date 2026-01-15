'use client'

import { useState, useEffect } from 'react'

interface MeetingsProps {
  companyId: string
}

interface Meeting {
  id: string
  title: string
  date: string
  duration: string
  status: 'live' | 'ended' | 'scheduled'
}

export default function Meetings({ companyId }: MeetingsProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'live' | 'ended'>('all')

  useEffect(() => {
    // For now, show empty state - meetings history will be implemented
    setLoading(false)
  }, [companyId])

  const filteredMeetings = meetings.filter(m => {
    if (filter === 'all') return true
    return m.status === filter
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Meetings</h1>
          <p className="text-zinc-500 mt-1">View and manage your livestreams</p>
        </div>
        <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          New Meeting
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {(['all', 'live', 'ended'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Meetings Table */}
      <div className="bg-[#151515] border border-zinc-800 rounded-2xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-zinc-800 text-zinc-500 text-sm font-medium">
          <div className="col-span-5">Meeting</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Duration</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1"></div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : filteredMeetings.length > 0 ? (
          <div className="divide-y divide-zinc-800">
            {filteredMeetings.map((meeting) => (
              <div key={meeting.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-zinc-800/50 transition-colors">
                <div className="col-span-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                      <VideoIcon className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{meeting.title}</p>
                      <p className="text-zinc-500 text-sm">ID: {meeting.id}</p>
                    </div>
                  </div>
                </div>
                <div className="col-span-2 text-zinc-400">{meeting.date}</div>
                <div className="col-span-2 text-zinc-400">{meeting.duration}</div>
                <div className="col-span-2">
                  <StatusBadge status={meeting.status} />
                </div>
                <div className="col-span-1 text-right">
                  <button className="p-2 hover:bg-zinc-700 rounded-lg transition-colors">
                    <MoreIcon className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
              <VideoIcon className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-white font-semibold mb-1">No meetings yet</h3>
            <p className="text-zinc-500 text-sm max-w-sm">
              Start your first livestream to see it here. Meeting history will be tracked automatically.
            </p>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-start gap-3">
        <InfoIcon className="w-5 h-5 text-zinc-500 mt-0.5" />
        <div>
          <p className="text-zinc-400 text-sm">
            Meeting history is tracked automatically when you start livestreams. Past meetings will appear here with duration and viewer stats.
          </p>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: 'live' | 'ended' | 'scheduled' }) {
  const styles = {
    live: 'bg-red-500/10 text-red-500',
    ended: 'bg-zinc-700 text-zinc-400',
    scheduled: 'bg-blue-500/10 text-blue-500'
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status === 'live' && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
  )
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
