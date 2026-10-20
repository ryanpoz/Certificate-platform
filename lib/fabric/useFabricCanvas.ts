import { useEffect, useRef, useState } from 'react'
import { Canvas } from 'fabric'
import { CanvasHistory } from './history'

export interface UseFabricCanvasOptions {
  width?: number
  height?: number
  backgroundColor?: string
}

export function useFabricCanvas(options: UseFabricCanvasOptions = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<Canvas | null>(null)
  const historyRef = useRef<CanvasHistory | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return

    // Create canvas
    const canvas = new Canvas(canvasRef.current, {
      width: options.width || 800,
      height: options.height || 600,
      backgroundColor: options.backgroundColor || '#ffffff'
    })

    // Create history
    const history = new CanvasHistory(canvas)

    fabricRef.current = canvas
    historyRef.current = history
    setIsReady(true)

    // Cleanup on unmount (StrictMode-safe)
    return () => {
      setIsReady(false)
      history.dispose()
      canvas.dispose()
      fabricRef.current = null
      historyRef.current = null
    }
  }, []) // Empty deps - only initialize once

  return {
    canvasRef,
    canvas: fabricRef.current,
    history: historyRef.current,
    isReady
  }
}
