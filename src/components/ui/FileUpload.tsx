'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

const ACCEPTED_TYPES = {
  'text/plain': ['.txt'],
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
}

export default function FileUpload() {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    setIsProcessing(true)

    try {
      let textContent: string

      if (file.type === 'text/plain') {
        textContent = await file.text()
      } else if (file.type === 'application/pdf') {
        // Dynamically import PDF.js legacy build for better browser compatibility
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
        
        // Use unpkg CDN which is more reliable than cdnjs for pdf.js
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`
        
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise
        
        const textParts: string[] = []
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          const pageText = content.items
            .map((item) => ('str' in item ? (item as { str: string }).str : ''))
            .join(' ')
          textParts.push(pageText)
        }
        textContent = textParts.join('\n\n')
      } else if (file.type.startsWith('image/')) {
        // TODO: Implement OCR with Tesseract.js
        setError('Image OCR coming soon!')
        setIsProcessing(false)
        return
      } else {
        setError('Unsupported file type')
        setIsProcessing(false)
        return
      }

      // Store raw text and navigate to parsing
      localStorage.setItem('pendingScript', JSON.stringify({
        fileName: file.name,
        rawText: textContent,
        uploadedAt: new Date().toISOString(),
      }))

      router.push('/script/new')
    } catch (err) {
      setError('Failed to read file')
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }, [router])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  return (
    <div className="w-full">
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative cursor-pointer rounded-xl border-2 border-dashed p-12
          transition-all duration-200 ease-in-out
          ${isDragging 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-gray-600 hover:border-gray-500 hover:bg-white/5'
          }
          ${isProcessing ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf,.png,.jpg,.jpeg,.webp"
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          {isProcessing ? (
            <>
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-600 border-t-blue-500" />
              <p className="text-gray-400">Processing...</p>
            </>
          ) : (
            <>
              <div className="text-5xl">📜</div>
              <div className="text-center">
                <p className="text-lg font-medium">
                  Drop your script here
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  or click to browse
                </p>
              </div>
              <p className="text-xs text-gray-600">
                Supports .txt, .pdf, and images
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  )
}
