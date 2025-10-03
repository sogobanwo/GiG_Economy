import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

// GET /api/tasks - list all tasks
export async function GET() {
  try {
    const db = await getDb()
    const tasks = await db.collection('tasks').find({}).sort({ createdAt: -1 }).toArray()
    return NextResponse.json({ tasks })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Failed to list tasks' }, { status: 500 })
  }
}

// POST /api/tasks - create a task (persist in DB first)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, bounty, creator } = body

    if (!name || bounty === undefined || !creator) {
      return NextResponse.json({ error: 'Missing required fields: name, bounty, creator' }, { status: 400 })
    }

    const db = await getDb()
    const now = new Date()
  const doc = {
    name,
    bounty: bounty?.toString?.() ?? String(bounty), 
    creator,
    status: 0,
    contractTaskId: null,
    approvedSubmissionId: null,
    createdAt: now,
    updatedAt: now,
  }
    const result = await db.collection('tasks').insertOne(doc)
    const task = { _id: result.insertedId, ...doc }

    return NextResponse.json({ task }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Failed to create task' }, { status: 500 })
  }
}