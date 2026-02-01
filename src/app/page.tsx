import FileUpload from '@/components/ui/FileUpload'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            ScriptReader
          </h1>
          <p className="text-lg text-gray-400">
            Your AI scene partner for script practice
          </p>
        </div>

        {/* Upload Area */}
        <FileUpload />

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm text-gray-500">
          <div className="p-4 rounded-lg bg-white/5">
            <div className="text-2xl mb-2">📄</div>
            <div>Upload any script format</div>
          </div>
          <div className="p-4 rounded-lg bg-white/5">
            <div className="text-2xl mb-2">🎭</div>
            <div>AI reads other characters</div>
          </div>
          <div className="p-4 rounded-lg bg-white/5">
            <div className="text-2xl mb-2">🎯</div>
            <div>Auto-follows your lines</div>
          </div>
        </div>
      </div>
    </main>
  )
}
