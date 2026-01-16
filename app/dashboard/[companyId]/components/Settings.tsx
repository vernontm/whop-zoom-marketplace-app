'use client'

import { useState, useEffect } from 'react'
import { ZoomConfig } from '../DashboardClient'

interface SettingsProps {
  companyId: string
  onConfigUpdate: (config: ZoomConfig) => void
}

interface FormData {
  accountId: string
  clientId: string
  clientSecret: string
  sdkKey: string
  sdkSecret: string
  permanentMeetingId: string
  defaultMeetingTitle: string
}

export default function Settings({ companyId, onConfigUpdate }: SettingsProps) {
  const [formData, setFormData] = useState<FormData>({
    accountId: '',
    clientId: '',
    clientSecret: '',
    sdkKey: '',
    sdkSecret: '',
    permanentMeetingId: '',
    defaultMeetingTitle: 'Meeting'
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/settings/zoom?companyId=${companyId}`)
      const data = await response.json()
      if (data.configured) {
        setFormData({
          accountId: data.accountId || '',
          clientId: data.clientId || '',
          clientSecret: '',
          sdkKey: data.sdkKey || '',
          sdkSecret: '',
          permanentMeetingId: data.permanentMeetingId || '',
          defaultMeetingTitle: data.defaultMeetingTitle || 'Livestream'
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/settings/zoom?companyId=${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          accountId: formData.accountId,
          clientId: formData.clientId,
          clientSecret: formData.clientSecret,
          sdkKey: formData.sdkKey,
          sdkSecret: formData.sdkSecret,
          permanentMeetingId: formData.permanentMeetingId,
          defaultMeetingTitle: formData.defaultMeetingTitle,
          adminUsernames: [],
          skipValidation: true
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
        onConfigUpdate({
          configured: true,
          accountId: formData.accountId,
          clientId: formData.clientId,
          sdkKey: formData.sdkKey,
          defaultMeetingTitle: formData.defaultMeetingTitle,
          adminUsernames: []
        })
        // Clear secrets after save
        setFormData(prev => ({ ...prev, clientSecret: '', sdkSecret: '' }))
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-zinc-300 mt-1">Configure your Zoom integration</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border border-red-500/20 text-red-500'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Server-to-Server OAuth */}
        <div className="bg-[#151515] border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <ServerIcon className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Server-to-Server OAuth</h2>
              <p className="text-zinc-300 text-sm">For creating and managing meetings</p>
            </div>
          </div>

          <div className="space-y-4">
            <InputField
              label="Account ID"
              name="accountId"
              value={formData.accountId}
              onChange={handleChange}
              placeholder="Your Zoom Account ID"
            />
            <InputField
              label="Client ID"
              name="clientId"
              value={formData.clientId}
              onChange={handleChange}
              placeholder="OAuth Client ID"
            />
            <InputField
              label="Client Secret"
              name="clientSecret"
              value={formData.clientSecret}
              onChange={handleChange}
              placeholder="••••••••••••••••"
              type="password"
              hint="Leave blank to keep existing"
            />
          </div>
        </div>

        {/* Meeting SDK */}
        <div className="bg-[#151515] border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <VideoIcon className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Meeting SDK</h2>
              <p className="text-zinc-300 text-sm">For embedding meetings in your app</p>
            </div>
          </div>

          <div className="space-y-4">
            <InputField
              label="SDK Key"
              name="sdkKey"
              value={formData.sdkKey}
              onChange={handleChange}
              placeholder="Your SDK Key"
            />
            <InputField
              label="SDK Secret"
              name="sdkSecret"
              value={formData.sdkSecret}
              onChange={handleChange}
              placeholder="••••••••••••••••"
              type="password"
              hint="Leave blank to keep existing"
            />
          </div>
        </div>

        {/* Additional Settings */}
        <div className="bg-[#151515] border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-zinc-700 rounded-xl flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Additional Settings</h2>
              <p className="text-zinc-300 text-sm">Optional configuration</p>
            </div>
          </div>

          <div className="space-y-4">
            <InputField
              label="Default Meeting Title"
              name="defaultMeetingTitle"
              value={formData.defaultMeetingTitle}
              onChange={handleChange}
              placeholder="Livestream"
            />
            <InputField
              label="Meeting ID"
              name="permanentMeetingId"
              value={formData.permanentMeetingId}
              onChange={handleChange}
              placeholder="Your Zoom Meeting ID"
              required
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <p className="text-zinc-500 text-sm">
            Need help? <a href="https://marketplace.zoom.us/" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">Visit Zoom Marketplace</a>
          </p>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

interface InputFieldProps {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
  hint?: string
  required?: boolean
}

function InputField({ label, name, value, onChange, placeholder, type = 'text', hint, required }: InputFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-white mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
      />
      {hint && <p className="text-zinc-400 text-xs mt-1">{hint}</p>}
    </div>
  )
}

function ServerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
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

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
