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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // all, active, completed
    const sortBy = searchParams.get('sortBy'); // priority, due_date, created_at
    const category = searchParams.get('category');

    let query = 'SELECT * FROM todos WHERE 1=1';
    const params: any[] = [];

    if (filter === 'active') {
      query += ' AND completed = 0';
    } else if (filter === 'completed') {
      query += ' AND completed = 1';
    }

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    // Default sorting
    if (sortBy === 'priority') {
      query += ' ORDER BY CASE priority WHEN "urgent" THEN 1 WHEN "high" THEN 2 WHEN "medium" THEN 3 WHEN "low" THEN 4 END, created_at DESC';
    } else if (sortBy === 'due_date') {
      query += ' ORDER BY due_date IS NULL, due_date ASC, created_at DESC';
    } else if (sortBy === 'position') {
      query += ' ORDER BY position ASC, created_at DESC';
    } else {
      query += ' ORDER BY created_at DESC';
    }

    const todos = db.prepare(query).all(...params) as Todo[];
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
    const { title, priority = 'medium', due_date, category } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (priority && !['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return NextResponse.json(
        { error: 'Priority must be one of: low, medium, high, urgent' },
        { status: 400 }
      );
    }

    const stmt = db.prepare(
      'INSERT INTO todos (title, completed, priority, due_date, category) VALUES (?, 0, ?, ?, ?)'
    );
    const result = stmt.run(title.trim(), priority, due_date || null, category || null);

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