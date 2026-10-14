import CodeMirror from '@uiw/react-codemirror'
import { json, jsonParseLinter } from '@codemirror/lang-json'
import { linter } from '@codemirror/lint'
import { EditorView } from '@codemirror/view'
import type { Extension } from '@codemirror/state'
import { Check, Copy, CopyPlus, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getErrorMessage } from '../api/client'
import type { Endpoint, HttpMethod, ResponseHeader } from '../api/types'
import { validateEndpointPath } from '../utils/endpointValidation'
import { isJsonContentType, statusAllowsBody } from '../utils/responseBody'
import { Button } from './ui/Button'
import { IconButton } from './ui/IconButton'
import { EndpointTestPanel } from './EndpointTestPanel'
import { MoreActionsMenu } from './ui/MoreActionsMenu'

type EditorTab = 'response' | 'headers' | 'timing' | 'settings'

type EndpointEditorProps = {
  endpoint: Endpoint
  endpoints: Endpoint[]
  isActive: boolean
  onDelete: () => void
  onDuplicate: () => void
  onSave: (endpoint: Endpoint) => Promise<Endpoint>
  projectKey: string
}

const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const timingPresets = [0, 100, 250, 500, 1000]
const fieldClass = 'h-8 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 text-xs outline-none transition-[border-color,box-shadow] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)]'

const editorTheme = EditorView.theme({
  '&': { height: '100%', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { fontFamily: '"Space Mono", ui-monospace, monospace', fontSize: '13px', lineHeight: '20px' },
  '.cm-content': { padding: '10px 0', caretColor: 'var(--text-primary)' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--text-primary) !important' },
  '.cm-gutters': { backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)', border: 'none', borderRight: '1px solid var(--border-default)' },
  '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'var(--bg-subtle)' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': { backgroundColor: 'var(--accent-subtle) !important' },
  '.cm-lintRange-error': { backgroundImage: 'none', textDecoration: 'underline wavy var(--danger)' },
})

function getJsonError(body: string, contentType: string) {
  if (!isJsonContentType(contentType)) return ''
  if (!body.trim()) return 'Response body must contain valid JSON.'
  try {
    JSON.parse(body)
    return ''
  } catch (error) {
    return error instanceof Error ? error.message : 'Response body must contain valid JSON.'
  }
}

function sameHeaders(left: ResponseHeader[], right: ResponseHeader[]) {
  const comparable = (headers: ResponseHeader[]) => headers.map(({ name, value, enabled }) => ({ name, value, enabled }))
  return JSON.stringify(comparable(left)) === JSON.stringify(comparable(right))
}

function createHeader(): ResponseHeader {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `header-${Date.now()}`,
    name: '',
    value: '',
    enabled: true,
  }
}

