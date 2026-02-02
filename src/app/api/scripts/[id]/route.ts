import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const SCRIPTS_FILE = path.join(DATA_DIR, 'scripts.json')

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

async function readScripts(): Promise<Record<string, unknown>> {
  try {
    await ensureDataDir()
    const data = await fs.readFile(SCRIPTS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return {}
  }
}

async function writeScripts(scripts: Record<string, unknown>): Promise<void> {
  await ensureDataDir()
  await fs.writeFile(SCRIPTS_FILE, JSON.stringify(scripts, null, 2))
}

// GET - Get a single script by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scripts = await readScripts()
    const script = scripts[params.id]
    
    if (!script) {
      return NextResponse.json(
        { success: false, error: 'Script not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, script })
  } catch (error) {
    console.error('Error reading script:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to read script' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a script by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scripts = await readScripts()
    
    if (!scripts[params.id]) {
      return NextResponse.json(
        { success: false, error: 'Script not found' },
        { status: 404 }
      )
    }

    delete scripts[params.id]
    await writeScripts(scripts)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting script:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete script' },
      { status: 500 }
    )
  }
}
