'use client'

import { useScriptStore } from '@/lib/store/scriptStore'
import type { Script, Character } from '@/types'

interface RoleAssignmentProps {
  script: Script
}

export default function RoleAssignment({ script }: RoleAssignmentProps) {
  const { assignCharacter } = useScriptStore()

  const handleAssignmentChange = (characterName: string, assignedTo: 'human' | 'ai') => {
    assignCharacter(characterName, assignedTo)
  }

  // Count lines per character
  const lineCounts = script.characters.reduce((acc, char) => {
    acc[char.name] = script.lines.filter(
      line => line.character === char.name && line.type === 'dialogue'
    ).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold mb-2">Assign Roles</h2>
        <p className="text-gray-400 text-sm">
          Choose which character(s) you&apos;ll read. The AI will voice the rest.
        </p>
      </div>

      <div className="grid gap-4">
        {script.characters.map((character) => (
          <div
            key={character.name}
            className={`p-4 rounded-xl border-2 transition-all ${
              character.assignedTo === 'human'
                ? 'border-green-500 bg-green-500/10'
                : 'border-purple-500 bg-purple-500/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{character.name}</h3>
                <p className="text-sm text-gray-400">
                  {lineCounts[character.name]} lines
                  {character.suggestedVoiceType && (
                    <span className="ml-2 text-gray-500">
                      • {character.suggestedVoiceType}
                    </span>
                  )}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleAssignmentChange(character.name, 'human')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    character.assignedTo === 'human'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  👤 I&apos;ll Read
                </button>
                <button
                  onClick={() => handleAssignmentChange(character.name, 'ai')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    character.assignedTo === 'ai'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  🤖 AI Reads
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-8 p-4 rounded-lg bg-gray-800/50">
        <h3 className="font-medium mb-3">Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span>You read: </span>
            <span className="font-medium">
              {script.characters.filter(c => c.assignedTo === 'human').map(c => c.name).join(', ') || 'None'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500"></span>
            <span>AI reads: </span>
            <span className="font-medium">
              {script.characters.filter(c => c.assignedTo === 'ai').map(c => c.name).join(', ') || 'None'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
