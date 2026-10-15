/**
 * Test to prevent event handlers in Server Components
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

describe('Server Components validation', () => {
  function getAllTsxFiles(dir: string, fileList: string[] = []): string[] {
    const files = readdirSync(dir)
    
    files.forEach(file => {
      const filePath = join(dir, file)
      const stat = statSync(filePath)
      
      if (stat.isDirectory()) {
        if (!file.startsWith('.') && file !== 'node_modules') {
          getAllTsxFiles(filePath, fileList)
        }
      } else if (file.endsWith('.tsx') && !file.endsWith('.test.tsx')) {
        fileList.push(filePath)
      }
    })
    
    return fileList
  }

  it('should not have event handlers in Server Components', () => {
    const appDir = join(process.cwd(), 'app')
    const tsxFiles = getAllTsxFiles(appDir)
    
    const violations: string[] = []
    
    tsxFiles.forEach(file => {
      const content = readFileSync(file, 'utf-8')
      const lines = content.split('\n')
      
      const hasUseClient = lines[0].includes("'use client'") || lines[0].includes('"use client"')
      
      if (!hasUseClient) {
        const eventHandlers = ['onChange=', 'onClick=', 'onSubmit=', 'onKeyDown=', 'onKeyUp=', 'onFocus=', 'onBlur=']
        
        eventHandlers.forEach(handler => {
          if (content.includes(handler)) {
            const lineNumbers = lines
              .map((line, idx) => line.includes(handler) ? idx + 1 : -1)
              .filter(n => n !== -1)
            
            violations.push(`${file.replace(process.cwd(), '.')} has ${handler} on line(s) ${lineNumbers.join(', ')}`)
          }
        })
      }
    })
    
    if (violations.length > 0) {
      throw new Error(
        `Found event handlers in Server Components:\n${violations.join('\n')}\n\n` +
        `Event handlers are not allowed in Server Components. ` +
        `Add 'use client' directive or move interactive elements to a Client Component.`
      )
    }
  })
})
