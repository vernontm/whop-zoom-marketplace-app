'use client'

import { useState } from 'react'

interface ClientPreviewProps {
  companyId: string
}

export default function ClientPreview({ companyId }: ClientPreviewProps) {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Client Preview</h2>
          <p className="text-zinc-400 text-sm">Preview what your users will see</p>
        </div>
        <a
          href={`/experiences/${companyId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Open Full Page
        </a>
      </div>

      <div className="relative bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
              <span className="text-zinc-400 text-sm">Loading preview...</span>
            </div>
          </div>
        )}
        <iframe
          src={`/experiences/${companyId}`}
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          title="Client Preview"
        />
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-zinc-300 text-sm font-medium">Preview Mode</p>
            <p className="text-zinc-500 text-xs mt-1">
              This is a live preview of your client page. Changes to settings will be reflected here after saving.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