export function EndpointEditor({ endpoint, endpoints, isActive, onDelete, onDuplicate, onSave, projectKey }: EndpointEditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>('response')
  const [method, setMethod] = useState(endpoint.method)
  const [path, setPath] = useState(endpoint.path)
  const [name, setName] = useState(endpoint.name)
  const [statusCode, setStatusCode] = useState(endpoint.statusCode)
  const [contentType, setContentType] = useState(endpoint.contentType)
  const [delayMs, setDelayMs] = useState(endpoint.delayMs)
  const [body, setBody] = useState(endpoint.body)
  const [headers, setHeaders] = useState<ResponseHeader[]>(endpoint.headers ?? [])
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'failed'>('saved')
  const [saveError, setSaveError] = useState('')
  const [copyLabel, setCopyLabel] = useState<'body' | 'url' | null>(null)
  const feedbackTimer = useRef<number | null>(null)

  const trimmedPath = path.trim()
  const trimmedName = name.trim()
  const bodyAllowed = statusAllowsBody(statusCode)
  const mockUrl = `http://localhost:8080/mock/${projectKey}${trimmedPath}`
  const jsonError = bodyAllowed ? getJsonError(body, contentType) : ''
  const pathError = validateEndpointPath(trimmedPath)
  const duplicateError = endpoints.some((item) => item.id !== endpoint.id && item.method === method && item.path === trimmedPath)
    ? `${method} ${trimmedPath} already exists.`
    : ''
  const settingsError = pathError || duplicateError
  const bodyIsDirty = body !== endpoint.body
  const headersAreDirty = !sameHeaders(headers, endpoint.headers ?? [])
  const timingIsDirty = delayMs !== endpoint.delayMs
  const settingsAreDirty = method !== endpoint.method || trimmedPath !== endpoint.path || trimmedName !== endpoint.name
  const responseIsDirty = bodyIsDirty || statusCode !== endpoint.statusCode || contentType !== endpoint.contentType
  const isDirty = responseIsDirty || headersAreDirty || timingIsDirty || settingsAreDirty

  const editorExtensions = useMemo(
    () => bodyAllowed && isJsonContentType(contentType) ? [json(), linter(jsonParseLinter(), { delay: 180 })] : [],
    [bodyAllowed, contentType],
  )

  const handleSave = useCallback(async () => {
    if (!isDirty || jsonError || settingsError || saveState === 'saving') return
    const nextPath = path.trim()
    const nextName = name.trim()
    const nextBody = bodyAllowed ? body : ''
    setPath(nextPath)
    setName(nextName)
    setBody(nextBody)
    setSaveState('saving')
    setSaveError('')
    try {
      await onSave({ ...endpoint, method, path: nextPath, name: nextName, statusCode, contentType, delayMs, body: nextBody, headers })
      setSaveState('saved')
    } catch (error) {
      setSaveState('failed')
      setSaveError(getErrorMessage(error))
    }
  }, [body, bodyAllowed, contentType, delayMs, endpoint, headers, isDirty, jsonError, method, name, onSave, path, saveState, settingsError, statusCode])

  useEffect(() => {
    if (!isActive) return
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void handleSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave, isActive])

  useEffect(() => () => {
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current)
  }, [])

  async function copyText(value: string, kind: 'body' | 'url') {
    await navigator.clipboard.writeText(value)
    setCopyLabel(kind)
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current)
    feedbackTimer.current = window.setTimeout(() => setCopyLabel(null), 1400)
  }

  function formatBody() {
    if (!bodyAllowed || jsonError || !isJsonContentType(contentType)) return
    setBody(`${JSON.stringify(JSON.parse(body), null, 2)}\n`)
  }

  function updateHeader(id: string, patch: Partial<ResponseHeader>) {
    setHeaders((current) => current.map((header) => header.id === id ? { ...header, ...patch } : header))
  }

  const tabDirty: Record<EditorTab, boolean> = {
    response: responseIsDirty,
    headers: headersAreDirty,
    timing: timingIsDirty,
    settings: settingsAreDirty,
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--bg-app)]">
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-4 pt-3">
          <h1 className="sr-only">{method} {trimmedPath || endpoint.path}</h1>
          <div className="flex items-center gap-3 pb-3">
            <div className="flex h-8 min-w-0 flex-1 overflow-hidden rounded-md border border-[var(--border-strong)] bg-[var(--bg-app)] focus-within:border-[var(--accent)]">
              <span className={`flex w-[82px] shrink-0 items-center border-r border-[var(--border-default)] px-3 text-[10px] font-semibold method-${method.toLowerCase()}`}>{method}</span>
              <code className="flex min-w-0 flex-1 items-center truncate px-3 font-mono text-[11px] text-[var(--text-primary)]" title={mockUrl}>{mockUrl}</code>
              <button className="inline-flex h-full shrink-0 items-center gap-1.5 border-l border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-[10px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]" onClick={() => copyText(mockUrl, 'url')} type="button">
                <Copy aria-hidden="true" size={11} /> {copyLabel === 'url' ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div aria-live="polite" className="flex h-8 shrink-0 items-center text-[11px] font-medium text-[var(--text-muted)]">
              {saveState === 'saving' ? 'Saving…' : saveState === 'failed' ? <span className="text-[var(--danger)]" title={saveError}>Save failed</span> : isDirty ? <><span className="mr-1.5 size-1.5 rounded-full bg-[var(--accent)]" />Unsaved changes</> : <><Check aria-hidden="true" className="mr-1" size={13} />Saved</>}
            </div>
            {isDirty || saveState === 'saving' ? <Button disabled={Boolean(jsonError || settingsError) || saveState === 'saving'} onClick={handleSave} size="small" variant="primary">{saveState === 'saving' ? 'Saving…' : 'Save changes'}</Button> : null}
            <MoreActionsMenu
              items={[
                { icon: <CopyPlus aria-hidden="true" size={13} />, label: 'Duplicate endpoint', onSelect: onDuplicate },
                { danger: true, icon: <Trash2 aria-hidden="true" size={13} />, label: 'Delete endpoint', onSelect: onDelete, separatorBefore: true },
              ]}
              label="More endpoint actions"
            />
          </div>

          <nav aria-label="Endpoint configuration" className="flex h-8 items-end gap-5">
            {(['response', 'headers', 'timing', 'settings'] as EditorTab[]).map((tab) => (
              <button aria-current={activeTab === tab ? 'page' : undefined} className={activeTab === tab ? 'relative h-8 border-b-2 border-[var(--accent)] text-xs font-semibold capitalize text-[var(--text-primary)]' : 'relative h-8 border-b-2 border-transparent text-xs font-medium capitalize text-[var(--text-muted)] hover:text-[var(--text-primary)]'} key={tab} onClick={() => setActiveTab(tab)} type="button">
                {tab}{tabDirty[tab] ? <span aria-label="Contains unsaved changes" className="absolute -right-2 top-2 size-1 rounded-full bg-[var(--accent)]" /> : null}
              </button>
            ))}
          </nav>
        </header>

        {activeTab === 'response' ? <ResponseTab body={body} bodyAllowed={bodyAllowed} bodyIsDirty={bodyIsDirty} contentType={contentType} editorExtensions={editorExtensions} endpoint={endpoint} formatBody={formatBody} jsonError={jsonError} onBodyChange={setBody} onContentTypeChange={setContentType} onCopy={() => copyText(bodyAllowed ? body : '', 'body')} onRevert={() => { setStatusCode(endpoint.statusCode); setContentType(endpoint.contentType); setBody(endpoint.body) }} onStatusChange={setStatusCode} responseIsDirty={responseIsDirty} statusCode={statusCode} copyLabel={copyLabel} /> : null}

        {activeTab === 'headers' ? (
          <div className="min-h-0 flex-1 overflow-auto p-4">
            <div className="mb-3 flex items-center justify-between">
              <div><h2 className="text-[13px] font-semibold">Response headers</h2><p className="mt-0.5 text-[11px] text-[var(--text-muted)]">Returned with every response from this endpoint.</p></div>
              <div className="flex items-center gap-1">{headersAreDirty ? <button className="rounded px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]" onClick={() => setHeaders(endpoint.headers ?? [])} type="button">Revert</button> : null}<Button onClick={() => setHeaders((current) => [...current, createHeader()])} size="small"><Plus aria-hidden="true" size={12} /> Add header</Button></div>
            </div>
            <div className="overflow-hidden rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)]">
              <div className="grid h-8 grid-cols-[36px_minmax(160px,0.8fr)_minmax(220px,1.2fr)_36px] items-center border-b border-[var(--border-default)] bg-[var(--bg-subtle)] px-2 text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--text-muted)]"><span /><span>Name</span><span>Value</span><span /></div>
              {headers.length === 0 ? <div className="px-4 py-10 text-center text-xs text-[var(--text-muted)]">No response headers configured.</div> : headers.map((header) => (
                <div className="grid min-h-10 grid-cols-[36px_minmax(160px,0.8fr)_minmax(220px,1.2fr)_36px] items-center border-b border-[var(--border-default)] px-2 last:border-b-0" key={header.id}>
                  <input aria-label={`Enable ${header.name || 'header'}`} checked={header.enabled} className="size-3.5 accent-[var(--accent)]" onChange={(event) => updateHeader(header.id, { enabled: event.target.checked })} type="checkbox" />
                  <input aria-label="Header name" className="h-7 border-0 bg-transparent px-1 font-mono text-xs outline-none placeholder:text-[var(--text-muted)] focus:bg-[var(--bg-subtle)]" onChange={(event) => updateHeader(header.id, { name: event.target.value })} placeholder="X-Request-Id" value={header.name} />
                  <input aria-label="Header value" className="h-7 border-0 bg-transparent px-1 font-mono text-xs outline-none placeholder:text-[var(--text-muted)] focus:bg-[var(--bg-subtle)]" onChange={(event) => updateHeader(header.id, { value: event.target.value })} placeholder="mock-123" value={header.value} />
                  <IconButton label="Remove header" onClick={() => setHeaders((current) => current.filter((item) => item.id !== header.id))}><Trash2 aria-hidden="true" size={13} /></IconButton>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === 'timing' ? (
          <div className="min-h-0 flex-1 overflow-auto p-4"><div className="max-w-[620px]">
            <div className="mb-4 flex items-start justify-between"><div><h2 className="text-[13px] font-semibold">Response timing</h2><p className="mt-0.5 text-[11px] text-[var(--text-muted)]">Add latency to simulate a slower service or network.</p></div>{timingIsDirty ? <button className="rounded px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]" onClick={() => setDelayMs(endpoint.delayMs)} type="button">Revert</button> : null}</div>
            <section className="rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
              <div className="mb-2 text-[11px] font-semibold text-[var(--text-secondary)]">Delay preset</div>
              <div className="flex flex-wrap gap-1.5">{timingPresets.map((preset) => <button className={delayMs === preset ? 'h-8 min-w-[68px] rounded-md border border-[var(--accent)] bg-[var(--accent-subtle)] px-3 font-mono text-xs font-medium text-[var(--accent)]' : 'h-8 min-w-[68px] rounded-md border border-[var(--border-default)] bg-[var(--bg-app)] px-3 font-mono text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'} key={preset} onClick={() => setDelayMs(preset)} type="button">{preset === 0 ? 'None' : `${preset} ms`}</button>)}</div>
              <label className="mt-5 block"><span className="mb-1.5 block text-[11px] font-semibold text-[var(--text-secondary)]">Custom delay</span><div className="flex h-8 w-[150px] overflow-hidden rounded-md border border-[var(--border-default)] bg-[var(--bg-app)] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-subtle)]"><input className="min-w-0 flex-1 bg-transparent px-2 text-right font-mono text-xs outline-none" max={30000} min={0} onChange={(event) => setDelayMs(Math.min(30000, Math.max(0, Number(event.target.value))))} type="number" value={delayMs} /><span className="flex items-center border-l border-[var(--border-default)] bg-[var(--bg-subtle)] px-2 text-[11px] text-[var(--text-muted)]">ms</span></div></label>
            </section>
          </div></div>
        ) : null}

        {activeTab === 'settings' ? (
          <div className="min-h-0 flex-1 overflow-auto p-4"><div className="max-w-[680px]">
            <div className="mb-4 flex items-start justify-between"><div><h2 className="text-[13px] font-semibold">Endpoint settings</h2><p className="mt-0.5 text-[11px] text-[var(--text-muted)]">Change how this endpoint is identified and matched.</p></div>{settingsAreDirty ? <button className="rounded px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]" onClick={() => { setMethod(endpoint.method); setPath(endpoint.path); setName(endpoint.name) }} type="button">Revert</button> : null}</div>
            <section className="space-y-4 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
              <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[var(--text-secondary)]">Endpoint name <span className="font-normal text-[var(--text-muted)]">(optional)</span></span><input className={`${fieldClass} w-full max-w-[440px]`} maxLength={80} onChange={(event) => setName(event.target.value)} placeholder="e.g. Get user" value={name} /></label>
              <div><div className="mb-1.5 grid max-w-[560px] grid-cols-[112px_1fr] gap-2 text-[11px] font-semibold text-[var(--text-secondary)]"><span>Method</span><span>Path</span></div><div className="grid max-w-[560px] grid-cols-[112px_1fr] gap-2"><select className={`${fieldClass} font-mono font-semibold`} onChange={(event) => setMethod(event.target.value as HttpMethod)} value={method}>{methods.map((item) => <option key={item}>{item}</option>)}</select><input aria-invalid={Boolean(settingsError)} className={`${fieldClass} font-mono aria-invalid:border-[var(--danger)]`} onChange={(event) => setPath(event.target.value)} placeholder="/users/{id}" value={path} /></div>{settingsError ? <p className="mt-1 text-[11px] text-[var(--danger)]">{settingsError}</p> : <p className="mt-1 text-[11px] text-[var(--text-muted)]">Use Spring-style path parameters such as {'{id}'}.</p>}</div>
              <div><div className="mb-1.5 text-[11px] font-semibold text-[var(--text-secondary)]">Mock URL</div><div className="flex max-w-[560px] items-center rounded-md border border-[var(--border-default)] bg-[var(--bg-subtle)] px-2.5 py-2"><code className="min-w-0 flex-1 truncate font-mono text-[11px] text-[var(--text-secondary)]">{mockUrl}</code><button className="ml-2 inline-flex items-center gap-1 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]" onClick={() => copyText(mockUrl, 'url')} type="button"><Copy aria-hidden="true" size={11} /> {copyLabel === 'url' ? 'Copied' : 'Copy'}</button></div></div>
            </section>
          </div></div>
        ) : null}
        </div>
        <EndpointTestPanel
          endpoint={{ ...endpoint, method, path: trimmedPath, name: trimmedName, statusCode, contentType, delayMs, body, headers }}
          hasUnsavedChanges={isDirty}
          isActive={isActive}
          mockUrl={mockUrl}
          projectKey={projectKey}
        />
      </div>
    </div>
  )
}

type ResponseTabProps = {
  body: string
  bodyAllowed: boolean
  bodyIsDirty: boolean
  contentType: string
  copyLabel: 'body' | 'url' | null
  editorExtensions: Extension[]
  endpoint: Endpoint
  formatBody: () => void
  jsonError: string
  onBodyChange: (value: string) => void
  onContentTypeChange: (value: string) => void
  onCopy: () => void
  onRevert: () => void
  onStatusChange: (value: number) => void
  responseIsDirty: boolean
  statusCode: number
}

function ResponseTab({ body, bodyAllowed, contentType, copyLabel, editorExtensions, formatBody, jsonError, onBodyChange, onContentTypeChange, onCopy, onRevert, onStatusChange, responseIsDirty, statusCode }: ResponseTabProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col p-4">
      <div className="mb-4 flex items-end gap-3">
        <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[var(--text-secondary)]">Status</span><select className={`${fieldClass} w-[148px] font-mono`} onChange={(event) => onStatusChange(Number(event.target.value))} value={statusCode}><option value={200}>200 OK</option><option value={201}>201 Created</option><option value={204}>204 No Content</option><option value={205}>205 Reset Content</option><option value={304}>304 Not Modified</option><option value={400}>400 Bad Request</option><option value={404}>404 Not Found</option><option value={500}>500 Internal Server Error</option></select></label>
        <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[var(--text-secondary)]">Content type</span><select className={`${fieldClass} w-[190px] font-mono`} onChange={(event) => onContentTypeChange(event.target.value)} value={contentType}><option>application/json</option><option>text/plain</option><option>text/html</option></select></label>
        {responseIsDirty ? <button className="mb-1 rounded px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]" onClick={onRevert} type="button">Revert response</button> : null}
      </div>
      <section className="flex min-h-[260px] flex-1 flex-col overflow-hidden rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="flex h-9 shrink-0 items-center justify-between border-b border-[var(--border-default)] px-3"><span className="text-xs font-semibold">Response body</span><div className="flex items-center gap-1">{bodyAllowed && isJsonContentType(contentType) ? <button className="rounded px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-40" disabled={Boolean(jsonError)} onClick={formatBody} type="button">Format</button> : null}<button className="rounded px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-40" disabled={!bodyAllowed} onClick={onCopy} type="button">{copyLabel === 'body' ? 'Copied' : 'Copy'}</button></div></div>
        <CodeMirror aria-label="Response body" basicSetup={{ autocompletion: false, bracketMatching: true, closeBrackets: true, foldGutter: false, highlightActiveLine: true, highlightActiveLineGutter: true, lineNumbers: true }} className={`min-h-0 flex-1 overflow-auto ${bodyAllowed ? '' : 'opacity-60'}`} editable={bodyAllowed} extensions={editorExtensions} height="100%" onChange={onBodyChange} theme={editorTheme} value={bodyAllowed ? body : ''} />
        <div className={`flex min-h-7 shrink-0 items-center border-t border-[var(--border-default)] px-3 text-[10px] ${jsonError ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'}`}>{bodyAllowed ? jsonError || (isJsonContentType(contentType) ? 'Valid JSON' : contentType) : 'No body for this status'}</div>
      </section>
    </div>
  )
}
