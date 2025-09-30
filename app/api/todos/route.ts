import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const todos = db.prepare('SELECT * FROM todos ORDER BY created_at DESC').all();
    return NextResponse.json(todos);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const result = db.prepare('INSERT INTO todos (title) VALUES (?)').run(title);
    const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(result.lastInsertRowid);

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 });
  }
}