import { ChevronDown, ChevronLeft, ChevronRight, CopyPlus, Pin, PinOff, Plus, Search, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import type { Endpoint } from '../api/types'
import { IconButton } from './ui/IconButton'
import { MoreActionsMenu } from './ui/MoreActionsMenu'

type EndpointSidebarProps = {
  endpoints: Endpoint[]
  onCreate: () => void
  onDelete: (endpoint: Endpoint) => void
  onDuplicate: (endpoint: Endpoint) => void
  onSelect: (endpointId: string) => void
  operationError: string
  projectId: string
  projectKey: string
  projectName: string
  selectedEndpointId?: string
}

const WORKING_ENDPOINT_DRAG_TYPE = 'application/x-mockrelay-endpoint-id'

function workingStorageKey(projectId: string) {
  return `mockrelay:working-endpoints:${projectId}`
}

function readWorkingEndpointIds(projectId: string) {
  try {
    const stored = window.localStorage.getItem(workingStorageKey(projectId))
    if (!stored) return new Set<string>()
    const parsed: unknown = JSON.parse(stored)
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [])
  } catch {
    return new Set<string>()
  }
}

type RouteGroup = {
  key: string
  label: string
  endpoints: Endpoint[]
}

function routeGroup(path: string) {
  const segment = path.split('/').filter(Boolean)[0]
  if (!segment) return { key: 'root', label: 'Root' }
  if (segment.startsWith('{')) return { key: 'dynamic', label: 'Dynamic routes' }
  return { key: segment.toLowerCase(), label: segment.replace(/[-_]+/g, ' ') }
}

function groupEndpoints(endpoints: Endpoint[]) {
  const groups = new Map<string, RouteGroup>()

  endpoints.forEach((endpoint) => {
    const group = routeGroup(endpoint.path)
    const existing = groups.get(group.key)
    if (existing) {
      existing.endpoints.push(endpoint)
    } else {
      groups.set(group.key, { ...group, endpoints: [endpoint] })
    }
  })

  return Array.from(groups.values())
}

