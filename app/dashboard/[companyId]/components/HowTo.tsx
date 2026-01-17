'use client'

export default function HowTo() {
  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">How To Setup</h1>
        <p className="text-zinc-500 mt-1">Follow these steps to configure your Zoom integration</p>
      </div>

      {/* Requirements */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertIcon className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-lg mb-2">Requirements</h2>
            <p className="text-zinc-300 mb-3">
              To use this integration, you need a <strong className="text-white">Zoom Pro, Business, or Enterprise</strong> account.
            </p>
            <p className="text-zinc-300">
              Free Zoom accounts do not have access to the Zoom Marketplace to create Server-to-Server OAuth or Meeting SDK apps.
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Create Zoom App */}
      <div className="bg-[#151515] border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-500 font-bold">1</span>
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-lg mb-2">Create a Zoom Server-to-Server OAuth App</h2>
            <p className="text-zinc-300 mb-4">
              This app type allows your integration to access Zoom APIs without user interaction.
            </p>
            <ol className="list-decimal list-inside space-y-3 text-zinc-300 mb-4">
              <li>Go to the <a href="https://marketplace.zoom.us/" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">Zoom App Marketplace</a></li>
              <li>Click <strong className="text-white">Develop</strong> → <strong className="text-white">Build App</strong></li>
              <li>Select <strong className="text-white">Server-to-Server OAuth</strong> app type</li>
              <li>Give your app a name (e.g., "Whop Zoom Integration")</li>
              <li>Click <strong className="text-white">Create</strong></li>
            </ol>
            <div className="bg-zinc-900 rounded-xl p-4">
              <p className="text-zinc-300 mb-3">From this app, you'll need:</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  <span className="text-white">Account ID</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  <span className="text-white">Client ID</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  <span className="text-white">Client Secret</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Add Scopes */}
      <div className="bg-[#151515] border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-500 font-bold">2</span>
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-lg mb-2">Add Required Scopes</h2>
            <p className="text-zinc-300 mb-4">
              In your Server-to-Server OAuth app, go to the <strong className="text-white">Scopes</strong> tab and add these permissions:
            </p>
            <div className="bg-zinc-900 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                <code className="text-emerald-400 text-sm">meeting:write:admin</code>
                <span className="text-zinc-500 text-xs">Create meetings</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                <code className="text-emerald-400 text-sm">meeting:read:admin</code>
                <span className="text-zinc-500 text-xs">Read meeting info</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                <code className="text-emerald-400 text-sm">user:read:admin</code>
                <span className="text-zinc-500 text-xs">Read user info</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <code className="text-emerald-400 text-sm">meeting:update:admin</code>
                <span className="text-zinc-500 text-xs">Update meetings</span>
              </div>
            </div>
            <p className="text-zinc-300 mt-4">
              After adding scopes, click <strong className="text-white">Activate</strong> to enable your app.
            </p>
          </div>
        </div>
      </div>

      {/* Step 3: Create Meeting SDK App */}
      <div className="bg-[#151515] border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-500 font-bold">3</span>
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-lg mb-2">Create a Meeting SDK App</h2>
            <p className="text-zinc-300 mb-4">
              This app type allows users to join meetings directly in the browser.
            </p>
            <ol className="list-decimal list-inside space-y-3 text-zinc-300 mb-4">
              <li>Go back to <a href="https://marketplace.zoom.us/" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">Zoom App Marketplace</a></li>
              <li>Click <strong className="text-white">Develop</strong> → <strong className="text-white">Build App</strong></li>
              <li>Select <strong className="text-white">Meeting SDK</strong> app type</li>
              <li>Give your app a name (e.g., "Whop Meeting SDK")</li>
              <li>Click <strong className="text-white">Create</strong></li>
            </ol>
            
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
              <p className="text-amber-400 font-medium mb-2">⚠️ Important: Use Development Credentials</p>
              <p className="text-zinc-300 text-sm">
                Until your Meeting SDK app is published, you must use <strong className="text-white">Development</strong> credentials, not Production. 
                In your Meeting SDK app, look for the <strong className="text-white">App Credentials</strong> section and make sure you're on the <strong className="text-white">Development</strong> tab.
              </p>
            </div>
            
            <div className="bg-zinc-900 rounded-xl p-4">
              <p className="text-zinc-300 mb-3">From this app (Development tab), you'll need:</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-white">SDK Key (Client ID)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-white">SDK Secret (Client Secret)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3.5: Add Domain Allowlist */}
      <div className="bg-[#151515] border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-500 font-bold">3b</span>
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-lg mb-2">Add Domain to Allowlist</h2>
            <p className="text-zinc-300 mb-4">
              Your Meeting SDK app needs to know which domains are allowed to use it.
            </p>
            <ol className="list-decimal list-inside space-y-3 text-zinc-300 mb-4">
              <li>In your Meeting SDK app, go to the <strong className="text-white">Features</strong> or <strong className="text-white">Embed</strong> section</li>
              <li>Find <strong className="text-white">Domain Allowlist</strong></li>
              <li>Add your Whop app domain (e.g., <code className="text-emerald-400 bg-zinc-800 px-2 py-0.5 rounded">yourapp.apps.whop.com</code>)</li>
              <li>Click <strong className="text-white">Save</strong></li>
            </ol>
            <div className="bg-zinc-900 rounded-xl p-4">
              <p className="text-zinc-300 mb-2">Your Whop app domain looks like:</p>
              <code className="text-emerald-400 text-sm">xxxxxxxx.apps.whop.com</code>
              <p className="text-zinc-500 text-xs mt-2">You can find this in your browser's address bar when viewing your app on Whop.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 4: Get Your Meeting ID */}
      <div className="bg-[#151515] border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-500 font-bold">4</span>
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-lg mb-2">Get Your Meeting ID</h2>
            <p className="text-zinc-300 mb-4">
              You'll need a Zoom Meeting ID to connect your members to your meeting.
            </p>
            <ol className="list-decimal list-inside space-y-3 text-zinc-300 mb-4">
              <li>Open the <strong className="text-white">Zoom app</strong> or go to <a href="https://zoom.us/meeting" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">zoom.us/meeting</a></li>
              <li>Click <strong className="text-white">Schedule a Meeting</strong> or use an existing meeting</li>
              <li>Copy the <strong className="text-white">Meeting ID</strong> (a 9-11 digit number like 123 456 7890)</li>
            </ol>
            <div className="bg-zinc-900 rounded-xl p-4">
              <p className="text-zinc-300 mb-2">Pro tip:</p>
              <p className="text-zinc-400">Create a <strong className="text-white">recurring meeting</strong> so you can reuse the same Meeting ID for all your sessions.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 4b: Starting Your Meeting */}
      <div className="bg-[#151515] border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-500 font-bold">4b</span>
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-lg mb-2">Starting Your Meeting</h2>
            <p className="text-zinc-300 mb-4">
              When you're ready to go live, start your meeting from the <strong className="text-white">Zoom desktop app</strong>.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
              <p className="text-amber-400 font-medium mb-2">⚠️ Important: Use the Desktop App</p>
              <p className="text-zinc-300 text-sm">
                You must start the meeting as the host using the <strong className="text-white">Zoom desktop application</strong> on your computer. 
                Your members will then be able to join and watch through the Whop app in their browser.
              </p>
            </div>
            <ol className="list-decimal list-inside space-y-3 text-zinc-300">
              <li>Open the <strong className="text-white">Zoom desktop app</strong> on your computer</li>
              <li>Sign in with the same Zoom account used for your API credentials</li>
              <li>Start your scheduled meeting or use your Personal Meeting ID</li>
              <li>Your members will automatically see the meeting is live on Whop</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Step 5: Enter Credentials */}
      <div className="bg-[#151515] border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-500 font-bold">5</span>
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-lg mb-2">Enter Your Credentials</h2>
            <p className="text-zinc-300 mb-4">
              Go to the <strong className="text-white">Configure Settings</strong> tab and enter all the credentials you collected:
            </p>
            <div className="bg-zinc-900 rounded-xl p-4 space-y-4">
              <div>
                <p className="text-zinc-300 mb-2">From Server-to-Server OAuth App:</p>
                <ul className="space-y-2 text-white">
                  <li>• Account ID</li>
                  <li>• Client ID</li>
                  <li>• Client Secret</li>
                </ul>
              </div>
              <div className="border-t border-zinc-800 pt-4">
                <p className="text-zinc-300 mb-2">From Meeting SDK App:</p>
                <ul className="space-y-2 text-white">
                  <li>• SDK Key</li>
                  <li>• SDK Secret</li>
                </ul>
              </div>
              <div className="border-t border-zinc-800 pt-4">
                <p className="text-zinc-300 mb-2">Your Meeting:</p>
                <ul className="space-y-2 text-white">
                  <li>• Meeting ID</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <InfoIcon className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-lg mb-2">Tips</h2>
            <ul className="space-y-2 text-zinc-300">
              <li>• Make sure your Server-to-Server OAuth app is <strong className="text-white">activated</strong> before testing</li>
              <li>• Use <strong className="text-white">Development credentials</strong> for Meeting SDK until your app is published</li>
              <li>• The SDK Key and SDK Secret are different from the OAuth Client ID and Secret</li>
              <li>• If you get "Signature is invalid" errors, check that your domain is in the Meeting SDK allowlist</li>
              <li>• Make sure you're using the correct credentials from the <strong className="text-white">Development</strong> tab (not Production)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Help Link */}
      <div className="text-center py-4">
        <p className="text-zinc-500 text-sm">
          Need more help? Visit the{' '}
          <a 
            href="https://developers.zoom.us/docs/meeting-sdk/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-emerald-500 hover:underline"
          >
            Zoom Developer Documentation
          </a>
        </p>
      </div>
    </div>
  )
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}
