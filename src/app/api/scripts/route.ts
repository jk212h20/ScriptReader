import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// Store scripts in a JSON file on the server
const DATA_DIR = path.join(process.cwd(), 'data')
const SCRIPTS_FILE = path.join(DATA_DIR, 'scripts.json')

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

// Read all scripts from file
async function readScripts(): Promise<Record<string, unknown>> {
  try {
    await ensureDataDir()
    const data = await fs.readFile(SCRIPTS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return {}
  }
}

// Write scripts to file
async function writeScripts(scripts: Record<string, unknown>): Promise<void> {
  await ensureDataDir()
  await fs.writeFile(SCRIPTS_FILE, JSON.stringify(scripts, null, 2))
}

// GET - List all scripts
export async function GET() {
  try {
    const scripts = await readScripts()
    const scriptList = Object.values(scripts)
    return NextResponse.json({ success: true, scripts: scriptList })
  } catch (error) {
    console.error('Error reading scripts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to read scripts' },
      { status: 500 }
    )
  }
}

// POST - Create or update a script
export async function POST(request: NextRequest) {
  try {
    const script = await request.json()
    
    if (!script.id) {
      return NextResponse.json(
        { success: false, error: 'Script ID required' },
        { status: 400 }
      )
    }

    const scripts = await readScripts()
    scripts[script.id] = {
      ...script,
      updatedAt: new Date().toISOString()
    }
    await writeScripts(scripts)

    return NextResponse.json({ success: true, script: scripts[script.id] })
  } catch (error) {
    console.error('Error saving script:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save script' },
      { status: 500 }
    )
  }
}
