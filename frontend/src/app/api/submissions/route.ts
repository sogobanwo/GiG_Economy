import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET() {
  try {
    const db = await getDb()
    const submissions = await db.collection('submissions').find({}).sort({ createdAt: -1 }).toArray()
    return NextResponse.json({ submissions })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Failed to list submissions' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { taskId, submitter, content } = body

    if (!taskId || !submitter || !content) {
      return NextResponse.json({ error: 'Missing required fields: taskId, submitter, content' }, { status: 400 })
    }

    if (!ObjectId.isValid(taskId)) {
      return NextResponse.json({ error: 'Invalid taskId' }, { status: 400 })
    }

    const db = await getDb()
    const task = await db.collection('tasks').findOne({ _id: new ObjectId(taskId) })
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const now = new Date()
    const doc = {
      taskId: new ObjectId(taskId),
      submitter,
      content,
      contractSubId: null,
      approved: false,
      createdAt: now,
      updatedAt: now,
    }
    const result = await db.collection('submissions').insertOne(doc)
    const submission = { _id: result.insertedId, ...doc }


    return NextResponse.json({ submission }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Failed to create submission' }, { status: 500 })
  }
}