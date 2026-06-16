import { useState, useEffect } from 'react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      // Prevent Chrome 67+ from auto-showing the prompt
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstall(false)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    console.log('Install prompt outcome:', outcome)
    setDeferredPrompt(null)
    setShowInstall(false)
  }

  const handleDismiss = () => {
    setShowInstall(false)
    // Remember dismissal for 7 days
    localStorage.setItem('installDismissed', Date.now().toString())
  }

  // Don't show if dismissed recently
  if (!showInstall) return null

  const dismissed = localStorage.getItem('installDismissed')
  if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
    return null
  }

  // Don't show if already in standalone mode (installed)
  if (window.matchMedia('(display-mode: standalone)').matches) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:max-w-sm animate-slide-up">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl flex-shrink-0">📱</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm">Install My Dairy Shop</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Add to your home screen for quick access — works like an app!
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="btn-primary h-10 px-4 text-xs flex-shrink-0"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="btn-secondary h-10 px-4 text-xs flex-shrink-0"
              >
                Later
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg flex-shrink-0"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
