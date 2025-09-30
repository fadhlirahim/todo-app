import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'complete-all') {
      const stmt = db.prepare('UPDATE todos SET completed = 1 WHERE completed = 0');
      stmt.run();
      return NextResponse.json({ success: true, message: 'All todos marked as complete' });
    } else if (action === 'clear-completed') {
      const stmt = db.prepare('DELETE FROM todos WHERE completed = 1');
      stmt.run();
      return NextResponse.json({ success: true, message: 'Completed todos cleared' });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}