'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface Todo {
  id: number;
  title: string;
  completed: number;
  created_at: string;
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchTodos = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/todos', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch todos: ${response.statusText}`);
      }

      const data = await response.json();
      setTodos(data);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch todos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  useEffect(() => {
    // Focus input on mount and whenever todos change
    inputRef.current?.focus();
  }, [todos]);

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTodo = newTodo.trim();
    if (!trimmedTodo) {
      setError('Please enter a todo item');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmedTodo }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create todo');
      }

      const newTodoItem = await response.json();
      setTodos([newTodoItem, ...todos]);
      setNewTodo('');
    } catch (error) {
      console.error('Failed to add todo:', error);
      setError(error instanceof Error ? error.message : 'Failed to add todo');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTodo = async (id: number, completed: number) => {
    const previousTodos = [...todos];

    // Optimistic update
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: completed ? 0 : 1 } : todo
    ));

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      });

      if (!response.ok) {
        throw new Error('Failed to update todo');
      }

      const updatedTodo = await response.json();
      setTodos(todos.map(todo =>
        todo.id === id ? updatedTodo : todo
      ));
    } catch (error) {
      console.error('Failed to toggle todo:', error);
      setTodos(previousTodos); // Revert on error
      setError('Failed to update todo');
    }
  };

  const deleteTodo = async (id: number) => {
    const previousTodos = [...todos];

    // Optimistic update
    setTodos(todos.filter(todo => todo.id !== id));

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete todo');
      }
    } catch (error) {
      console.error('Failed to delete todo:', error);
      setTodos(previousTodos); // Revert on error
      setError('Failed to delete todo');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Todo App</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={addTodo} className="flex gap-2 mb-6">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Add a new todo..."
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              disabled={submitting}
              className="flex-1"
              autoFocus
            />
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add'}
            </Button>
          </form>

          <div className="space-y-2">
            {todos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No todos yet. Add one to get started!
              </p>
            ) : (
              todos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <Checkbox
                    checked={Boolean(todo.completed)}
                    onCheckedChange={() => toggleTodo(todo.id, todo.completed)}
                  />
                  <span
                    className={`flex-1 ${
                      todo.completed ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {todo.title}
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteTodo(todo.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            {todos.length} {todos.length === 1 ? 'item' : 'items'} total
            {' • '}
            {todos.filter(t => !t.completed).length} active
            {' • '}
            {todos.filter(t => t.completed).length} completed
          </div>
        </CardContent>
      </Card>
    </div>
  );
}