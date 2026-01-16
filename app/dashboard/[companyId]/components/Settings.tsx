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
  webhookSecretToken: string
}

interface SavedData {
  accountId: string
  clientId: string
  sdkKey: string
  permanentMeetingId: string
}

const WEBHOOK_URL = 'https://whop-zoom-marketplace-app.vercel.app/api/zoom/webhook'

export default function Settings({ companyId, onConfigUpdate }: SettingsProps) {
  const [formData, setFormData] = useState<FormData>({
    accountId: '',
    clientId: '',
    clientSecret: '',
    sdkKey: '',
    sdkSecret: '',
    permanentMeetingId: '',
    webhookSecretToken: ''
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [savedData, setSavedData] = useState<SavedData>({ accountId: '', clientId: '', sdkKey: '', permanentMeetingId: '' })
  const [copied, setCopied] = useState(false)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    startTitle: 'Meeting Started!',
    startBody: 'A Zoom meeting is now live. Join now!',
    endTitle: 'Meeting Ended',
    endBody: 'The Zoom meeting has ended.'
  })

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
          webhookSecretToken: ''
        })
        setSavedData({
          accountId: data.accountId || '',
          clientId: data.clientId || '',
          sdkKey: data.sdkKey || '',
          permanentMeetingId: data.permanentMeetingId || ''
        })
        if (data.notificationSettings) {
          setNotificationSettings(data.notificationSettings)
        }
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
          webhookSecretToken: formData.webhookSecretToken,
          defaultMeetingTitle: 'Meeting',
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
          defaultMeetingTitle: 'Meeting',
          adminUsernames: []
        })
        // Clear secrets after save and update saved data
        setFormData(prev => ({ ...prev, clientSecret: '', sdkSecret: '', webhookSecretToken: '' }))
        setSavedData({
          accountId: formData.accountId || savedData.accountId,
          clientId: formData.clientId || savedData.clientId,
          sdkKey: formData.sdkKey || savedData.sdkKey,
          permanentMeetingId: formData.permanentMeetingId || savedData.permanentMeetingId
        })
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

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(WEBHOOK_URL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const abbrev = (value: string) => {
    if (!value || value.length < 8) return ''
    return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-zinc-300 mt-1">Configure your Zoom integration</p>
        </div>
        <button
          type="button"
          onClick={() => setShowNotificationModal(true)}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors flex items-center gap-2"
        >
          <BellIcon className="w-4 h-4" />
          Notifications
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border border-red-500/20 text-red-500'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Two column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                placeholder={savedData.accountId ? `Current: ${abbrev(savedData.accountId)}` : 'Your Zoom Account ID'}
              />
              <InputField
                label="Client ID"
                name="clientId"
                value={formData.clientId}
                onChange={handleChange}
                placeholder={savedData.clientId ? `Current: ${abbrev(savedData.clientId)}` : 'OAuth Client ID'}
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
                placeholder={savedData.sdkKey ? `Current: ${abbrev(savedData.sdkKey)}` : 'Your SDK Key'}
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

          {/* Meeting Settings */}
          <div className="bg-[#151515] border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-zinc-700 rounded-xl flex items-center justify-center">
                <SettingsIcon className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold">Meeting Settings</h2>
                <p className="text-zinc-300 text-sm">Your Zoom meeting configuration</p>
              </div>
            </div>

            <div className="space-y-4">
              <InputField
                label="Meeting ID"
                name="permanentMeetingId"
                value={formData.permanentMeetingId}
                onChange={handleChange}
                placeholder={savedData.permanentMeetingId ? `Current: ${savedData.permanentMeetingId}` : 'Your Zoom Meeting ID'}
                hint="Find this in your Zoom app or at zoom.us/meeting"
              />
            </div>
          </div>

          {/* Webhook Settings */}
          <div className="bg-[#151515] border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <WebhookIcon className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-white font-semibold">Webhook Settings</h2>
                <p className="text-zinc-300 text-sm">Required for live meeting detection</p>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 mb-4">
              <p className="text-zinc-400 text-xs mb-2">Webhook URL (add to Zoom app):</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-zinc-800 px-3 py-2 rounded-lg text-emerald-400 text-xs truncate">
                  {WEBHOOK_URL}
                </code>
                <button
                  type="button"
                  onClick={copyWebhookUrl}
                  className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors flex-shrink-0"
                >
                  {copied ? (
                    <CheckIcon className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <CopyIcon className="w-4 h-4 text-zinc-300" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <InputField
                label="Webhook Secret Token"
                name="webhookSecretToken"
                value={formData.webhookSecretToken}
                onChange={handleChange}
                placeholder="••••••••••••••••"
                type="password"
                hint="Found in Zoom app's Event Subscriptions. Leave blank to keep existing."
              />
            </div>
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

      {/* Notification Settings Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#151515] border border-zinc-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <BellIcon className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h2 className="text-white font-semibold">Notification Settings</h2>
                  <p className="text-zinc-400 text-sm">Customize push notifications</p>
                </div>
              </div>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Meeting Started */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <h3 className="text-white font-medium">Meeting Started</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Title</label>
                    <input
                      type="text"
                      value={notificationSettings.startTitle}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, startTitle: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Body</label>
                    <input
                      type="text"
                      value={notificationSettings.startBody}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, startBody: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Meeting Ended */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <h3 className="text-white font-medium">Meeting Ended</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Title</label>
                    <input
                      type="text"
                      value={notificationSettings.endTitle}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, endTitle: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Body</label>
                    <input
                      type="text"
                      value={notificationSettings.endBody}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, endBody: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
                <p className="text-zinc-400 text-xs">
                  Notifications will be sent to all users subscribed to this experience when meetings start or end.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNotificationModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/settings/zoom?companyId=${companyId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          companyId,
                          notificationSettings,
                          skipValidation: true
                        })
                      })
                      if (response.ok) {
                        setShowNotificationModal(false)
                        setMessage({ type: 'success', text: 'Notification settings saved!' })
                      } else {
                        setMessage({ type: 'error', text: 'Failed to save notification settings' })
                      }
                    } catch {
                      setMessage({ type: 'error', text: 'Failed to save notification settings' })
                    }
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
                >
                  Save Notifications
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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

function WebhookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
