import { Canvas } from 'fabric'

export interface HistoryState {
  canUndo: boolean
  canRedo: boolean
}

export class CanvasHistory {
  private canvas: Canvas
  private history: string[] = []
  private historyIndex = -1
  private isLoading = false
  private maxHistory = 50
  private listeners: ((state: HistoryState) => void)[] = []

  constructor(canvas: Canvas) {
    this.canvas = canvas
    this.setupEventListeners()
  }

  private setupEventListeners() {
    // Save history on object modifications
    this.canvas.on('object:modified', () => this.saveState())
    this.canvas.on('object:added', () => this.saveState())
    this.canvas.on('object:removed', () => this.saveState())
    
    // Save when text editing completes
    this.canvas.on('text:editing:exited', () => this.saveState())
  }

  public async saveState() {
    if (this.isLoading) return
    
    const json = JSON.stringify(this.canvas.toJSON(['data', 'id']))
    
    // Don't save if state hasn't changed
    if (this.history[this.historyIndex] === json) return
    
    // Remove any "future" history if we're not at the end
    this.history = this.history.slice(0, this.historyIndex + 1)
    
    // Add new state
    this.history.push(json)
    
    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    } else {
      this.historyIndex++
    }
    
    this.notifyListeners()
  }

  public async undo() {
    if (!this.canUndo()) return
    
    this.historyIndex--
    await this.loadState(this.history[this.historyIndex])
    this.notifyListeners()
  }

  public async redo() {
    if (!this.canRedo()) return
    
    this.historyIndex++
    await this.loadState(this.history[this.historyIndex])
    this.notifyListeners()
  }

  private async loadState(json: string) {
    this.isLoading = true
    
    try {
      // Parse and load the state
      const state = JSON.parse(json)
      
      // Clear existing objects
      this.canvas.clear()
      
      // Load from JSON (await in Fabric v6)
      await new Promise<void>((resolve) => {
        this.canvas.loadFromJSON(state, () => {
          this.canvas.renderAll()
          resolve()
        })
      })
    } finally {
      this.isLoading = false
    }
  }

  public canUndo(): boolean {
    return this.historyIndex > 0
  }

  public canRedo(): boolean {
    return this.historyIndex < this.history.length - 1
  }

  public getState(): HistoryState {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    }
  }

  public onChange(callback: (state: HistoryState) => void) {
    this.listeners.push(callback)
    callback(this.getState())
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback)
    }
  }

  private notifyListeners() {
    const state = this.getState()
    this.listeners.forEach(listener => listener(state))
  }

  public clear() {
    this.history = []
    this.historyIndex = -1
    this.notifyListeners()
  }

  public dispose() {
    this.canvas.off('object:modified')
    this.canvas.off('object:added')
    this.canvas.off('object:removed')
    this.canvas.off('text:editing:exited')
    this.listeners = []
  }
}