export function EndpointSidebar({ endpoints, onCreate, onDelete, onDuplicate, onSelect, operationError, projectId, projectKey, projectName, selectedEndpointId }: EndpointSidebarProps) {
  const [searchIsOpen, setSearchIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => new Set())
  const [workingEndpointIds, setWorkingEndpointIds] = useState<Set<string>>(() => readWorkingEndpointIds(projectId))
  const [workingIsDragTarget, setWorkingIsDragTarget] = useState(false)
  const workingDragDepth = useRef(0)

  const filteredEndpoints = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return endpoints
    return endpoints.filter((endpoint) =>
      endpoint.method.toLowerCase().includes(query)
      || endpoint.path.toLowerCase().includes(query)
      || endpoint.name.toLowerCase().includes(query)
      || String(endpoint.statusCode).includes(query),
    )
  }, [endpoints, searchQuery])
  const groups = useMemo(() => groupEndpoints(filteredEndpoints), [filteredEndpoints])
  const workingEndpoints = useMemo(
    () => filteredEndpoints.filter((endpoint) => workingEndpointIds.has(endpoint.id)),
    [filteredEndpoints, workingEndpointIds],
  )
  const workingCount = useMemo(
    () => endpoints.filter((endpoint) => workingEndpointIds.has(endpoint.id)).length,
    [endpoints, workingEndpointIds],
  )

  useEffect(() => {
    try {
      window.localStorage.setItem(workingStorageKey(projectId), JSON.stringify(Array.from(workingEndpointIds)))
    } catch {
      // The shortcuts remain usable for this session when storage is unavailable.
    }
  }, [projectId, workingEndpointIds])

  function toggleGroup(groupKey: string) {
    setCollapsedGroups((current) => {
      const next = new Set(current)
      if (next.has(groupKey)) next.delete(groupKey)
      else next.add(groupKey)
      return next
    })
  }

  function closeSearch() {
    setSearchQuery('')
    setSearchIsOpen(false)
  }

  function addToWorking(endpointId: string) {
    if (!endpoints.some((endpoint) => endpoint.id === endpointId)) return
    setWorkingEndpointIds((current) => new Set(current).add(endpointId))
  }

  function removeFromWorking(endpointId: string) {
    setWorkingEndpointIds((current) => {
      const next = new Set(current)
      next.delete(endpointId)
      return next
    })
  }

  function handleDrop(event: React.DragEvent<HTMLElement>) {
    event.preventDefault()
    const endpointId = event.dataTransfer.getData(WORKING_ENDPOINT_DRAG_TYPE)
      || event.dataTransfer.getData('text/plain')
    addToWorking(endpointId)
    workingDragDepth.current = 0
    setWorkingIsDragTarget(false)
  }

  function renderEndpointRow(endpoint: Endpoint, location: 'working' | 'group') {
    const isSelected = endpoint.id === selectedEndpointId
    const isWorking = workingEndpointIds.has(endpoint.id)

    return (
      <div
        className={`endpoint-row method-row-${endpoint.method.toLowerCase()} group relative flex h-10 cursor-pointer items-center gap-2 border-l-2 pr-1.5 pl-2.5 ${isSelected ? 'endpoint-row-selected border-l-[var(--accent)]' : 'border-l-transparent'}`}
        draggable
        key={`${location}-${endpoint.id}`}
        onClick={() => onSelect(endpoint.id)}
        onDragEnd={() => {
          workingDragDepth.current = 0
          setWorkingIsDragTarget(false)
        }}
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = 'copy'
          event.dataTransfer.setData(WORKING_ENDPOINT_DRAG_TYPE, endpoint.id)
          event.dataTransfer.setData('text/plain', endpoint.id)
        }}
        onKeyDown={(event) => { if (event.key === 'Enter') onSelect(endpoint.id) }}
        role="button"
        tabIndex={0}
        title="Drag to Working for quick access"
      >
        <span className={`w-10 shrink-0 text-[9px] font-medium method-${endpoint.method.toLowerCase()}`}>{endpoint.method}</span>
        <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[var(--text-primary)]">{endpoint.path}</span>
        <MoreActionsMenu
          className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
          items={[
            location === 'working'
              ? { icon: <PinOff aria-hidden="true" size={13} />, label: 'Remove from Working', onSelect: () => removeFromWorking(endpoint.id) }
              : isWorking
                ? { icon: <PinOff aria-hidden="true" size={13} />, label: 'Remove from Working', onSelect: () => removeFromWorking(endpoint.id) }
                : { icon: <Pin aria-hidden="true" size={13} />, label: 'Add to Working', onSelect: () => addToWorking(endpoint.id) },
            { icon: <CopyPlus aria-hidden="true" size={13} />, label: 'Duplicate endpoint', onSelect: () => onDuplicate(endpoint) },
            { danger: true, icon: <Trash2 aria-hidden="true" size={13} />, label: 'Delete endpoint', onSelect: () => onDelete(endpoint), separatorBefore: true },
          ]}
          label={`More actions for ${endpoint.method} ${endpoint.path}`}
        />
      </div>
    )
  }

  return (
    <aside className="flex w-[248px] shrink-0 flex-col border-r border-[var(--border-default)] bg-[var(--bg-surface)]">
      <div className="border-b border-[var(--border-default)] px-3 py-3">
        <Link className="mb-2 inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]" to="/app"><ChevronLeft aria-hidden="true" size={13} /> All projects</Link>
        <div className="truncate text-[13px] font-semibold" title={projectName}>{projectName}</div>
        <div className="mt-0.5 truncate text-[11px] font-medium text-[var(--text-muted)]">/mock/{projectKey}</div>
      </div>

      <div className="flex h-10 items-center border-b border-[var(--border-default)] px-3">
        <span className="text-xs font-semibold">Endpoints <span className="font-normal text-[var(--text-muted)]">{endpoints.length}</span></span>
        <div className="ml-auto flex items-center gap-0.5">
          <IconButton label="Search endpoints" onClick={() => setSearchIsOpen((current) => !current)}><Search aria-hidden="true" size={13} /></IconButton>
          <IconButton label="Create endpoint" onClick={onCreate}><Plus aria-hidden="true" size={14} /></IconButton>
        </div>
      </div>

      {searchIsOpen ? (
        <div className="border-b border-[var(--border-default)] p-2">
          <div className="flex h-7 items-center rounded-md border border-[var(--border-default)] bg-[var(--bg-app)] px-2 focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-subtle)]">
            <Search aria-hidden="true" className="shrink-0 text-[var(--text-muted)]" size={12} />
            <input autoFocus className="min-w-0 flex-1 bg-transparent px-2 text-[11px] outline-none placeholder:text-[var(--text-muted)]" onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search method, path or name" value={searchQuery} />
            <button aria-label="Close endpoint search" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" onClick={closeSearch} type="button"><X aria-hidden="true" size={12} /></button>
          </div>
        </div>
      ) : null}

      {operationError ? <div className="border-b border-[var(--border-default)] px-3 py-2 text-[10px] leading-4 text-[var(--danger)]" role="alert">{operationError}</div> : null}

      {endpoints.length === 0 ? (
        <div className="px-3 py-4 text-center"><p className="text-[11px] leading-4 text-[var(--text-muted)]">No endpoints yet</p><button className="mt-1.5 text-[11px] font-medium text-[var(--accent)] hover:underline" onClick={onCreate} type="button">New endpoint</button></div>
      ) : groups.length === 0 ? (
        <div className="px-4 py-8 text-center"><p className="text-[11px] font-medium">No matching endpoints</p><p className="mt-1 text-[10px] leading-4 text-[var(--text-muted)]">Try another path, method, name, or status.</p></div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto py-1.5">
          <section
            className={`mb-1 transition-colors ${workingIsDragTarget ? 'bg-[var(--accent-subtle)]' : ''}`}
            onDragEnter={(event) => {
              event.preventDefault()
              workingDragDepth.current += 1
              setWorkingIsDragTarget(true)
            }}
            onDragLeave={() => {
              workingDragDepth.current = Math.max(0, workingDragDepth.current - 1)
              if (workingDragDepth.current === 0) setWorkingIsDragTarget(false)
            }}
            onDragOver={(event) => {
              event.preventDefault()
              event.dataTransfer.dropEffect = 'copy'
            }}
            onDrop={handleDrop}
          >
            <button aria-expanded={!collapsedGroups.has('__working')} className="flex h-7 w-full items-center gap-1.5 px-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.055em] text-[var(--text-muted)] hover:text-[var(--text-secondary)]" onClick={() => toggleGroup('__working')} type="button">
              {collapsedGroups.has('__working') ? <ChevronRight aria-hidden="true" size={11} /> : <ChevronDown aria-hidden="true" size={11} />}
              <span className="min-w-0 flex-1 truncate">Working</span>
              <span className="text-[9px] font-normal tracking-normal">{workingCount}</span>
            </button>

            {!collapsedGroups.has('__working') ? (
              workingEndpoints.length > 0
                ? workingEndpoints.map((endpoint) => renderEndpointRow(endpoint, 'working'))
                : <div className={`mx-1 mb-1.5 rounded px-2 py-2 text-center text-[9px] leading-3.5 ${workingIsDragTarget ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>{searchQuery && workingCount > 0 ? 'No working endpoints match the search.' : 'Drag endpoints here for quick access.'}</div>
            ) : null}
          </section>

          {groups.map((group) => {
            const isCollapsed = !searchQuery && collapsedGroups.has(group.key)
            return (
              <section className="mb-1" key={group.key}>
                <button aria-expanded={!isCollapsed} className="flex h-7 w-full items-center gap-1.5 px-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.055em] text-[var(--text-muted)] hover:text-[var(--text-secondary)]" onClick={() => toggleGroup(group.key)} type="button">
                  {isCollapsed ? <ChevronRight aria-hidden="true" size={11} /> : <ChevronDown aria-hidden="true" size={11} />}
                  <span className="min-w-0 flex-1 truncate">{group.label}</span>
                  <span className="text-[9px] font-normal tracking-normal">{group.endpoints.length}</span>
                </button>

                {!isCollapsed ? group.endpoints.map((endpoint) => renderEndpointRow(endpoint, 'group')) : null}
              </section>
            )
          })}
        </div>
      )}
    </aside>
  )
}
