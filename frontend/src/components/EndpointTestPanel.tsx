import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Copy, Send } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { Endpoint } from '../api/types'
import { isJsonContentType } from '../utils/responseBody'
import { Button } from './ui/Button'
import { IconButton } from './ui/IconButton'

type ResultState = 'idle' | 'sending' | 'success' | 'error' | 'timeout'
type ResultTab = 'body' | 'headers'

type TestResult = {
  state: Exclude<ResultState, 'idle' | 'sending'>
  status: number
  statusText: string
  duration: number
  size: number
  body: string
  headers: Array<{ name: string; value: string }>
}

type EndpointTestPanelProps = {
  endpoint: Endpoint
  hasUnsavedChanges: boolean
  isActive: boolean
  mockUrl: string
  projectKey: string
}

const WIDTH_KEY = 'mockrelay:test-panel-width'
const OPEN_KEY = 'mockrelay:test-panel-open'
const DEFAULT_WIDTH = 360
const MIN_WIDTH = 300
const MAX_WIDTH = 520
const COLLAPSED_WIDTH = 36
const MIN_TIMEOUT_MS = 5000
const TIMEOUT_BUFFER_MS = 5000

const statusLabels: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  205: 'Reset Content',
  304: 'Not Modified',
  400: 'Bad Request',
  404: 'Not Found',
  500: 'Internal Server Error',
}

function readStoredWidth() {
  const stored = Number(window.localStorage.getItem(WIDTH_KEY))
  return Number.isFinite(stored) && stored >= MIN_WIDTH ? Math.min(stored, MAX_WIDTH) : DEFAULT_WIDTH
}

function readStoredOpen() {
  return window.localStorage.getItem(OPEN_KEY) !== 'false'
}

