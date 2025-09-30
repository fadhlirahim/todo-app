import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { completed } = await request.json();

    db.prepare('UPDATE todos SET completed = ? WHERE id = ?').run(completed ? 1 : 0, id);
    const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);

    return NextResponse.json(todo);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    db.prepare('DELETE FROM todos WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
  }
}