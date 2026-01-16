'use client'

import { useState, useEffect } from 'react'

interface SellerSettingsClientProps {
  companyId: string
  companyTitle: string
}

interface ZoomCredentialsForm {
  accountId: string
  clientId: string
  clientSecret: string
  sdkKey: string
  sdkSecret: string
  permanentMeetingId: string
  defaultMeetingTitle: string
}

interface SavedCredentials {
  accountId: string
  clientId: string
  clientSecret: string
  sdkKey: string
  sdkSecret: string
  permanentMeetingId: string
  defaultMeetingTitle: string
  updatedAt: string
}

export default function SellerSettingsClient({ companyId, companyTitle }: SellerSettingsClientProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [configured, setConfigured] = useState(false)
  const [savedCredentials, setSavedCredentials] = useState<SavedCredentials | null>(null)
  
  const [form, setForm] = useState<ZoomCredentialsForm>({
    accountId: '',
    clientId: '',
    clientSecret: '',
    sdkKey: '',
    sdkSecret: '',
    permanentMeetingId: '',
    defaultMeetingTitle: 'Meeting'
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/zoom')
      const data = await response.json()
      
      if (data.configured && data.credentials) {
        setConfigured(true)
        setSavedCredentials(data.credentials)
        setForm(prev => ({
          ...prev,
          permanentMeetingId: data.credentials.permanentMeetingId || '',
          defaultMeetingTitle: data.credentials.defaultMeetingTitle || 'Livestream'
        }))
      }
    } catch (err) {
      console.error('Error fetching settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      const response = await fetch('/api/settings/zoom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings')
      }

      setSuccess('Zoom credentials saved successfully!')
      setConfigured(true)
      
      // Clear sensitive fields after save
      setForm(prev => ({
        ...prev,
        clientSecret: '',
        sdkSecret: ''
      }))
      
      // Refresh to get masked values
      await fetchSettings()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof ZoomCredentialsForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Zoom Integration</h1>
                <p className="text-xs text-zinc-400">{companyTitle}</p>
              </div>
            </div>
            
            {configured && (
              <span className="px-3 py-1 bg-green-600/20 text-green-400 text-sm rounded-full border border-green-600/30">
                Configured
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-600/20 border border-red-600/30 rounded-lg text-red-400">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-600/20 border border-green-600/30 rounded-lg text-green-400">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {success}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mb-8 p-6 bg-zinc-900 rounded-lg border border-zinc-800">
          <h2 className="text-lg font-semibold text-white mb-3">Setup Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-zinc-400 text-sm">
            <li>Go to the <a href="https://marketplace.zoom.us/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Zoom App Marketplace</a></li>
            <li>Create a <strong className="text-white">Server-to-Server OAuth</strong> app for API access</li>
            <li>Create a <strong className="text-white">Meeting SDK</strong> app for embedding meetings</li>
            <li>Copy the credentials below and save</li>
          </ol>
        </div>

        {/* Current Configuration */}
        {configured && savedCredentials && (
          <div className="mb-8 p-6 bg-zinc-900 rounded-lg border border-zinc-800">
            <h2 className="text-lg font-semibold text-white mb-4">Current Configuration</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-zinc-500">Account ID:</span>
                <span className="ml-2 text-white font-mono">{savedCredentials.accountId}</span>
              </div>
              <div>
                <span className="text-zinc-500">Client ID:</span>
                <span className="ml-2 text-white font-mono">{savedCredentials.clientId}</span>
              </div>
              <div>
                <span className="text-zinc-500">SDK Key:</span>
                <span className="ml-2 text-white font-mono">{savedCredentials.sdkKey}</span>
              </div>
              <div>
                <span className="text-zinc-500">Last Updated:</span>
                <span className="ml-2 text-white">{new Date(savedCredentials.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-6 bg-zinc-900 rounded-lg border border-zinc-800">
            <h2 className="text-lg font-semibold text-white mb-4">
              {configured ? 'Update Credentials' : 'Enter Zoom Credentials'}
            </h2>
            
            <div className="space-y-4">
              {/* Server-to-Server OAuth Section */}
              <div className="pb-4 border-b border-zinc-800">
                <h3 className="text-sm font-medium text-zinc-300 mb-3">Server-to-Server OAuth App</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Account ID</label>
                    <input
                      type="text"
                      value={form.accountId}
                      onChange={(e) => handleInputChange('accountId', e.target.value)}
                      placeholder={configured ? 'Leave blank to keep current' : 'Enter Account ID'}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Client ID</label>
                    <input
                      type="text"
                      value={form.clientId}
                      onChange={(e) => handleInputChange('clientId', e.target.value)}
                      placeholder={configured ? 'Leave blank to keep current' : 'Enter Client ID'}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-zinc-400 mb-1">Client Secret</label>
                    <input
                      type="password"
                      value={form.clientSecret}
                      onChange={(e) => handleInputChange('clientSecret', e.target.value)}
                      placeholder={configured ? 'Leave blank to keep current' : 'Enter Client Secret'}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Meeting SDK Section */}
              <div className="pb-4 border-b border-zinc-800">
                <h3 className="text-sm font-medium text-zinc-300 mb-3">Meeting SDK App</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">SDK Key</label>
                    <input
                      type="text"
                      value={form.sdkKey}
                      onChange={(e) => handleInputChange('sdkKey', e.target.value)}
                      placeholder={configured ? 'Leave blank to keep current' : 'Enter SDK Key'}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">SDK Secret</label>
                    <input
                      type="password"
                      value={form.sdkSecret}
                      onChange={(e) => handleInputChange('sdkSecret', e.target.value)}
                      placeholder={configured ? 'Leave blank to keep current' : 'Enter SDK Secret'}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Optional Settings */}
              <div>
                <h3 className="text-sm font-medium text-zinc-300 mb-3">Optional Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Permanent Meeting ID</label>
                    <input
                      type="text"
                      value={form.permanentMeetingId}
                      onChange={(e) => handleInputChange('permanentMeetingId', e.target.value)}
                      placeholder="Optional - for recurring meetings"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Use a specific meeting ID for all streams</p>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Default Meeting Title</label>
                    <input
                      type="text"
                      value={form.defaultMeetingTitle}
                      onChange={(e) => handleInputChange('defaultMeetingTitle', e.target.value)}
                      placeholder="Livestream"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Default title for new meetings</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Credentials
                </>
              )}
            </button>
          </div>
        </form>

        {/* Help Section */}
        <div className="mt-8 p-6 bg-zinc-900/50 rounded-lg border border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-300 mb-2">Need Help?</h3>
          <p className="text-sm text-zinc-500">
            Check out the <a href="https://developers.zoom.us/docs/meeting-sdk/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Zoom Developer Documentation</a> for detailed setup instructions.
          </p>
        </div>
      </main>
    </div>
  )
}
