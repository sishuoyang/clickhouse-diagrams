import { theme } from '../theme'
import { icons } from '../icons'
import type { Collection, DiagramDef } from '../diagrams'

const collapseBtnStyle: React.CSSProperties = {
  cursor: 'pointer',
  width: 28,
  height: 28,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 8,
  background: theme.panel,
  color: theme.text,
  border: `1px solid ${theme.panelBorder}`,
  fontSize: 16,
  lineHeight: 1,
}

export function Sidebar({
  collections,
  activeCollectionId,
  onSelectCollection,
  diagrams,
  activeId,
  onSelect,
  autoPlay,
  onToggleAutoPlay,
  collapsed,
  onToggleCollapse,
}: {
  collections: Collection[]
  activeCollectionId: string
  onSelectCollection: (id: string) => void
  diagrams: DiagramDef[]
  activeId: string
  onSelect: (id: string) => void
  autoPlay: boolean
  onToggleAutoPlay: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const active = diagrams.find((d) => d.id === activeId)

  // Collapsed: a slim rail with just the logo and an expand button, so the canvas gets the space.
  if (collapsed) {
    return (
      <aside
        className="app-sidebar"
        style={{
          width: 52,
          flexShrink: 0,
          height: '100%',
          background: theme.inkSoft,
          borderRight: `1px solid ${theme.panelBorder}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '16px 0',
          gap: 16,
        }}
      >
        <span
          aria-label="ClickHouse"
          style={{ width: 28, height: 28, display: 'block', flexShrink: 0 }}
          dangerouslySetInnerHTML={{ __html: icons.clickhouse }}
        />
        <button
          onClick={onToggleCollapse}
          title="Expand menu"
          aria-label="Expand menu"
          style={collapseBtnStyle}
        >
          ☰
        </button>
      </aside>
    )
  }

  return (
    <aside
      className="app-sidebar"
      style={{
        width: 300,
        flexShrink: 0,
        height: '100%',
        background: theme.inkSoft,
        borderRight: `1px solid ${theme.panelBorder}`,
        display: 'flex',
        flexDirection: 'column',
        padding: 20,
        gap: 16,
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          aria-label="ClickHouse"
          style={{ width: 30, height: 30, display: 'block', flexShrink: 0 }}
          dangerouslySetInnerHTML={{ __html: icons.clickhouse }}
        />
        <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.25 }}>
          ClickHouse Reference Architectures
          <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 500 }}>
            AWS · Google Cloud · Vendor-Neutral
          </div>
        </div>
        <button
          onClick={onToggleCollapse}
          title="Collapse menu"
          aria-label="Collapse menu"
          style={{ ...collapseBtnStyle, marginLeft: 'auto', alignSelf: 'flex-start' }}
        >
          ‹
        </button>
      </div>

      {/* View switcher: buttons (one per collection) shown directly on the menu for quick switching */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, letterSpacing: 0.3 }}>
          VIEW
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {collections.map((c) => {
            const isActive = c.id === activeCollectionId
            return (
              <button
                key={c.id}
                onClick={() => onSelectCollection(c.id)}
                style={{
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: 10,
                  padding: '9px 12px',
                  background: isActive ? theme.yellow : theme.panel,
                  color: isActive ? theme.ink : theme.text,
                  border: `1px solid ${isActive ? theme.yellow : theme.panelBorder}`,
                  fontSize: 13.5,
                  fontWeight: 700,
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {c.label}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ height: 1, background: theme.panelBorder, margin: '2px 0' }} />

      <button
        onClick={onToggleAutoPlay}
        title="Cycle through the diagrams automatically — pause to explain one"
        style={{
          cursor: 'pointer',
          textAlign: 'left',
          borderRadius: 12,
          padding: '11px 14px',
          background: autoPlay ? theme.yellow : theme.panel,
          color: autoPlay ? theme.ink : theme.text,
          border: `1px solid ${autoPlay ? theme.yellow : theme.panelBorder}`,
          fontSize: 14,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 13 }}>{autoPlay ? '⏸' : '▶'}</span>
        {autoPlay ? 'Pause auto-play' : 'Auto-play'}
      </button>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {diagrams.map((d) => {
          const isActive = d.id === activeId
          return (
            <button
              key={d.id}
              onClick={() => onSelect(d.id)}
              style={{
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: 12,
                padding: '12px 14px',
                background: isActive ? theme.yellow : 'transparent',
                color: isActive ? theme.ink : theme.text,
                border: `1px solid ${isActive ? theme.yellow : theme.panelBorder}`,
                fontSize: 14,
                fontWeight: 600,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {d.title}
            </button>
          )
        })}
      </nav>

      {active && (
        <p
          style={{
            fontSize: 12.5,
            lineHeight: 1.5,
            color: theme.textMuted,
            margin: 0,
            marginTop: 'auto',
          }}
        >
          {active.description}
        </p>
      )}
    </aside>
  )
}
