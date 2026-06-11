import { useEffect, useState } from 'react'
import { DiagramCanvas } from './components/DiagramCanvas'
import { Sidebar } from './components/Sidebar'
import { Controls } from './components/Controls'
import { diagramById, defaultDiagramId, diagrams, collections, collectionOf } from './diagrams'

function readParams() {
  const p = new URLSearchParams(window.location.search)
  return { capture: p.get('capture') === '1', diagram: p.get('diagram') }
}

// How long each use case is shown during auto-play (ms).
const AUTOPLAY_INTERVAL = 8000

export default function App() {
  const { capture, diagram } = readParams()
  const initial = diagram && diagramById[diagram] ? diagram : defaultDiagramId
  const [activeId, setActiveId] = useState(initial)
  const [autoPlay, setAutoPlay] = useState(false)
  const active = diagramById[activeId] ?? diagrams[0]
  const activeCollection = collectionOf(activeId)

  const onSelectCollection = (id: string) => {
    const c = collections.find((x) => x.id === id)
    if (c) setActiveId(c.diagrams[0].id)
  }

  // Keep the URL in sync so a diagram can be deep-linked (interactive mode only).
  useEffect(() => {
    if (capture) return
    const u = new URL(window.location.href)
    u.searchParams.set('diagram', activeId)
    window.history.replaceState({}, '', u)
  }, [activeId, capture])

  // Auto-play: cycle through the current view's diagrams one by one. Keyed on activeId so each
  // diagram (whether reached automatically or by a manual click) gets the full interval.
  useEffect(() => {
    if (capture || !autoPlay) return
    const t = setTimeout(() => {
      const list = collectionOf(activeId).diagrams
      const idx = list.findIndex((d) => d.id === activeId)
      setActiveId(list[(idx + 1) % list.length].id)
    }, AUTOPLAY_INTERVAL)
    return () => clearTimeout(t)
  }, [autoPlay, activeId, capture])

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
      {!capture && (
        <Sidebar
          collections={collections}
          activeCollectionId={activeCollection.id}
          onSelectCollection={onSelectCollection}
          diagrams={activeCollection.diagrams}
          activeId={activeId}
          onSelect={setActiveId}
          autoPlay={autoPlay}
          onToggleAutoPlay={() => setAutoPlay((v) => !v)}
        />
      )}
      <main style={{ position: 'relative', flex: 1, height: '100%' }}>
        {!capture && <Controls title={active.title} />}
        <div style={{ position: 'absolute', inset: 0 }}>
          <DiagramCanvas diagram={active} capture={capture} />
        </div>
      </main>
    </div>
  )
}
