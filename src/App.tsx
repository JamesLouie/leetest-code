import { useState, useEffect } from 'react'
import './App.css'

interface PageData {
  title: string;
  url: string;
  timestamp: string;
}

interface Settings {
  theme: string;
  notifications: boolean;
}

function App() {
  const [isEnabled, setIsEnabled] = useState(true)
  const [pageData, setPageData] = useState<PageData | null>(null)
  const [settings, setSettings] = useState<Settings>({ theme: 'light', notifications: true })

  useEffect(() => {
    // Get current tab data
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getData' }, (response) => {
          if (response) {
            setPageData(response)
          }
        })
      }
    })

    // Get extension settings
    chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
      if (response) {
        setSettings(response)
      }
    })

    // Get extension state
    chrome.storage.sync.get(['extensionEnabled'], (result) => {
      setIsEnabled(result.extensionEnabled ?? true)
    })
  }, [])

  const toggleExtension = () => {
    chrome.runtime.sendMessage({ action: 'toggleExtension' }, (response) => {
      setIsEnabled(response.enabled)
    })
  }

  const toggleNotifications = () => {
    const newSettings = { ...settings, notifications: !settings.notifications }
    setSettings(newSettings)
    chrome.runtime.sendMessage({ action: 'saveSettings', settings: newSettings })
  }

  const toggleTheme = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light'
    const newSettings = { ...settings, theme: newTheme }
    setSettings(newSettings)
    chrome.runtime.sendMessage({ action: 'saveSettings', settings: newSettings })
  }

  return (
    <div className={`app ${settings.theme}`}>
      <header className="header">
        <h1>🧩 Leetest Code</h1>
        <p>Chrome Extension with Vite + React</p>
      </header>
      
      <main className="main">
        <section className="status">
          <div className="status-item">
            <span>Extension Status:</span>
            <button 
              onClick={toggleExtension}
              className={`toggle-btn ${isEnabled ? 'enabled' : 'disabled'}`}
            >
              {isEnabled ? '✅ Enabled' : '❌ Disabled'}
            </button>
          </div>
        </section>

        {pageData && (
          <section className="page-info">
            <h3>Current Page</h3>
            <div className="info-item">
              <strong>Title:</strong> {pageData.title}
            </div>
            <div className="info-item">
              <strong>URL:</strong> {pageData.url}
            </div>
            <div className="info-item">
              <strong>Timestamp:</strong> {new Date(pageData.timestamp).toLocaleString()}
            </div>
          </section>
        )}

        <section className="settings">
          <h3>Settings</h3>
          <div className="setting-item">
            <span>Theme:</span>
            <button onClick={toggleTheme} className="setting-btn">
              {settings.theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>
          <div className="setting-item">
            <span>Notifications:</span>
            <button onClick={toggleNotifications} className="setting-btn">
              {settings.notifications ? '🔔 On' : '🔕 Off'}
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
