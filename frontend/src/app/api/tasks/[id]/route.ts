import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// GET /api/tasks/[id] - get a single task by id
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }
    const db = await getDb()
    const task = await db.collection('tasks').findOne({ _id: new ObjectId(id) })
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    return NextResponse.json({ task })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Failed to get task' }, { status: 500 })
  }
}