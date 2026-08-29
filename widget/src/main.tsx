import { render } from 'preact'
import './index.css'
import { App } from './app.tsx'

function initWidget() {
  const scriptTag = document.currentScript || document.querySelector('script[data-project-id]')
  let projectId = null
  let apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000'

  if (scriptTag) {
    projectId = scriptTag.getAttribute('data-project-id')
    
    // Auto-detect API URL from the script source (magic!)
    if ((scriptTag as HTMLScriptElement).src) {
      try {
        const scriptUrl = new URL((scriptTag as HTMLScriptElement).src)
        // If not running from local Vite dev server, use the script's host as the API url
        if (scriptUrl.origin && !scriptUrl.origin.includes('localhost:5173')) {
          apiUrl = scriptUrl.origin
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    // Explicit override if ever needed
    const customApiUrl = scriptTag.getAttribute('data-api-url')
    if (customApiUrl) apiUrl = customApiUrl
  }

  // Fallback to URL params for local dev testing
  if (!projectId) {
    const params = new URLSearchParams(window.location.search)
    projectId = params.get('project_id')
  }

  // Create a container for the widget
  const container = document.createElement('div')
  container.id = 'ai-chat-widget-root'
  document.body.appendChild(container)

  render(<App projectId={projectId} apiUrl={apiUrl} />, container)
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initWidget()
} else {
  document.addEventListener('DOMContentLoaded', initWidget)
}
