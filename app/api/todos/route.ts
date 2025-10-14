import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Todo {
  id: number;
  title: string;
  completed: number;
  due_date: string | null;
  completed_by: string | null;
  created_at: string;
}

export async function GET() {
  try {
    const todos = db.prepare('SELECT * FROM todos ORDER BY created_at DESC').all() as Todo[];
    return NextResponse.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch todos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, due_date } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const stmt = db.prepare('INSERT INTO todos (title, completed, due_date) VALUES (?, 0, ?)');
    const result = stmt.run(title.trim(), due_date || null);

    const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(result.lastInsertRowid) as Todo;

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json(
      { error: 'Failed to create todo', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}