'use client'

interface AnalyticsProps {
  companyId: string
}

export default function Analytics({ companyId }: AnalyticsProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-zinc-500 mt-1">Track your meeting performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Streams" value="0" icon={<VideoIcon />} />
        <StatCard label="Total Duration" value="0h" icon={<ClockIcon />} />
        <StatCard label="Peak Viewers" value="0" icon={<UsersIcon />} />
        <StatCard label="Avg. Duration" value="0m" icon={<ChartIcon />} />
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#151515] border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Stream Activity</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <ChartIcon className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">No data yet</p>
              <p className="text-zinc-600 text-sm">Start streaming to see analytics</p>
            </div>
          </div>
        </div>

        <div className="bg-[#151515] border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Viewer Trends</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <UsersIcon className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">No data yet</p>
              <p className="text-zinc-600 text-sm">Viewer data will appear here</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-gradient-to-r from-emerald-500/5 to-transparent border border-emerald-500/10 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <SparklesIcon className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-white font-semibold mb-1">Analytics Coming Soon</h3>
            <p className="text-zinc-400 text-sm">
              We're building comprehensive analytics to help you understand your audience better. 
              Track viewer counts, engagement metrics, peak times, and more.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  icon: React.ReactNode
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="bg-[#151515] border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-zinc-500 text-sm">{label}</span>
        <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500">
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

function VideoIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

function ClockIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function UsersIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function ChartIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  )
}
