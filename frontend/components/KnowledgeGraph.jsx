'use client'
import { useEffect, useRef, useCallback, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

export default function KnowledgeGraph({ notebookId }) {
  const containerRef = useRef(null)
  const graphRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [graphData, setGraphData] = useState(null)
  const { authFetch } = useAuth()

  useEffect(() => {
    const load = async () => {
      try {
        const res = await authFetch(`/api/notebooks/${notebookId}/graph`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail)
        setGraphData(data)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [notebookId])

  useEffect(() => {
    if (!graphData || !containerRef.current || typeof window === 'undefined') return
    if (graphData.nodes.length === 0) return

    // Dynamically import react-force-graph-2d (client-side only)
    import('react-force-graph-2d').then(({ default: ForceGraph2D }) => {
      if (!containerRef.current) return

      const TYPE_COLORS = {
        Person: '#748ffc',
        Organization: '#69db7c',
        Concept: '#ffd43b',
        Location: '#ff8787',
        Event: '#f783ac',
        Other: '#74c0fc',
      }

      const fgData = {
        nodes: graphData.nodes.map(n => ({
          id: n.id,
          label: n.label,
          type: n.type,
          color: TYPE_COLORS[n.type] || TYPE_COLORS.Other,
        })),
        links: graphData.edges.map(e => ({
          source: e.source,
          target: e.target,
          label: e.label,
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
          backgroundColor: '#0d0e0f',
          nodeLabel: 'label',
          nodeColor: 'color',
          nodeRelSize: 5,
          linkColor: () => '#2c2e33',
          linkWidth: 1.5,
          linkDirectionalArrowLength: 4,
          linkDirectionalArrowRelPos: 1,
          linkLabel: 'label',
          nodeCanvasObject: (node, ctx, globalScale) => {
            const label = node.label
            const fontSize = Math.max(10 / globalScale, 3)
            ctx.font = `${fontSize}px Inter, sans-serif`
            ctx.fillStyle = node.color
            ctx.beginPath()
            ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI)
            ctx.fill()
            if (globalScale >= 0.8) {
              ctx.fillStyle = '#c1c2c5'
              ctx.textAlign = 'center'
              ctx.fillText(label, node.x, node.y + 9)
            }
          },
        })
      )
    })

    return () => {
      graphRef.current?.unmount?.()
    }
  }, [graphData])

  if (loading) return <div className="flex-1 flex items-center justify-center"><LoadingSpinner text="Đang tải đồ thị..." /></div>

  if (error) return (
    <div className="flex-1 flex items-center justify-center text-sm" style={{ color: '#f87171' }}>
      Lỗi: {error}
    </div>
  )

  if (!graphData || graphData.nodes.length === 0) return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 opacity-30"
        style={{ background: 'var(--surface-3)' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" /><circle cx="3" cy="6" r="2" /><circle cx="21" cy="6" r="2" />
          <circle cx="3" cy="18" r="2" /><circle cx="21" cy="18" r="2" />
          <line x1="5" y1="7" x2="10" y2="10" /><line x1="19" y1="7" x2="14" y2="10" />
          <line x1="5" y1="17" x2="10" y2="14" /><line x1="19" y1="17" x2="14" y2="14" />
        </svg>
      </div>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Chưa có đồ thị tri thức. Upload tài liệu để AI xây dựng đồ thị.
      </p>
    </div>
  )

  return <div ref={containerRef} className="flex-1 w-full" id="knowledge-graph-canvas" />
}
