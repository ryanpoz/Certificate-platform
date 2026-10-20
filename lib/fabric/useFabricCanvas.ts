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
  const [canvas, setCanvas] = useState<Canvas | null>(null)
  const [history, setHistory] = useState<CanvasHistory | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return

    // Create canvas
    const fabricCanvas = new Canvas(canvasRef.current, {
      width: options.width || 800,
      height: options.height || 600,
      backgroundColor: options.backgroundColor || '#ffffff'
    })

    // Create history
    const canvasHistory = new CanvasHistory(fabricCanvas)

    setCanvas(fabricCanvas)
    setHistory(canvasHistory)
    setIsReady(true)

    // Cleanup on unmount (StrictMode-safe)
    return () => {
      setIsReady(false)
      setCanvas(null)
      setHistory(null)
      canvasHistory.dispose()
      fabricCanvas.dispose()
    }
  }, []) // Empty deps - only initialize once

  return {
    canvasRef,
    canvas,
    history,
    isReady
  }
}
