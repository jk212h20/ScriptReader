'use client'

import { useScriptStore } from '@/lib/store/scriptStore'
import type { Script, ScriptLine } from '@/types'

interface ScriptDisplayProps {
  script: Script
  isEditing: boolean
  currentLineIndex?: number
}

export default function ScriptDisplay({ script, isEditing, currentLineIndex }: ScriptDisplayProps) {
  const { updateLine } = useScriptStore()

  const handleTextChange = (lineId: string, newText: string) => {
    updateLine(lineId, { text: newText })
  }

  const getLineStyles = (line: ScriptLine, index: number) => {
    const isCurrentLine = currentLineIndex === index
    const isHumanLine = line.assignedTo === 'human'
    const isAiLine = line.assignedTo === 'ai'
    const isDirection = line.type === 'direction' || line.type === 'action'

    let baseStyles = 'p-3 rounded-lg transition-all duration-200'

    if (isCurrentLine) {
      baseStyles += ' ring-2 ring-blue-500 bg-blue-500/10'
    }

    if (isDirection) {
      baseStyles += ' italic text-gray-500 bg-gray-800/30'
    } else if (isHumanLine) {
      baseStyles += ' bg-green-900/20 border-l-4 border-green-500'
    } else if (isAiLine) {
      baseStyles += ' bg-purple-900/20 border-l-4 border-purple-500'
    }

    return baseStyles
  }

  return (
    <div className="space-y-2 teleprompter-scroll">
      {script.lines.map((line, index) => (
        <div key={line.id} className={getLineStyles(line, index)}>
          {/* Character name */}
          {line.character && (
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm font-bold ${
                line.assignedTo === 'human' ? 'text-green-400' : 'text-purple-400'
              }`}>
                {line.character}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                line.assignedTo === 'human' 
                  ? 'bg-green-500/20 text-green-300' 
                  : 'bg-purple-500/20 text-purple-300'
              }`}>
                {line.assignedTo === 'human' ? 'YOU' : 'AI'}
              </span>
            </div>
          )}

          {/* Line text */}
          {isEditing ? (
            <textarea
              value={line.text}
              onChange={(e) => handleTextChange(line.id, e.target.value)}
              className="w-full bg-transparent border border-gray-700 rounded p-2 text-sm resize-none focus:outline-none focus:border-blue-500"
              rows={Math.ceil(line.text.length / 60)}
            />
          ) : (
            <p className={`text-sm ${line.type !== 'dialogue' ? 'text-gray-400' : ''}`}>
              {line.text}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
