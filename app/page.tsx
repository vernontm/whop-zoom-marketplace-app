'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard with a default company ID
    // In production, this would get the company ID from Whop headers
    router.replace('/dashboard/demo')
  }, [router])

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-zinc-400">Redirecting to dashboard...</p>
      </div>
    </div>
  )
}
