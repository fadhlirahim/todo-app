import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Todo {
  id: number;
  title: string;
  completed: number;
  priority: string;
  due_date: string | null;
  category: string | null;
  position: number | null;
  created_at: string;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates: string[] = [];
    const values: any[] = [];

    if (body.hasOwnProperty('completed')) {
      if (typeof body.completed !== 'boolean') {
        return NextResponse.json(
          { error: 'Completed must be a boolean' },
          { status: 400 }
        );
      }
      updates.push('completed = ?');
      values.push(body.completed ? 1 : 0);
    }

    if (body.hasOwnProperty('title')) {
      if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
        return NextResponse.json(
          { error: 'Title must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.push('title = ?');
      values.push(body.title.trim());
    }

    if (body.hasOwnProperty('priority')) {
      if (!['low', 'medium', 'high', 'urgent'].includes(body.priority)) {
        return NextResponse.json(
          { error: 'Priority must be one of: low, medium, high, urgent' },
          { status: 400 }
        );
      }
      updates.push('priority = ?');
      values.push(body.priority);
    }

    if (body.hasOwnProperty('due_date')) {
      updates.push('due_date = ?');
      values.push(body.due_date || null);
    }

    if (body.hasOwnProperty('category')) {
      updates.push('category = ?');
      values.push(body.category || null);
    }

    if (body.hasOwnProperty('position')) {
      updates.push('position = ?');
      values.push(body.position);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    values.push(id);
    const stmt = db.prepare(`UPDATE todos SET ${updates.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as Todo;

    return NextResponse.json(todo);
  } catch (error) {
    console.error('Error updating todo:', error);
    return NextResponse.json(
      { error: 'Failed to update todo', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const stmt = db.prepare('DELETE FROM todos WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json(
      { error: 'Failed to delete todo', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}