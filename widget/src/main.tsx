import { render } from 'preact'
import './index.css'
import { App } from './app.tsx'

function initWidget() {
  // Find our script tag (support both prod widget.js and dev main.tsx)
  const scriptTag = document.currentScript || document.querySelector('script[data-project-id]')
  let projectId = null

  if (scriptTag) {
    projectId = scriptTag.getAttribute('data-project-id')
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

  render(<App projectId={projectId} />, container)
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initWidget()
} else {
  document.addEventListener('DOMContentLoaded', initWidget)
}
