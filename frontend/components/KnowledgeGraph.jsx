'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Network, RefreshCw, Layers, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

const TYPE_COLORS = {
  Person: '#818cf8',      // Soft Indigo
  Organization: '#34d399',// Emerald
  Concept: '#fbbf24',     // Amber
  Location: '#f87171',    // Coral
  Event: '#f472b6',       // Pink
  Other: '#38bdf8',       // Sky
}

export default function KnowledgeGraph({ notebookId }) {
  const containerRef = useRef(null)
  const graphRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [graphData, setGraphData] = useState(null)
  const [activeFilter, setActiveFilter] = useState('ALL')
  const { authFetch } = useAuth()

  const fetchGraph = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await authFetch(`/api/notebooks/${notebookId}/graph`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Không tải được dữ liệu đồ thị')
      setGraphData(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [notebookId, authFetch])

  useEffect(() => {
    fetchGraph()
  }, [fetchGraph])

  useEffect(() => {
    if (!graphData || !containerRef.current || typeof window === 'undefined') return
    if (graphData.nodes.length === 0) return

    // Dynamically import react-force-graph-2d
    import('react-force-graph-2d').then(({ default: ForceGraph2D }) => {
      if (!containerRef.current) return

      const filteredNodes = activeFilter === 'ALL'
        ? graphData.nodes
        : graphData.nodes.filter(n => n.type === activeFilter)

      const nodeIds = new Set(filteredNodes.map(n => n.id))
      const filteredEdges = graphData.edges.filter(
        e => nodeIds.has(e.source?.id || e.source) && nodeIds.has(e.target?.id || e.target)
      )

      const fgData = {
        nodes: filteredNodes.map(n => ({
          id: n.id,
          label: n.label || n.id,
          type: n.type || 'Other',
          color: TYPE_COLORS[n.type] || TYPE_COLORS.Other,
        })),
        links: filteredEdges.map(e => ({
          source: e.source,
          target: e.target,
          label: e.label || '',
        })),
      }

      const { createElement } = require('react')
      const { createRoot } = require('react-dom/client')

      if (graphRef.current) {
        graphRef.current.unmount?.()
      }

      const root = createRoot(containerRef.current)
      graphRef.current = root

      root.render(
        createElement(ForceGraph2D, {
          graphData: fgData,
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
          backgroundColor: '#090a0f',
          nodeLabel: 'label',
          nodeColor: 'color',
          nodeRelSize: 6,
          linkColor: () => 'rgba(255, 255, 255, 0.12)',
          linkWidth: 1.5,
          linkDirectionalArrowLength: 4,
          linkDirectionalArrowRelPos: 0.95,
          linkLabel: 'label',
          nodeCanvasObject: (node, ctx, globalScale) => {
            const label = node.label
            const fontSize = Math.max(11 / globalScale, 3.5)
            ctx.font = `${fontSize}px Inter, sans-serif`
            
            // Outer subtle glow
            ctx.beginPath()
            ctx.arc(node.x, node.y, 6.5, 0, 2 * Math.PI)
            ctx.fillStyle = node.color
            ctx.shadowColor = node.color
            ctx.shadowBlur = 8
            ctx.fill()
            ctx.shadowBlur = 0

            // Inner core
            ctx.beginPath()
            ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI)
            ctx.fillStyle = '#ffffff'
            ctx.fill()

            // Label text
            if (globalScale >= 0.75) {
              ctx.fillStyle = '#f1f5f9'
              ctx.textAlign = 'center'
              ctx.fillText(label, node.x, node.y + 11)
            }
          },
        })
      )
    })

    return () => {
      graphRef.current?.unmount?.()
    }
  }, [graphData, activeFilter])

  return (
    <div className="flex-1 flex flex-col h-full bg-[#090a0f] relative overflow-hidden">
      {/* Graph Control Bar */}
      <div
        className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3 z-10"
        style={{ background: 'rgba(18, 21, 30, 0.85)', backdropFilter: 'blur(16px)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Network size={14} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[var(--text-bright)]">Đồ thị Tri thức (Knowledge Graph)</h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              {graphData ? `${graphData.nodes.length} thực thể • ${graphData.edges.length} quan hệ` : 'Đang xử lý...'}
            </p>
          </div>
        </div>

        {/* Legend / Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <button
              key={type}
              onClick={() => setActiveFilter(prev => prev === type ? 'ALL' : type)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
              style={{
                background: activeFilter === type ? 'var(--surface-elevated)' : 'var(--surface)',
                border: `1px solid ${activeFilter === type ? color : 'var(--border)'}`,
                color: activeFilter === type ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span>{type}</span>
            </button>
          ))}

          <button
            onClick={fetchGraph}
            className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-white transition-colors ml-1"
            title="Tải lại đồ thị"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Graph Content */}
      <div className="flex-1 relative w-full h-full flex items-center justify-center">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#090a0f]/80 backdrop-blur-sm">
            <LoadingSpinner text="Đang trực quan hóa đồ thị tri thức..." />
          </div>
        )}

        {error && (
          <div className="text-center p-8 max-w-sm">
            <p className="text-sm text-red-400 mb-3">Lỗi: {error}</p>
            <button onClick={fetchGraph} className="btn-secondary text-xs">Thử lại</button>
          </div>
        )}

        {!loading && !error && (!graphData || graphData.nodes.length === 0) && (
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)]">
              <Layers size={28} />
            </div>
            <h4 className="text-sm font-semibold text-[var(--text-bright)] mb-1.5">Chưa có dữ liệu đồ thị tri thức</h4>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Hãy upload tài liệu (PDF, Scan, Ảnh hoặc URL) vào notebook này. Mô hình AI sẽ tự động phân tích và tạo mạng lưới liên kết giữa các thực thể.
            </p>
          </div>
        )}

        <div ref={containerRef} className="w-full h-full" id="knowledge-graph-canvas" />
      </div>
    </div>
  )
}
