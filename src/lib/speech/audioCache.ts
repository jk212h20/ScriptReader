/**
 * Audio Cache Service
 * Caches TTS audio blobs to IndexedDB for persistent storage
 */

// Simple hash function for cache keys
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(36)
}

/**
 * Generate a cache key from text and voice parameters
 */
export function getCacheKey(text: string, voiceDescription?: string): string {
  const normalized = text.toLowerCase().trim()
  const voice = voiceDescription?.toLowerCase().trim() || 'default'
  return `tts-${hashString(normalized)}-${hashString(voice)}`
}

const DB_NAME = 'scriptreader-audio-cache'
const DB_VERSION = 1
const STORE_NAME = 'audio-blobs'

class AudioCacheService {
  private db: IDBDatabase | null = null
  private memoryCache: Map<string, Blob> = new Map() // Fast in-memory fallback
  private initPromise: Promise<void> | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.initPromise = this.initDB()
    }
  }

  /**
   * Initialize IndexedDB
   */
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        console.warn('IndexedDB not available, using memory cache only')
        resolve()
        return
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error)
        resolve() // Don't reject, fall back to memory cache
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('Audio cache IndexedDB initialized')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' })
          console.log('Created audio cache object store')
        }
      }
    })
  }

  /**
   * Ensure DB is ready
   */
  private async ensureReady(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise
    }
  }

  /**
   * Get cached audio blob
   */
  async get(key: string): Promise<Blob | undefined> {
    // Check memory cache first (fastest)
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key)
    }

    await this.ensureReady()

    if (!this.db) {
      return undefined
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_NAME, 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.get(key)

        request.onsuccess = () => {
          if (request.result) {
            const blob = request.result.blob as Blob
            // Also store in memory cache for faster subsequent access
            this.memoryCache.set(key, blob)
            resolve(blob)
          } else {
            resolve(undefined)
          }
        }

        request.onerror = () => {
          console.error('Failed to get from cache:', request.error)
          resolve(undefined)
        }
      } catch (error) {
        console.error('Cache get error:', error)
        resolve(undefined)
      }
    })
  }

  /**
   * Store audio blob in cache (both memory and IndexedDB)
   */
  async set(key: string, blob: Blob): Promise<void> {
    // Always store in memory cache
    this.memoryCache.set(key, blob)

    await this.ensureReady()

    if (!this.db) {
      return
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_NAME, 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.put({ key, blob, timestamp: Date.now() })

        request.onsuccess = () => {
          console.log('Audio cached to IndexedDB:', key)
          resolve()
        }

        request.onerror = () => {
          console.error('Failed to cache audio:', request.error)
          resolve()
        }
      } catch (error) {
        console.error('Cache set error:', error)
        resolve()
      }
    })
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    if (this.memoryCache.has(key)) {
      return true
    }

    const blob = await this.get(key)
    return blob !== undefined
  }

  /**
   * Clear all cached audio
   */
  async clear(): Promise<void> {
    this.memoryCache.clear()

    await this.ensureReady()

    if (!this.db) {
      return
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_NAME, 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.clear()

        request.onsuccess = () => {
          console.log('Audio cache cleared')
          resolve()
        }

        request.onerror = () => {
          console.error('Failed to clear cache:', request.error)
          resolve()
        }
      } catch (error) {
        console.error('Cache clear error:', error)
        resolve()
      }
    })
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ memorySize: number; dbSize: number }> {
    await this.ensureReady()

    let dbSize = 0

    if (this.db) {
      dbSize = await new Promise((resolve) => {
        try {
          const transaction = this.db!.transaction(STORE_NAME, 'readonly')
          const store = transaction.objectStore(STORE_NAME)
          const request = store.count()

          request.onsuccess = () => resolve(request.result)
          request.onerror = () => resolve(0)
        } catch {
          resolve(0)
        }
      })
    }

    return {
      memorySize: this.memoryCache.size,
      dbSize
    }
  }
}

// Singleton instance
export const audioCache = typeof window !== 'undefined' 
  ? new AudioCacheService() 
  : null as unknown as AudioCacheService
