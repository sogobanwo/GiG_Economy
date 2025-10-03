import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// GET /api/submissions/[id] - get a single submission by id
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }
    const db = await getDb()
    const submission = await db.collection('submissions').findOne({ _id: new ObjectId(id) })
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }
    return NextResponse.json({ submission })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Failed to get submission' }, { status: 500 })
  }
}

// PATCH /api/submissions/[id] - approve a submission
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const { approved } = body as { approved?: boolean }

    if (!approved) {
      return NextResponse.json({ error: 'Only approving submissions is supported' }, { status: 400 })
    }

    const db = await getDb()
    const submission = await db.collection('submissions').findOne({ _id: new ObjectId(id) })
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Ensure the task exists
    const taskId: ObjectId = submission.taskId
    const task = await db.collection('tasks').findOne({ _id: new ObjectId(taskId) })
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Ensure only one approved submission per task
    const alreadyApproved = await db.collection('submissions').findOne({ taskId: new ObjectId(taskId), approved: true })
    if (alreadyApproved && String(alreadyApproved._id) !== String(id)) {
      return NextResponse.json({ error: 'Task already has an approved submission' }, { status: 409 })
    }

    const now = new Date()
    await db.collection('submissions').updateOne(
      { _id: new ObjectId(id) },
      { $set: { approved: true, updatedAt: now } }
    )

    // Mark task as done and record approvedSubmissionId
    await db.collection('tasks').updateOne(
      { _id: new ObjectId(taskId) },
      { $set: { status: 1, approvedSubmissionId: new ObjectId(id), updatedAt: now } }
    )

    const updated = await db.collection('submissions').findOne({ _id: new ObjectId(id) })
    return NextResponse.json({ submission: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Failed to approve submission' }, { status: 500 })
  }
}