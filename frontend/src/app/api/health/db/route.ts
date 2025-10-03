import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

// GET /api/health/db - quick MongoDB connectivity check
export async function GET() {
  try {
    const db = await getDb()
    const ping = await db.command({ ping: 1 })
    return NextResponse.json({ ok: true, ping })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? 'MongoDB connection failed' }, { status: 500 })
  }
}