function byteSize(value: string) {
  return new TextEncoder().encode(value).length
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

function formatResponseBody(body: string, contentType: string) {
  if (!body || !isJsonContentType(contentType)) return body
  try {
    return JSON.stringify(JSON.parse(body), null, 2)
  } catch {
    return body
  }
}

function requestTimeoutMs(delayMs: number) {
  return Math.max(MIN_TIMEOUT_MS, delayMs + TIMEOUT_BUFFER_MS)
}

export function EndpointTestPanel({ endpoint, hasUnsavedChanges, isActive, mockUrl, projectKey }: EndpointTestPanelProps) {
  const [isOpen, setIsOpen] = useState(readStoredOpen)
  const [width, setWidth] = useState(readStoredWidth)
  const [resultState, setResultState] = useState<ResultState>('idle')
  const [result, setResult] = useState<TestResult | null>(null)
  const [activeTab, setActiveTab] = useState<ResultTab>('body')
  const [copied, setCopied] = useState(false)
  const requestController = useRef<AbortController | null>(null)
  const copiedTimer = useRef<number | null>(null)

  const testPath = useMemo(
    () => `/mock/${projectKey}${endpoint.path.replace(/\{[A-Za-z][A-Za-z0-9_]*}/g, '1')}`,
    [endpoint.path, projectKey],
  )
  const testUrl = mockUrl.replace(/\{[A-Za-z][A-Za-z0-9_]*}/g, '1')

  function setPanelOpen(next: boolean) {
    setIsOpen(next)
    window.localStorage.setItem(OPEN_KEY, String(next))
  }

  function togglePanel() {
    setPanelOpen(!isOpen)
  }

  useEffect(() => {
    if (!isActive) return
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'j') {
        event.preventDefault()
        setIsOpen((current) => {
          const next = !current
          window.localStorage.setItem(OPEN_KEY, String(next))
          return next
        })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive])

  useEffect(() => () => {
    requestController.current?.abort()
    if (copiedTimer.current) window.clearTimeout(copiedTimer.current)
  }, [])

  function handleResizeStart(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault()
    const startingX = event.clientX
    const startingWidth = width
    const maxWidth = Math.min(MAX_WIDTH, Math.floor(window.innerWidth * 0.48))

    function handlePointerMove(pointerEvent: PointerEvent) {
      setWidth(Math.min(maxWidth, Math.max(MIN_WIDTH, startingWidth + startingX - pointerEvent.clientX)))
    }

    function handlePointerUp(pointerEvent: PointerEvent) {
      const nextWidth = Math.min(maxWidth, Math.max(MIN_WIDTH, startingWidth + startingX - pointerEvent.clientX))
      setWidth(nextWidth)
      window.localStorage.setItem(WIDTH_KEY, String(nextWidth))
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  async function sendRequest() {
    if (hasUnsavedChanges || resultState === 'sending') return
    requestController.current?.abort()
    if (!isOpen) setPanelOpen(true)
    setResultState('sending')
    setResult(null)
    setActiveTab('body')

    const controller = new AbortController()
    requestController.current = controller
    const timeoutMs = requestTimeoutMs(endpoint.delayMs)
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)
    const startedAt = performance.now()

    try {
      const response = await fetch(testPath, {
        method: endpoint.method,
        signal: controller.signal,
      })
      const rawBody = await response.text()
      const duration = Math.max(1, Math.round(performance.now() - startedAt))
      const contentType = response.headers.get('content-type') ?? ''
      const state: ResultState = response.status >= 400 ? 'error' : 'success'
      const nextResult: TestResult = {
        state,
        status: response.status,
        statusText: response.statusText,
        duration,
        size: byteSize(rawBody),
        body: formatResponseBody(rawBody, contentType),
        headers: Array.from(response.headers.entries()).map(([name, value]) => ({ name, value })),
      }
      setResult(nextResult)
      setResultState(state)
    } catch (error) {
      const duration = Math.max(1, Math.round(performance.now() - startedAt))
      if (error instanceof DOMException && error.name === 'AbortError') {
        setResult({ state: 'timeout', status: 0, statusText: 'Timed out', duration: timeoutMs, size: 0, body: '', headers: [] })
        setResultState('timeout')
      } else {
        const message = error instanceof Error ? error.message : 'The request could not be completed'
        setResult({ state: 'error', status: 0, statusText: 'Network error', duration, size: byteSize(message), body: message, headers: [] })
        setResultState('error')
      }
    } finally {
      window.clearTimeout(timeoutId)
      if (requestController.current === controller) requestController.current = null
    }
  }

  async function copyBody() {
    if (!result?.body) return
    await navigator.clipboard.writeText(result.body)
    setCopied(true)
    if (copiedTimer.current) window.clearTimeout(copiedTimer.current)
    copiedTimer.current = window.setTimeout(() => setCopied(false), 1400)
  }

  const statusText = result?.status
    ? `${result.status} ${result.statusText || statusLabels[result.status] || ''}`.trim()
    : result?.statusText ?? ''
  const statusTone = resultState === 'success' ? 'text-[var(--success)]' : resultState === 'error' || resultState === 'timeout' ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'

  if (!isOpen) {
    return (
      <aside className="flex h-full shrink-0 flex-col items-center border-l border-[var(--border-strong)] bg-[var(--bg-surface)]" style={{ width: COLLAPSED_WIDTH }}>
        <IconButton className="mt-1" label="Open test console" onClick={togglePanel}><ChevronLeft aria-hidden="true" size={14} /></IconButton>
        <button className="mt-2 flex flex-1 items-start py-2 text-[10px] font-semibold text-[var(--text-muted)] [writing-mode:vertical-rl] hover:text-[var(--text-primary)]" onClick={togglePanel} type="button">Test console</button>
        {result ? <span aria-label={result.state === 'timeout' ? 'Timed out' : statusText} className={`mb-2 size-1.5 rounded-full ${result.state === 'success' ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'}`} /> : null}
        <IconButton className="mb-1" disabled={hasUnsavedChanges || resultState === 'sending'} label={hasUnsavedChanges ? 'Save changes before sending' : 'Send request'} onClick={sendRequest}><Send aria-hidden="true" size={13} /></IconButton>
      </aside>
    )
  }

  return (
    <aside className="relative flex h-full min-h-0 shrink-0 flex-col border-l border-[var(--border-strong)] bg-[var(--bg-surface)]" style={{ width }}>
      <div aria-label="Resize test console" className="group absolute inset-y-0 -left-0.5 z-10 w-1 cursor-col-resize hover:bg-[var(--accent)]" onPointerDown={handleResizeStart} />

      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-[var(--border-default)] px-3">
        <span className="text-xs font-semibold">Test console</span>
        <span className="text-[10px] text-[var(--text-muted)]">Ctrl+J</span>
        <IconButton className="ml-auto" label="Collapse test console" onClick={togglePanel}><ChevronRight aria-hidden="true" size={14} /></IconButton>
      </div>

      <div className="shrink-0 border-b border-[var(--border-default)] p-3">
        <div className="mb-2 flex min-w-0 items-center gap-2">
          <span className={`shrink-0 font-mono text-[10px] font-semibold method-${endpoint.method.toLowerCase()}`}>{endpoint.method}</span>
          <code className="min-w-0 flex-1 truncate font-mono text-[10px] text-[var(--text-secondary)]" title={testUrl}>{testUrl}</code>
        </div>
        <div className="flex items-center justify-between gap-2">
          {result ? <div className="flex min-w-0 items-center gap-2 font-mono text-[9px]"><span className={`truncate font-semibold ${statusTone}`}>{result.state === 'timeout' ? 'Timed out' : statusText}</span><span className="shrink-0 text-[var(--text-muted)]">{result.duration} ms</span><span className="shrink-0 text-[var(--text-muted)]">{formatSize(result.size)}</span></div> : <span className="text-[10px] text-[var(--text-muted)]">{hasUnsavedChanges ? 'Save changes before sending' : 'Ready to send'}</span>}
          <Button className="shrink-0" disabled={hasUnsavedChanges || resultState === 'sending'} onClick={sendRequest} size="small" variant="primary"><Send aria-hidden="true" size={12} />{resultState === 'sending' ? 'Sending…' : 'Send'}</Button>
        </div>
      </div>

      {resultState === 'idle' ? <EmptyState icon={<Send aria-hidden="true" size={17} />} title="Send a request to preview this mock" description={hasUnsavedChanges ? 'Save your changes before testing the runtime.' : 'This sends a real request to the saved mock runtime.'} /> : null}
      {resultState === 'sending' ? <EmptyState icon={<Clock3 aria-hidden="true" className="animate-pulse" size={17} />} title="Waiting for mock response…" /> : null}
      {resultState === 'timeout' ? <EmptyState danger icon={<AlertTriangle aria-hidden="true" size={18} />} title="Request timed out" description={`No response was received within ${(result?.duration ?? MIN_TIMEOUT_MS).toLocaleString()} ms.`} /> : null}

      {result && result.state !== 'timeout' ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex h-9 shrink-0 items-end gap-4 border-b border-[var(--border-default)] px-3">
            {(['body', 'headers'] as ResultTab[]).map((tab) => <button className={activeTab === tab ? 'h-9 border-b-2 border-[var(--accent)] text-[11px] font-semibold capitalize' : 'h-9 border-b-2 border-transparent text-[11px] font-medium capitalize text-[var(--text-muted)] hover:text-[var(--text-primary)]'} key={tab} onClick={() => setActiveTab(tab)} type="button">{tab}{tab === 'headers' ? ` (${result.headers.length})` : ''}</button>)}
            <span className="ml-auto mb-2 flex items-center gap-1 text-[9px] text-[var(--text-muted)]">{result.state === 'success' ? <CheckCircle2 aria-hidden="true" size={10} /> : <AlertTriangle aria-hidden="true" size={10} />}{result.state === 'success' ? 'Received' : 'Error response'}</span>
          </div>
          {activeTab === 'body' ? <div className="flex min-h-0 flex-1 flex-col"><div className="flex h-8 shrink-0 items-center justify-end border-b border-[var(--border-default)] px-2"><IconButton disabled={!result.body} label={copied ? 'Copied response body' : 'Copy response body'} onClick={copyBody}><Copy aria-hidden="true" size={12} /></IconButton></div><pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words p-3 font-mono text-[11px] leading-5 text-[var(--text-primary)]">{result.body || 'No response body'}</pre></div> : null}
          {activeTab === 'headers' ? <div className="min-h-0 flex-1 overflow-auto"><div className="grid grid-cols-[minmax(110px,0.7fr)_minmax(140px,1fr)] border-b border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.04em] text-[var(--text-muted)]"><span>Name</span><span>Value</span></div>{result.headers.map((header) => <div className="grid grid-cols-[minmax(110px,0.7fr)_minmax(140px,1fr)] border-b border-[var(--border-default)] px-3 py-2 font-mono text-[9px] last:border-b-0" key={`${header.name}-${header.value}`}><span className="break-all">{header.name}</span><span className="break-all text-[var(--text-secondary)]">{header.value}</span></div>)}</div> : null}
        </div>
      ) : null}
    </aside>
  )
}

type EmptyStateProps = {
  danger?: boolean
  description?: string
  icon: React.ReactNode
  title: string
}

function EmptyState({ danger = false, description, icon, title }: EmptyStateProps) {
  return <div className="grid min-h-0 flex-1 place-items-center p-6 text-center"><div><div className={`mx-auto mb-2 flex justify-center ${danger ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'}`}>{icon}</div><p className="text-xs font-medium">{title}</p>{description ? <p className="mt-1 text-[10px] leading-4 text-[var(--text-muted)]">{description}</p> : null}</div></div>
}
