/**
 * Line Matcher Utility
 * Matches spoken words against expected script text with fuzzy matching
 */

export interface MatchResult {
  matchedWords: number
  totalWords: number
  matchPercentage: number
  matchedIndices: number[]  // Which words in the expected text have been matched
  isComplete: boolean
}

/**
 * Normalize text for comparison
 * - Lowercase
 * - Remove punctuation
 * - Collapse whitespace
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, '') // Keep apostrophes for contractions
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Split text into words
 */
export function getWords(text: string): string[] {
  return normalizeText(text).split(' ').filter(w => w.length > 0)
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

/**
 * Check if two words are similar enough (fuzzy match)
 * Allows for minor pronunciation differences
 */
export function wordsMatch(spoken: string, expected: string, tolerance: number = 0.3): boolean {
  // Exact match
  if (spoken === expected) return true
  
  // Very short words need exact match
  if (expected.length <= 2) return spoken === expected
  
  // Calculate similarity
  const distance = levenshteinDistance(spoken, expected)
  const maxLength = Math.max(spoken.length, expected.length)
  const similarity = 1 - (distance / maxLength)
  
  return similarity >= (1 - tolerance)
}

/**
 * Common speech recognition substitutions
 * Maps what might be heard to what was expected
 */
const COMMON_SUBSTITUTIONS: Record<string, string[]> = {
  "gonna": ["going", "going to"],
  "gotta": ["got to", "have to"],
  "wanna": ["want to"],
  "kinda": ["kind of"],
  "sorta": ["sort of"],
  "dunno": ["don't know"],
  "lemme": ["let me"],
  "gimme": ["give me"],
  "cause": ["because"],
  "cuz": ["because"],
  "yeah": ["yes"],
  "yep": ["yes"],
  "nope": ["no"],
  "ok": ["okay"],
  "alright": ["all right"],
}

/**
 * Check if spoken word matches expected, including common substitutions
 */
function wordsMatchWithSubstitutions(spoken: string, expected: string): boolean {
  if (wordsMatch(spoken, expected)) return true
  
  // Check if spoken word is a common substitution for expected
  for (const [sub, originals] of Object.entries(COMMON_SUBSTITUTIONS)) {
    if (spoken === sub && originals.some(o => o.includes(expected))) {
      return true
    }
    if (expected === sub && originals.some(o => o.includes(spoken))) {
      return true
    }
  }
  
  return false
}

/**
 * Match spoken transcript against expected line
 * Returns match statistics
 */
export function matchLine(
  spokenTranscript: string, 
  expectedLine: string,
  completionThreshold: number = 0.75
): MatchResult {
  const spokenWords = getWords(spokenTranscript)
  const expectedWords = getWords(expectedLine)
  
  if (expectedWords.length === 0) {
    return {
      matchedWords: 0,
      totalWords: 0,
      matchPercentage: 100,
      matchedIndices: [],
      isComplete: true
    }
  }
  
  const matchedIndices: number[] = []
  let spokenIndex = 0
  
  // Try to match spoken words to expected words in order
  // Allow skipping words (for partial recognition)
  for (let expectedIndex = 0; expectedIndex < expectedWords.length; expectedIndex++) {
    const expectedWord = expectedWords[expectedIndex]
    
    // Look ahead in spoken words for a match
    for (let lookAhead = spokenIndex; lookAhead < spokenWords.length; lookAhead++) {
      const spokenWord = spokenWords[lookAhead]
      
      if (wordsMatchWithSubstitutions(spokenWord, expectedWord)) {
        matchedIndices.push(expectedIndex)
        spokenIndex = lookAhead + 1
        break
      }
    }
  }
  
  const matchedWords = matchedIndices.length
  const totalWords = expectedWords.length
  const matchPercentage = (matchedWords / totalWords) * 100
  
  return {
    matchedWords,
    totalWords,
    matchPercentage,
    matchedIndices,
    isComplete: matchPercentage >= (completionThreshold * 100)
  }
}

/**
 * Create a line matcher instance that accumulates matches over time
 * Useful for tracking progress as user speaks
 */
export function createLineMatcher(expectedLine: string, completionThreshold: number = 0.75) {
  const expectedWords = getWords(expectedLine)
  let bestMatch: MatchResult = {
    matchedWords: 0,
    totalWords: expectedWords.length,
    matchPercentage: 0,
    matchedIndices: [],
    isComplete: false
  }
  
  return {
    /**
     * Update with new transcript (can be interim or final)
     */
    update(transcript: string): MatchResult {
      const newMatch = matchLine(transcript, expectedLine, completionThreshold)
      
      // Keep the best match we've seen
      if (newMatch.matchedWords > bestMatch.matchedWords) {
        bestMatch = newMatch
      }
      
      return bestMatch
    },
    
    /**
     * Get current best match
     */
    getMatch(): MatchResult {
      return bestMatch
    },
    
    /**
     * Reset matcher
     */
    reset() {
      bestMatch = {
        matchedWords: 0,
        totalWords: expectedWords.length,
        matchPercentage: 0,
        matchedIndices: [],
        isComplete: false
      }
    },
    
    /**
     * Get expected words for highlighting
     */
    getExpectedWords(): string[] {
      return expectedWords
    }
  }
}

export type LineMatcher = ReturnType<typeof createLineMatcher>
